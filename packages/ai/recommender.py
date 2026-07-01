import os
import json
import argparse
from typing import List, Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from google import genai
from google.genai import types

# Handle imports whether run as a script or imported as a package
try:
    from .embeddings import generate_embedding, get_genai_client, get_db_connection
except ImportError:
    from embeddings import generate_embedding, get_genai_client, get_db_connection

def find_alternative_components(
    conn, 
    component_id_or_mpn: str, 
    limit: int = 5, 
    exact_pin_match: bool = True
) -> List[Dict[str, Any]]:
    """
    Finds alternative components based on vector similarity of their datasheet specs.
    Optionally restricts results to components within the same category and with the exact same pin count.
    """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # 1. Fetch the target component's details, embedding, and pin count
        cur.execute("""
            SELECT c.id, c.mpn, c."categoryId", c.description, d.embedding, COUNT(p.id) as pin_count
            FROM "Component" c
            JOIN "Datasheet" d ON d."componentId" = c.id
            LEFT JOIN "Pin" p ON p."componentId" = c.id
            WHERE c.id = %s OR c.mpn = %s
            GROUP BY c.id, d.embedding
        """, (component_id_or_mpn, component_id_or_mpn))
        
        target = cur.fetchone()
        if not target:
            print(f"Target component '{component_id_or_mpn}' not found or lacks datasheet embedding.")
            return []
            
        target_id = target["id"]
        target_mpn = target["mpn"]
        category_id = target["categoryId"]
        target_embedding = target["embedding"]
        target_pin_count = target["pin_count"]
        
        if not target_embedding:
            print(f"Component '{target_mpn}' has no vector embedding stored.")
            return []
            
        # 2. Query pgvector for components in the same category
        # Using the cosine distance operator <=> in pgvector.
        # Similarity = 1 - distance
        query = """
            SELECT 
                c.id, 
                c.mpn, 
                c.description, 
                c.specs,
                m.name as manufacturer_name,
                (1 - (d.embedding <=> %s::vector)) AS similarity,
                COUNT(p.id) as pin_count
            FROM "Component" c
            JOIN "Datasheet" d ON d."componentId" = c.id
            JOIN "Manufacturer" m ON c."manufacturerId" = m.id
            LEFT JOIN "Pin" p ON p."componentId" = c.id
            WHERE c."categoryId" = %s 
              AND c.id != %s
            GROUP BY c.id, d.embedding, m.name
        """
        
        params = [target_embedding, category_id, target_id]
        
        # Apply pin match constraint if requested
        if exact_pin_match:
            query += " HAVING COUNT(p.id) = %s"
            params.append(target_pin_count)
            
        query += " ORDER BY similarity DESC LIMIT %s"
        params.append(limit)
        
        cur.execute(query, tuple(params))
        alternatives = cur.fetchall()
        
        # Parse specs JSON for each alternative
        for alt in alternatives:
            if isinstance(alt["specs"], str):
                try:
                    alt["specs"] = json.loads(alt["specs"])
                except Exception:
                    pass
                    
        return alternatives

def recommend_components(conn, user_query: str, limit: int = 3) -> str:
    """
    Performs a RAG (Retrieval-Augmented Generation) query.
    1. Generates an embedding for the user's natural language query.
    2. Retrieves the top semantically matching components from PostgreSQL using pgvector.
    3. Synthesizes a conversational recommendation using Gemini 1.5 Pro.
    """
    print(f"Embedding user query: '{user_query}'...")
    query_embedding = generate_embedding(user_query, dimensions=384)
    vector_str = "[" + ",".join(str(val) for val in query_embedding) + "]"
    
    # 1. Retrieve most similar components using vector cosine similarity
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT 
                c.id, 
                c.mpn, 
                c.description, 
                c.specs,
                m.name as manufacturer_name,
                (1 - (d.embedding <=> %s::vector)) AS similarity
            FROM "Component" c
            JOIN "Datasheet" d ON d."componentId" = c.id
            JOIN "Manufacturer" m ON c."manufacturerId" = m.id
            ORDER BY similarity DESC
            LIMIT %s
        """, (vector_str, limit))
        
        retrieved_parts = cur.fetchall()
        
    if not retrieved_parts:
        return "I couldn't find any components matching your query in the database. Please try a different query or make sure components are ingested."
        
    # Format retrieved components for the LLM context
    context_parts = []
    for part in retrieved_parts:
        specs_dict = part["specs"]
        if isinstance(specs_dict, str):
            try:
                specs_dict = json.loads(specs_dict)
            except Exception:
                specs_dict = {}
                
        summary = specs_dict.get("summary", "") or part["description"]
        key_params = specs_dict.get("key_parameters", {})
        param_str = ", ".join(f"{k}: {v}" for k, v in key_params.items()) if key_params else "N/A"
        
        context_parts.append(
            f"- MPN: {part['mpn']}\n"
            f"  Manufacturer: {part['manufacturer_name']}\n"
            f"  Similarity Score: {part['similarity']:.4f}\n"
            f"  Description: {part['description']}\n"
            f"  Summary: {summary}\n"
            f"  Key Specs: {param_str}\n"
        )
        
    context_text = "\n".join(context_parts)
    
    # 2. Use Gemini 1.5 Pro to synthesize the final recommendation
    client = get_genai_client()
    
    prompt = f"""
    You are an expert electronics systems engineer. A user is looking for component recommendations.
    Based on their query and the semantically retrieved components from our database, provide a conversational, professional, and highly technical recommendation.
    
    User Query: "{user_query}"
    
    Retrieved Components:
    {context_text}
    
    Instructions:
    1. Directly address the user's requirements.
    2. Explain why the retrieved components are suitable (or highlight any limitations if they do not fully match).
    3. Compare the retrieved parts briefly based on their specifications (e.g., supply voltage, package, features).
    4. Provide clear guidance on which component is the best choice for their specific application.
    5. Maintain a professional, engineering-focused tone. Do not hallucinate any specifications not provided in the retrieved data.
    """
    
    print("Generating recommendation using Gemini 1.5 Pro...")
    response = client.models.generate_content(
        model='gemini-1.5-pro',
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3, # Balanced temperature for helpful, structured reasoning
        )
    )
    
    return response.text

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ElectroHub Semantic Retrieval and Recommender CLI.")
    subparsers = parser.add_subparsers(dest="command", help="Subcommand to run")
    
    # Alternatives subcommand
    alt_parser = subparsers.add_parser("alternatives", help="Find pin-compatible alternative components.")
    alt_parser.add_argument("--part", required=True, help="Database UUID or MPN of the target component.")
    alt_parser.add_argument("--limit", type=int, default=5, help="Number of alternatives to return.")
    alt_parser.add_argument("--ignore-pins", action="store_true", help="Disable the exact pin-count match constraint.")
    
    # Recommend subcommand
    rec_parser = subparsers.add_parser("recommend", help="Get conversational component recommendations (RAG).")
    rec_parser.add_argument("--query", required=True, help="Natural language query (e.g., 'low noise op-amp for audio preamp').")
    rec_parser.add_argument("--limit", type=int, default=3, help="Number of components to retrieve for context.")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        exit(1)
        
    try:
        conn = get_db_connection()
        
        if args.command == "alternatives":
            exact_pin = not args.ignore_pins
            print(f"Finding alternatives for '{args.part}' (Exact pin match: {exact_pin})...")
            alts = find_alternative_components(conn, args.part, limit=args.limit, exact_pin_match=exact_pin)
            
            if not alts:
                print("No alternatives found.")
            else:
                print(f"\nFound {len(alts)} alternative(s):")
                for i, alt in enumerate(alts, 1):
                    print(f"\n{i}. {alt['mpn']} by {alt['manufacturer_name']}")
                    print(f"   Similarity: {alt['similarity']:.4f} | Pin Count: {alt['pin_count']}")
                    print(f"   Description: {alt['description']}")
                    
        elif args.command == "recommend":
            recommendation = recommend_components(conn, args.query, limit=args.limit)
            print("\n--- Recommendation ---")
            print(recommendation)
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
        exit(1)
