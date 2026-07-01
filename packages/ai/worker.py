import os
import time
import tempfile
import urllib.request
import traceback
import json
import psycopg2
from psycopg2.extras import RealDictCursor

# Import from local modules
try:
    from extractor import extract_datasheet_features, DatasheetExtraction
    from embeddings import update_component_embedding, get_db_connection
except ImportError:
    from .extractor import extract_datasheet_features, DatasheetExtraction
    from .embeddings import update_component_embedding, get_db_connection

def download_file(url: str) -> str:
    """Downloads a file from a URL to a temporary file and returns the path."""
    suffix = ".pdf"
    fd, temp_path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    print(f"Downloading {url} to {temp_path}...")
    
    # Set a user-agent to avoid being blocked by some sites
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'ElectroHub-Worker/1.0'}
    )
    with urllib.request.urlopen(req) as response, open(temp_path, 'wb') as out_file:
        out_file.write(response.read())
    return temp_path

def process_pending_extractions(conn) -> int:
    """
    Finds datasheets that have not been processed by the AI extractor,
    downloads the PDF, extracts structured data using Gemini, and updates the database.
    """
    processed_count = 0
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT d.id as datasheet_id, d."componentId", d."pdfUrl", c.mpn, c.id as component_id
            FROM "Datasheet" d
            JOIN "Component" c ON d."componentId" = c.id
            WHERE d."extractedText" IS NULL
            LIMIT 5
        """)
        pending = cur.fetchall()
        
        if not pending:
            return 0
            
        print(f"Found {len(pending)} datasheets needing AI extraction.")
        
        for item in pending:
            temp_pdf = None
            try:
                mpn = item["mpn"]
                pdf_url = item["pdfUrl"]
                component_id = item["component_id"]
                datasheet_id = item["datasheet_id"]
                
                print(f"Processing extraction for {mpn} (URL: {pdf_url})...")
                
                # Check if it's a local file or a URL
                if pdf_url.startswith("http://") or pdf_url.startswith("https://"):
                    temp_pdf = download_file(pdf_url)
                    pdf_path = temp_pdf
                else:
                    pdf_path = pdf_url # Assume it's a local path
                
                # Extract features using Gemini
                extracted: DatasheetExtraction = extract_datasheet_features(pdf_path, mpn)
                
                # Prepare specs JSON to store in the database
                specs_data = {
                    "summary": extracted.summary,
                    "key_parameters": extracted.key_parameters,
                    "electrical_characteristics": {
                        "absolute_maximums": extracted.electrical_characteristics.absolute_maximums.model_dump() if extracted.electrical_characteristics.absolute_maximums else {},
                        "operating_conditions": extracted.electrical_characteristics.operating_conditions.model_dump() if extracted.electrical_characteristics.operating_conditions else {}
                    },
                    "typical_application_circuits": [circ.model_dump() for circ in extracted.typical_application_circuits]
                }
                
                # Start transaction for database updates
                # 1. Update Component description and specs
                cur.execute("""
                    UPDATE "Component"
                    SET description = %s, specs = %s::jsonb, "updatedAt" = NOW()
                    WHERE id = %s
                """, (extracted.summary, json.dumps(specs_data), component_id))
                
                # 2. Delete existing pins to prevent duplicates
                cur.execute('DELETE FROM "Pin" WHERE "componentId" = %s', (component_id,))
                
                # 3. Insert new pins
                for pin in extracted.pins:
                    # Map functional_group to PinType enum
                    # Enums in Prisma: POWER, GROUND, INPUT, OUTPUT, BIDIRECT, ANALOG, PASSIVE
                    pin_type = "PASSIVE"
                    fg = pin.functional_group.upper() if pin.functional_group else "PASSIVE"
                    if fg in ["POWER", "GROUND", "INPUT", "OUTPUT", "BIDIRECT", "ANALOG", "PASSIVE"]:
                        pin_type = fg
                    
                    cur.execute("""
                        INSERT INTO "Pin" (id, "componentId", number, name, type, "functionalGroup", description)
                        VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s)
                    """, (component_id, pin.pin_number, pin.pin_name, pin_type, pin.functional_group, pin.description))
                
                # 4. Update Datasheet extractedText
                # We save the full JSON of extracted data as text
                cur.execute("""
                    UPDATE "Datasheet"
                    SET "extractedText" = %s
                    WHERE id = %s
                """, (extracted.model_dump_json(), datasheet_id))
                
                conn.commit()
                print(f"Successfully extracted and saved data for {mpn}.")
                processed_count += 1
                
            except Exception as e:
                print(f"Error extracting datasheet for component {item['mpn']}: {e}")
                traceback.print_exc()
                conn.rollback()
            finally:
                if temp_pdf and os.path.exists(temp_pdf):
                    try:
                        os.remove(temp_pdf)
                        print(f"Cleaned up temporary file {temp_pdf}")
                    except Exception as e:
                        print(f"Failed to remove temporary file {temp_pdf}: {e}")
                        
    return processed_count

def process_pending_embeddings(conn) -> int:
    """
    Finds all components that have extracted text but do not have an embedding,
    generates embeddings, and updates the database.
    """
    processed_count = 0
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT d.id, d."componentId", c.mpn
            FROM "Datasheet" d
            JOIN "Component" c ON d."componentId" = c.id
            WHERE d."extractedText" IS NOT NULL AND d.embedding IS NULL
            LIMIT 10
        """)
        pending = cur.fetchall()
        
        if not pending:
            return 0
            
        print(f"Found {len(pending)} components needing embedding generation.")
        
        for item in pending:
            try:
                update_component_embedding(conn, item["componentId"])
                processed_count += 1
            except Exception as e:
                print(f"Error generating embedding for component {item['mpn']}: {e}")
                conn.rollback()
                
    return processed_count

def main():
    print("ElectroHub AI Background Worker starting...")
    poll_interval = int(os.environ.get("POLL_INTERVAL", "10"))
    
    while True:
        try:
            conn = get_db_connection()
            
            # Process extractions first
            extractions_processed = process_pending_extractions(conn)
            
            # Process embeddings next
            embeddings_processed = process_pending_embeddings(conn)
            
            conn.close()
            
            if extractions_processed > 0 or embeddings_processed > 0:
                print(f"Cycle complete. Processed {extractions_processed} extractions and {embeddings_processed} embeddings.")
            else:
                # No work done, sleep
                time.sleep(poll_interval)
                
        except Exception as e:
            print(f"Worker loop encountered an error: {e}")
            traceback.print_exc()
            time.sleep(poll_interval)

if __name__ == "__main__":
    main()
