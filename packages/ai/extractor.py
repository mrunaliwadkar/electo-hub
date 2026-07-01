import os
import json
import argparse
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# Define the Pydantic schema for structured extraction
class PinEntry(BaseModel):
    pin_number: str = Field(
        description="The physical pin number or identifier, e.g., '1', 'A1', 'B12'."
    )
    pin_name: str = Field(
        description="The name of the pin, e.g., 'VCC', 'GND', 'PA0', 'TXD'."
    )
    description: str = Field(
        description="Detailed description of the pin's function and electrical characteristics."
    )
    functional_group: str = Field(
        description="The functional category of the pin. Must be exactly one of: 'POWER', 'GROUND', 'INPUT', 'OUTPUT', 'BIDIRECT', 'ANALOG', or 'PASSIVE'."
    )

class AbsoluteMaximumRatings(BaseModel):
    max_supply_voltage_v: Optional[float] = Field(
        None, description="Maximum absolute supply voltage in Volts (V)."
    )
    min_operating_temperature_c: Optional[float] = Field(
        None, description="Minimum absolute operating or storage temperature in Celsius (°C)."
    )
    max_operating_temperature_c: Optional[float] = Field(
        None, description="Maximum absolute operating or storage temperature in Celsius (°C)."
    )
    max_output_current_a: Optional[float] = Field(
        None, description="Maximum output or pin current in Amperes (A)."
    )
    additional_ratings: Dict[str, str] = Field(
        default_factory=dict,
        description="Any other critical absolute maximum ratings (e.g., ESD rating, power dissipation)."
    )

class OperatingConditions(BaseModel):
    min_supply_voltage_v: Optional[float] = Field(
        None, description="Minimum recommended operating supply voltage in Volts (V)."
    )
    typ_supply_voltage_v: Optional[float] = Field(
        None, description="Typical recommended operating supply voltage in Volts (V)."
    )
    max_supply_voltage_v: Optional[float] = Field(
        None, description="Maximum recommended operating supply voltage in Volts (V)."
    )
    typ_operating_current_a: Optional[float] = Field(
        None, description="Typical operating, active, or quiescent current in Amperes (A)."
    )
    additional_conditions: Dict[str, str] = Field(
        default_factory=dict,
        description="Any other recommended operating conditions."
    )

class ElectricalCharacteristics(BaseModel):
    absolute_maximums: AbsoluteMaximumRatings = Field(
        description="Absolute maximum ratings which, if exceeded, may damage the device."
    )
    operating_conditions: OperatingConditions = Field(
        description="Recommended operating conditions for normal device functionality."
    )

class ApplicationCircuit(BaseModel):
    title: str = Field(
        description="Title or name of the typical application circuit, e.g., 'Typical LDO Regulator Circuit'."
    )
    description: str = Field(
        description="Detailed explanation of how this application circuit works, its configuration, and its purpose."
    )
    key_components: List[str] = Field(
        description="List of key external components required for the circuit, e.g., ['10uF ceramic capacitor', '10k pull-up resistor']."
    )

class DatasheetExtraction(BaseModel):
    mpn: str = Field(
        description="Manufacturer Part Number, e.g., 'ESP32-S3', 'LM317', 'NE555'."
    )
    manufacturer: str = Field(
        description="Manufacturer name, e.g., 'Texas Instruments', 'Espressif Systems', 'STMicroelectronics'."
    )
    summary: str = Field(
        description="A concise 2-3 sentence functional summary of the component's primary purpose, architecture, and typical use cases."
    )
    pins: List[PinEntry] = Field(
        description="List of all pins extracted from the pin configuration and function tables."
    )
    electrical_characteristics: ElectricalCharacteristics = Field(
        description="Absolute maximum ratings and recommended operating conditions."
    )
    typical_application_circuits: List[ApplicationCircuit] = Field(
        description="Typical application circuits, reference designs, or schematics described in the datasheet."
    )
    key_parameters: Dict[str, str] = Field(
        description="Key parametric specifications and electrical characteristics (e.g., 'RDS(on)': '15 mΩ', 'Quiescent Current': '12 µA', 'ADC Resolution': '12-bit')."
    )

def get_genai_client() -> genai.Client:
    """Initializes and returns the Google GenAI client."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set.")
    return genai.Client(api_key=api_key)

def extract_datasheet_features(pdf_path: str, mpn: Optional[str] = None) -> DatasheetExtraction:
    """
    Uploads a datasheet PDF to the Gemini File API, extracts structured information
    using Gemini 1.5 Pro, and deletes the file from the API afterwards.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"Local PDF file not found: {pdf_path}")

    client = get_genai_client()
    
    print(f"Uploading {pdf_path} to Gemini File API...")
    # Upload the file using the files API
    file_ref = client.files.upload(file=pdf_path)
    print(f"Uploaded successfully. File name on server: {file_ref.name}")
    
    mpn_context = f" for part number '{mpn}'" if mpn else ""
    prompt = f"""
    You are an expert electronics engineer and data architect. 
    Analyze the uploaded datasheet PDF{mpn_context}.
    
    Perform the following tasks:
    1. Extract a detailed 2-3 sentence functional description of the component.
    2. Extract the Pinout Table: columns [pin_number, pin_name, type, description].
       Ensure you classify 'type' (functional_group) strictly as one of:
       'POWER', 'GROUND', 'INPUT', 'OUTPUT', 'BIDIRECT', 'ANALOG', or 'PASSIVE'.
    3. Extract Electrical Characteristics, including Absolute Maximum Ratings and Operating Conditions.
       Normalize values to standard SI units (Volts, Amperes, Celsius) where possible.
    4. Summarize typical application circuits, including their titles, descriptions, and key external components.
    5. Extract key parametric specifications (e.g. input voltage, quiescent current, RDS(on), frequency, resolution).
    
    Return the result strictly as JSON matching the requested schema.
    Ensure all fields are populated accurately based on the datasheet. Do not fabricate any data.
    """
    
    try:
        print("Querying Gemini 1.5 Pro (vision-enabled)...")
        response = client.models.generate_content(
            model='gemini-1.5-pro',
            contents=[file_ref, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DatasheetExtraction,
                temperature=0.1,  # Low temperature for high accuracy and factual extraction
            ),
        )
        
        # Parse the JSON response into the Pydantic model to validate
        result_json = json.loads(response.text)
        return DatasheetExtraction(**result_json)
        
    finally:
        # Clean up the file from the Gemini File API
        print(f"Cleaning up remote file {file_ref.name}...")
        try:
            client.files.delete(name=file_ref.name)
            print("Remote file deleted successfully.")
        except Exception as e:
            print(f"Warning: Failed to delete remote file {file_ref.name}: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract structured JSON data from component datasheet PDFs using Gemini 1.5 Pro.")
    parser.add_argument("--pdf", required=True, help="Path to the local datasheet PDF file.")
    parser.add_argument("--mpn", help="Optional Manufacturer Part Number to help guide extraction.")
    parser.add_argument("--output", help="Path to save the output JSON file. If not specified, prints to stdout.")
    
    args = parser.parse_args()
    
    try:
        extracted_data = extract_datasheet_features(args.pdf, args.mpn)
        json_output = extracted_data.model_dump_json(indent=2)
        
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(json_output)
            print(f"Successfully saved structured data to {args.output}")
        else:
            print("\n--- Extracted Structured JSON ---")
            print(json_output)
            
    except Exception as e:
        print(f"Error during extraction: {e}")
        exit(1)
