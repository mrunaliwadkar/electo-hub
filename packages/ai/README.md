# ElectroHub AI Extraction & Semantic Retrieval Layer

This package contains the core artificial intelligence modules for **ElectroHub**—the Electronics Component & Circuit Intelligence Platform. It handles the offline ingestion of PDF datasheets, generates search-optimized vector embeddings, and provides a semantic recommendation layer (RAG) using PostgreSQL with the `pgvector` extension and Google Gemini.

---

## 1. AI Architecture Overview

The ElectroHub AI layer is structured into three main components:

```mermaid
flowchart TD
    subgraph Ingestion Phase
        A[Datasheet PDF] -->|Upload to File API| B(Gemini 1.5 Pro)
        B -->|Vision + Schema Parsing| C[Structured JSON]
        C -->|Insert| D[(PostgreSQL)]
    end

    subgraph Embedding Phase
        D -->|Select Unembedded Component| E[Prepare Rich Text]
        E -->|text-embedding-004| F(Gemini Embedding API)
        F -->|384-dim Vector| G[(pgvector)]
    end

    subgraph Retrieval & RAG Phase
        H[User Natural Language Query] -->|text-embedding-004| I(Query Vector)
        I -->|Cosine Similarity| G
        G -->|Top N Components| J[RAG Prompt Synthesizer]
        J -->|Gemini 1.5 Pro| K[Conversational Recommendation]
    end
```

1. **Information Extraction (`extractor.py`)**: A multimodal ingestion script that uploads datasheet PDFs to the Gemini File API and uses Gemini 1.5 Pro's vision capabilities to extract structured data (pinouts, absolute maximums, operating conditions, parameters) matching a strict Pydantic schema.
2. **Embedding Generation (`embeddings.py`)**: A script that processes components in the database, constructs a search-optimized text representation, generates a 384-dimensional vector embedding using Gemini's `text-embedding-004` model, and saves it in the `Datasheet` table.
3. **Semantic Retrieval & Recommender (`recommender.py`)**: A script containing the logic for:
   - **Alternative Component Matching**: Finding pin-compatible alternatives in the same category using pgvector cosine similarity and pin-count constraints.
   - **Conversational Recommendations (RAG)**: Answering user queries by retrieving the most relevant components and using Gemini 1.5 Pro to generate engineering-focused, conversational recommendations.

---

## 2. Gemini PDF Extraction Prompt & Schema

### Extraction Prompt

Gemini 1.5 Pro is queried with the PDF file reference and the following system prompt:

```text
You are an expert electronics engineer and data architect. 
Analyze the uploaded datasheet PDF.

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
```

### JSON Schema (Pydantic Model)

The extraction is validated against a strict Pydantic model to prevent schema drift:

```python
class PinEntry(BaseModel):
    pin_number: str
    pin_name: str
    description: str
    functional_group: str  # POWER, GROUND, INPUT, OUTPUT, BIDIRECT, ANALOG, PASSIVE

class AbsoluteMaximumRatings(BaseModel):
    max_supply_voltage_v: Optional[float]
    min_operating_temperature_c: Optional[float]
    max_operating_temperature_c: Optional[float]
    max_output_current_a: Optional[float]
    additional_ratings: Dict[str, str]

class OperatingConditions(BaseModel):
    min_supply_voltage_v: Optional[float]
    typ_supply_voltage_v: Optional[float]
    max_supply_voltage_v: Optional[float]
    typ_operating_current_a: Optional[float]
    additional_conditions: Dict[str, str]

class ElectricalCharacteristics(BaseModel):
    absolute_maximums: AbsoluteMaximumRatings
    operating_conditions: OperatingConditions

class ApplicationCircuit(BaseModel):
    title: str
    description: str
    key_components: List[str]

class DatasheetExtraction(BaseModel):
    mpn: str
    manufacturer: str
    summary: str
    pins: List[PinEntry]
    electrical_characteristics: ElectricalCharacteristics
    typical_application_circuits: List[ApplicationCircuit]
    key_parameters: Dict[str, str]
```

---

## 3. RAG and Alternative Component Matching

### Alternative Component Matching

Alternative component matching uses **pgvector** to find components that are functionally similar but also physically compatible.
- **Cosine Distance (`<=>`)**: We calculate the distance between the target component's datasheet embedding and all other components in the same category.
- **Pin Count Constraint**: To ensure a part can act as a drop-in replacement, we enforce that the alternative component must have the **exact same number of pins** as the target component.

#### PostgreSQL Query
```sql
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
HAVING COUNT(p.id) = %s
ORDER BY similarity DESC
LIMIT %s;
```

### Conversational Recommendation (RAG)

When a user asks a natural language question like:
> *"I need a low-noise, low-power instrumentation amplifier for a wearable ECG monitor. What do we have?"*

The system performs the following pipeline:
1. **Query Embedding**: The query is embedded using Gemini's `text-embedding-004` model with `output_dimensionality=384`.
2. **Vector Search**: The database is queried for the top $N$ components closest to the query vector.
3. **Context Construction**: The metadata, descriptions, and key parameters of the retrieved components are formatted into a markdown text block.
4. **LLM Synthesis**: Gemini 1.5 Pro is provided with the user query and the retrieved component details. It synthesizes a technical recommendation, comparing the parts and explaining which one is best suited for the user's application.

---

## 4. Setup & Usage Instructions

### Prerequisites

Ensure you have a PostgreSQL database running with the `pgvector` extension enabled:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Installation

1. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

2. Set your environment variables:
   ```bash
   # On Windows (PowerShell)
   $env:GEMINI_API_KEY="your-gemini-api-key"
   $env:DATABASE_URL="postgresql://user:password@host:port/database"
   
   # On Linux/macOS
   export GEMINI_API_KEY="your-gemini-api-key"
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Running the Extractor

To extract structured JSON from a local datasheet PDF:
```bash
python extractor.py --pdf path/to/datasheet.pdf --mpn LM317 --output lm317_data.json
```

### Running the Embedding Generator

To generate embeddings for all components in the database that are currently missing them:
```bash
python embeddings.py --all-pending
```

To update the embedding for a single component:
```bash
python embeddings.py --component-id <component-uuid>
```

### Running the Recommender CLI

To find 5 pin-compatible alternatives for a component:
```bash
python recommender.py alternatives --part "LM317" --limit 5
```

To run a conversational recommendation query:
```bash
python recommender.py recommend --query "I need a high efficiency buck regulator that can output 3.3V from a 12V input" --limit 3
```
