import os
import json
import argparse
from typing import List, Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from google import genai
from google.genai import types

def get_genai_client() -> genai.Client:
    """Initializes and returns the Google GenAI client."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set.")
    return genai.Client(api_key=api_key)

def get_db_connection() -> Any:
    """Creates and returns a connection to the PostgreSQL database."""
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is not set.")
    return psycopg2.connect(db_url)

def generate_embedding(text: str, dimensions: int = 384) -> List[float]:
    """
    Generates a text embedding using Gemini's text-embedding-004 model.
    Truncates/pools the output to the specified dimensions (default: 384).
    """
    client = get_genai_client()
    
    # Use the new SDK to generate embeddings
    response = client.models.embed_content(
        model='text-embedding-004',
        contents=text,
        config=types.EmbedContentConfig(
            output_dimensionality=dimensions
        )
    )
    
    if not response.embeddings or len(response.embeddings) == 0:
        raise ValueError("Failed to generate embedding: empty response from API.")
        
    return response.embeddings[0].values

def prepare_text_for_embedding(component: Dict[str, Any]) -> str:
    """
    Creates a rich, search-friendly text representation of a component
    by combining its MPN, manufacturer, description, summary, and specifications.
    """
    mpn = component.get("mpn", "")
    mfr_name = component.get("mfr_name", "") or component.get("manufacturer_name", "")
    description = component.get("description", "")
    
    # Parse specs JSON if it's a string, or use as dict
    specs = component.get("specs", {})
    if isinstance(specs, str):
        try:
            specs = json.loads(specs)
        except Exception:
            specs = {}
            
    summary = specs.get("summary", "") or component.get("summary", "")
    
    parts = [
        f"Component MPN: {mpn}",
        f"Manufacturer: {mfr_name}",
        f"Description: {description}"
    ]
    
    if summary:
        parts.append(f"Summary: {summary}")
        
    # Add key parameters
    key_params = specs.get("key_parameters", {})
    if key_params:
        param_str = ", ".join(f"{k}: {v}" for k, v in key_params.items())
        parts.append(f"Key Parameters: {param_str}")
        
    # Add electrical characteristics
    elec_char = specs.get("electrical_characteristics", {})
    if elec_char:
        abs_max = elec_char.get("absolute_maximums", {})
        if abs_max:
            max_ratings = []
            if abs_max.get("max_supply_voltage_v") is not None:
                max_ratings.append(f"Max Supply Voltage: {abs_max['max_supply_voltage_v']}V")
            if abs_max.get("max_operating_temperature_c") is not None:
                max_ratings.append(f"Max Temperature: {abs_max['max_operating_temperature_c']}°C")
            if abs_max.get("min_operating_temperature_c") is not None:
                max_ratings.append(f"Min Temperature: {abs_max['min_operating_temperature_c']}°C")
            if abs_max.get("max_output_current_a") is not None:
                max_ratings.append(f"Max Output Current: {abs_max['max_output_current_a']}A")
            if max_ratings:
                parts.append(f"Absolute Maximum Ratings: {', '.join(max_ratings)}")
                
        op_cond = elec_char.get("operating_conditions", {})
        if op_cond:
            conds = []
            if op_cond.get("min_supply_voltage_v") is not None:
                conds.append(f"Min Supply Voltage: {op_cond['min_supply_voltage_v']}V")
            if op_cond.get("typ_supply_voltage_v") is not None:
                conds.append(f"Typ Supply Voltage: {op_cond['typ_supply_voltage_v']}V")
            if op_cond.get("max_supply_voltage_v") is not None:
                conds.append(f"Max Supply Voltage: {op_cond['max_supply_voltage_v']}V")
            if op_cond.get("typ_operating_current_a") is not None:
                conds.append(f"Typ Operating Current: {op_cond['typ_operating_current_a']}A")
            if conds:
                parts.append(f"Operating Conditions: {', '.join(conds)}")
                
    return "\n".join(parts)

def update_component_embedding(conn, component_id: str) -> None:
    """
    Generates and updates the embedding for a single component.
    Creates a Datasheet record if it does not exist.
    """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Fetch the component along with its manufacturer name
        cur.execute("""
            SELECT c.id, c.mpn, c.description, c.specs, m.name as mfr_name
            FROM "Component" c
            JOIN "Manufacturer" m ON c."manufacturerId" = m.id
            WHERE c.id = %s
        """, (component_id,))
        component = cur.fetchone()
        
        if not component:
            raise ValueError(f"Component with ID {component_id} not found.")
            
        # Prepare text and generate embedding
        text_content = prepare_text_for_embedding(component)
        print(f"Generating 384-dimensional embedding for {component['mpn']}...")
        embedding = generate_embedding(text_content, dimensions=384)
        
        # Format embedding as a pgvector string: '[val1,val2,...]'
        vector_str = "[" + ",".join(str(val) for val in embedding) + "]"
        
        # Check if a Datasheet record already exists for this component
        cur.execute('SELECT id FROM "Datasheet" WHERE "componentId" = %s', (component_id,))
        datasheet = cur.fetchone()
        
        if datasheet:
            cur.execute("""
                UPDATE "Datasheet"
                SET "extractedText" = %s, embedding = %s::vector
                WHERE "componentId" = %s
            """, (text_content, vector_str, component_id))
            print(f"Updated existing Datasheet embedding for {component['mpn']}.")
        else:
            # Create a new Datasheet record (use a dummy pdfUrl since we don't have it here)
            pdf_url = f"https://electrohub.s3.amazonaws.com/datasheets/{component['mpn']}.pdf"
            cur.execute("""
                INSERT INTO "Datasheet" (id, "componentId", "pdfUrl", "extractedText", embedding)
                VALUES (gen_random_uuid(), %s, %s, %s, %s::vector)
            """, (component_id, pdf_url, text_content, vector_str))
            print(f"Created new Datasheet record and saved embedding for {component['mpn']}.")
            
    conn.commit()

def process_pending_embeddings(conn) -> int:
    """
    Finds all components that do not have an embedding in the Datasheet table,
    generates embeddings, and updates the database.
    """
    processed_count = 0
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Find components that either:
        # 1. Do not have a Datasheet record at all
        # 2. Have a Datasheet record but embedding is null
        cur.execute("""
            SELECT c.id, c.mpn
            FROM "Component" c
            LEFT JOIN "Datasheet" d ON d."componentId" = c.id
            WHERE d.id IS NULL OR d.embedding IS NULL
        """)
        pending = cur.fetchall()
        
        print(f"Found {len(pending)} components needing embedding generation.")
        
        for item in pending:
            try:
                update_component_embedding(conn, item["id"])
                processed_count += 1
            except Exception as e:
                print(f"Error processing component {item['mpn']} ({item['id']}): {e}")
                conn.rollback() # rollback current transaction and continue
                
    return processed_count

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate and update vector embeddings for ElectroHub components.")
    parser.add_argument("--component-id", help="Process a single component by its database UUID.")
    parser.add_argument("--all-pending", action="store_true", help="Process all components lacking embeddings.")
    
    args = parser.parse_args()
    
    if not args.component_id and not args.all_pending:
        parser.print_help()
        exit(1)
        
    try:
        conn = get_db_connection()
        print("Connected to PostgreSQL database.")
        
        if args.component_id:
            update_component_embedding(conn, args.component_id)
            print("Successfully updated component embedding.")
        elif args.all_pending:
            count = process_pending_embeddings(conn)
            print(f"Successfully processed {count} components.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
        exit(1)
