# ElectroHub: Architecture Master Plan & Product Specification

This document serves as the authoritative architectural blueprint and engineering specification for **ElectroHub**—the Electronics Component & Circuit Intelligence Platform. Designed by the Autonomous Software Organization under the direction of **Agent 0 (Principal Technical Director)**, this plan translates the findings of the ElectroHub Deep Research into a production-ready, highly scalable, and deployable system.

---

## 1. Research Alignment Report

The design of ElectroHub directly addresses the market failures, workflow friction, and user pain points identified in the research document:

| Research Finding / Pain Point | ElectroHub Architectural Solution | Implementation Details |
| :--- | :--- | :--- |
| **Mouser Unit Fragmentation**: Mouser splits `0.01uF` and `10nF` into separate filters, causing discovery failure. | **Unit Normalization Engine** (Agent 2) | Algorithmic parsing converts all values into standard SI floats (Farads, Ohms, etc.) for unified numeric range filtering. |
| **DigiKey API Rate Limits & UI Latency**: Excessive latency and aggressive CAPTCHAs during search. | **Typesense Search Infrastructure** (Agent 2) | C++ based, RAM-first search engine delivering <50ms query latency; data cached asynchronously from distributor APIs. |
| **Datasheet-to-Design Friction**: Critical specs, pinouts, and application circuits are locked in unstructured PDFs. | **Gemini PDF Extraction Pipeline** (Agent 3) | Offline batch processing using Gemini 1.5 Pro's multimodal vision to extract structured JSON (specs, pinouts, limits). |
| **Footprint Trust Deficit**: Engineers do not trust downloaded footprints without verifying them against datasheets. | **Datasheet-Native UI** (Agent 5) | Component dashboard displays the CAD footprint side-by-side with the AI-extracted mechanical drawing and PDF datasheet. |
| **Supply Chain Volatility & EOL**: Obsolescence issues caught too late, and difficulty finding drop-in replacements. | **pgvector Alternative Component Matching** (Agent 3) | Cosine similarity on embeddings of structural specifications + pinout matching to suggest verified, active drop-in replacements. |
| **EasyEDA Ecosystem Lock-in**: Seamless CAD integration but low-quality symbols and locked to LCSC/JLCPCB. | **Standardized Monorepo / CAD Export** (Agent 4) | High-fidelity, verified symbol/footprint generation with export support for KiCad and Altium formats. |
| **Unnecessary Features (SPICE / Routing)**: High complexity, low user trust, and market saturation. | **Feature Triage & Scope Exclusion** (Agent 0) | Excluded browser-based SPICE simulation and PCB routing. Positioned ElectroHub as the intelligence and sourcing layer. |

---

## 2. System Architecture

ElectroHub utilizes a decoupled microservices architecture coordinated within a Turborepo monorepo.

### 2.1 C4 Container Diagram
```mermaid
graph TD
    User([User / Engineer]) <--> |HTTPS| FE[Next.js 15 Frontend - Vercel]
    FE <--> |JSON / REST| BE[Next.js API Routes - Vercel / Railway]
    BE <--> |Prisma ORM| DB[(PostgreSQL + pgvector - Supabase)]
    BE <--> |Search Queries| TS[[Typesense Search - Railway]]
    BE <--> |Cache / Rate Limit| RD[(Redis - Railway)]
    
    %% Asynchronous Ingestion Pipeline
    Worker[AI Ingestion Worker - Python] --> |Reads PDFs| PDF[Datasheet PDF Store - Cloudflare R2]
    Worker --> |Extracts Data| Gemini[Google Gemini 1.5 Pro API]
    Worker --> |Writes Structured Specs| DB
    DB <--> |Sync Script| TS
```

### 2.2 Ingestion & Synchronization Workflow
```mermaid
sequenceDiagram
    autonumber
    participant Admin
    participant Worker as Ingestion Worker
    participant Gemini as Gemini 1.5 Pro
    participant DB as PostgreSQL
    participant TS as Typesense
    
    Admin->>Worker: Trigger Ingest (MPN + PDF URL)
    Worker->>Gemini: Send PDF Pages (Vision + Prompt)
    Gemini-->>Worker: Return Structured JSON (Pinouts, Specs, Limits)
    Worker->>DB: Insert Component, Pinout, and Datasheet records
    Worker->>DB: Generate & Save Vector Embedding (pgvector)
    Note over DB, TS: Asynchronous Sync
    DB->>TS: Ingest Normalized Attributes into Search Index
```

---

## 3. Database Architecture (Agent 1)

We implement a hybrid relational/document database using PostgreSQL. Universal fields are strictly typed, while highly variable parametric attributes are stored in a queryable `JSONB` column.

### 3.1 Prisma Schema (`packages/database/schema.prisma`)
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum LifecycleStatus {
  ACTIVE
  NRND // Not Recommended for New Designs
  EOL  // End of Life
  OBSOLETE
}

enum PinType {
  POWER
  GROUND
  INPUT
  OUTPUT
  BIDIRECT
  ANALOG
  PASSIVE
}

enum AssetType {
  SYMBOL
  FOOTPRINT
  MODEL_3D
}

model User {
  id            String          @id @default(uuid())
  name          String?
  email         String          @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          String          @default("USER") // USER, ADMIN
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  accounts      Account[]
  sessions      Session[]
  projects      Project[]
  favorites     Favorite[]
  conversations AIConversation[]
}

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Manufacturer {
  id         String      @id @default(uuid())
  name       String      @unique
  website    String?
  aliases    String[]    // Array of alternative names (e.g. ["TI", "Texas Inst"])
  components Component[]
}

model Category {
  id           String      @id @default(uuid())
  name         String
  parentId     String?
  parent       Category?   @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children     Category[]  @relation("CategoryHierarchy")
  path         String      @unique // e.g. "passives.capacitors.ceramic" for ltree-like queries
  components   Component[]
}

model Component {
  id             String             @id @default(uuid())
  mpn            String             @unique // Manufacturer Part Number
  description    String
  manufacturerId String
  manufacturer   Manufacturer       @relation(fields: [manufacturerId], references: [id])
  categoryId     String
  category       Category           @relation(fields: [categoryId], references: [id])
  lifecycle      LifecycleStatus    @default(ACTIVE)
  specs          Json               // JSONB holding dynamic parametric specifications
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
  datasheets     Datasheet[]
  pins           Pin[]
  assets         CadAsset[]
  stock          DistributorStock[]
  projectParts   ProjectComponent[]
  favorites      Favorite[]
}

model Datasheet {
  id            String    @id @default(uuid())
  componentId   String
  component     Component @relation(fields: [componentId], references: [id], onDelete: Cascade)
  pdfUrl        String
  extractedText String?   @db.Text
  embedding     Unsupported("vector(384)")? // pgvector 384-dimension embedding
}

model Pin {
  id          String    @id @default(uuid())
  componentId String
  component   Component @relation(fields: [componentId], references: [id], onDelete: Cascade)
  number      String    // Supports alphanumeric pins (e.g., "A1", "B12")
  name        String
  type        PinType   @default(PASSIVE)
  description String?

  @@unique([componentId, number])
}

model CadAsset {
  id          String    @id @default(uuid())
  componentId String
  component   Component @relation(fields: [componentId], references: [id], onDelete: Cascade)
  type        AssetType
  fileUrl     String
  checksum    String?
}

model DistributorStock {
  id            String    @id @default(uuid())
  componentId   String
  component     Component @relation(fields: [componentId], references: [id], onDelete: Cascade)
  distributor   String    // e.g. "DIGIKEY", "MOUSER", "LCSC"
  sku           String
  stockQty      Int       @default(0)
  priceTiers    Json      // JSON array of price-breaks: [{"qty": 1, "price": 0.5}, {"qty": 10, "price": 0.4}]
  updatedAt     DateTime  @updatedAt

  @@unique([distributor, sku])
}

model Project {
  id          String             @id @default(uuid())
  name        String
  description String?
  userId      String
  user        User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  components  ProjectComponent[]
  boms        BOM[]
}

model ProjectComponent {
  id          String    @id @default(uuid())
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  componentId String
  component   Component @relation(fields: [componentId], references: [id])
  quantity    Int       @default(1)
  notes       String?
}

model BOM {
  id        String   @id @default(uuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  fileUrl   String?
  summary   Json     // Optimized pricing results breakdown
  createdAt DateTime @default(now())
}

model Favorite {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  componentId String
  component   Component @relation(fields: [componentId], references: [id], onDelete: Cascade)

  @@unique([userId, componentId])
}

model AIConversation {
  id        String      @id @default(uuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  messages  AIMessage[]
}

model AIMessage {
  id             String         @id @default(uuid())
  conversationId String
  conversation   AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String         // "user" or "assistant"
  content        String         @db.Text
  createdAt      DateTime       @default(now())
}
```

### 3.2 Indexing Strategy (`packages/database/INDEXING.md`)
To guarantee sub-10ms query times on PostgreSQL:
1. **B-Tree Indexes**:
   - `CREATE INDEX idx_components_mpn ON "Component"(mpn);`
   - `CREATE INDEX idx_components_mfr ON "Component"("manufacturerId");`
   - `CREATE INDEX idx_components_category ON "Component"("categoryId");`
2. **GIN (Generalized Inverted Index) on JSONB**:
   - `CREATE INDEX idx_components_specs ON "Component" USING gin (specs);`
   - This allows fast parametric queries on nested attributes (e.g., `specs->>'voltage'`).
3. **HNSW (Hierarchical Navigable Small World) Index**:
   - `CREATE INDEX idx_datasheet_embedding ON "Datasheet" USING hnsw (embedding vector_cosine_ops);`
   - Accelerates semantic search and alternative component matching via cosine distance.

---

## 4. Search Architecture (Agent 2)

ElectroHub utilizes **Typesense** for the primary keyword and parametric search due to its C++ memory-first architecture, enabling instant search-as-you-type with aggressive typo tolerance.

### 4.1 Typesense Schema (`packages/search/schema.json`)
```json
{
  "name": "components",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "mpn", "type": "string", "facet": false },
    { "name": "description", "type": "string", "index": true },
    { "name": "manufacturer", "type": "string", "facet": true },
    { "name": "category", "type": "string", "facet": true },
    { "name": "category_path", "type": "string[]", "facet": true },
    { "name": "lifecycle", "type": "string", "facet": true },
    { "name": "stock_total", "type": "int32", "facet": false },
    { "name": "min_price", "type": "float", "facet": false },
    
    // Normalized Parametric Fields for Faceting
    { "name": "normalized_voltage", "type": "float", "optional": true, "facet": false },
    { "name": "normalized_capacitance", "type": "float", "optional": true, "facet": false },
    { "name": "normalized_resistance", "type": "float", "optional": true, "facet": false },
    { "name": "package_type", "type": "string", "optional": true, "facet": true }
  ],
  "default_sorting_field": "stock_total"
}
```

### 4.2 Unit Normalization Engine (`packages/search/normalization.ts`)
This engine parses arbitrary engineering notations (e.g., `10nF`, `0.01uF`, `10000pF`, `4.7k`) and converts them into standardized SI base units (float values) to prevent Mouser's unit-mismatch filtering issue.

```typescript
export interface NormalizedValue {
  value: number;       // Base float value
  unit: string;        // Base unit (F, Ohm, H, V, A)
  display: string;     // Standardized display string (e.g., "10 nF")
}

const MULTIPLIERS: { [key: string]: number } = {
  'p': 1e-12, 'pf': 1e-12, 'picofarad': 1e-12,
  'n': 1e-9,  'nf': 1e-9,  'nanofarad': 1e-9,
  'u': 1e-6,  'uf': 1e-6,  'µ': 1e-6, 'µf': 1e-6, 'microfarad': 1e-6,
  'm': 1e-3,  'mf': 1e-3,  'milliohm': 1e-3, 'milliamp': 1e-3,
  'k': 1e3,   'kohm': 1e3,  'kiloohm': 1e3,
  'M': 1e6,   'mohm': 1e6,  'megaohm': 1e6,
  'G': 1e9,
};

export function normalizeValue(input: string, unitType: 'capacitance' | 'resistance' | 'voltage' | 'current'): NormalizedValue | null {
  const cleanInput = input.replace(/\s+/g, '').trim();
  const match = cleanInput.match(/^([0-9.]+)([a-zA-ZµμΩ]*)$/);
  
  if (!match) return null;
  
  const rawNum = parseFloat(match[1]);
  const suffix = match[2];
  
  let multiplier = 1;
  let unit = '';
  
  if (unitType === 'capacitance') {
    unit = 'F';
    multiplier = MULTIPLIERS[suffix.toLowerCase()] || 1;
  } else if (unitType === 'resistance') {
    unit = 'Ω';
    // Support notation like 4k7 -> 4.7k
    const rMatch = cleanInput.match(/^([0-9]+)([rRkKmM])([0-9]+)$/);
    if (rMatch) {
      const whole = parseFloat(rMatch[1]);
      const frac = parseFloat(rMatch[3]);
      const multChar = rMatch[2].toLowerCase();
      const mult = multChar === 'r' ? 1 : MULTIPLIERS[multChar] || 1;
      const val = (whole + frac / Math.pow(10, rMatch[3].length)) * mult;
      return { value: val, unit, display: `${val} Ω` };
    }
    multiplier = MULTIPLIERS[suffix] || 1;
  } else if (unitType === 'voltage') {
    unit = 'V';
    multiplier = MULTIPLIERS[suffix.toLowerCase()] || 1;
  } else if (unitType === 'current') {
    unit = 'A';
    multiplier = MULTIPLIERS[suffix.toLowerCase()] || 1;
  }
  
  const baseValue = rawNum * multiplier;
  
  return {
    value: baseValue,
    unit,
    display: formatDisplay(baseValue, unitType)
  };
}

function formatDisplay(val: number, type: string): string {
  if (type === 'capacitance') {
    if (val < 1e-9) return `${(val * 1e12).toFixed(0)} pF`;
    if (val < 1e-6) return `${(val * 1e9).toFixed(0)} nF`;
    if (val < 1e-3) return `${(val * 1e6).toFixed(1)} uF`;
    return `${val} F`;
  }
  if (type === 'resistance') {
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)} MΩ`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)} kΩ`;
    return `${val} Ω`;
  }
  return `${val}`;
}
```

---

## 5. AI Architecture & Ingestion Pipeline (Agent 3)

The AI layer extracts structured intelligence from unstructured PDFs offline, generating vector embeddings to enable semantic search.

### 5.1 Gemini 1.5 Pro PDF Extraction Prompt
```python
# packages/ai/extractor.py
import os
from google import genai
from google.genai import types

client = genai.Client()

def extract_datasheet_features(pdf_path: str):
    # Upload file to Gemini API
    file_ref = client.files.upload(file=pdf_path)
    
    prompt = """
    You are an expert electronics engineer and data architect. Analyze this datasheet PDF.
    Extract:
    1. A detailed 2-3 sentence functional description.
    2. The Pinout Table: columns [pin_number, pin_name, type, description].
       Classify "type" as one of: POWER, GROUND, INPUT, OUTPUT, BIDIRECT, ANALOG, PASSIVE.
    3. Absolute Maximum Ratings: Operating temperature, max supply voltage, max current.
    4. Key Parametric Specifications (e.g. input voltage, quiescent current, RDS(on), frequency).
    
    Return the result strictly as JSON conforming to this schema:
    {
      "description": "string",
      "pins": [{"number": "string", "name": "string", "type": "string", "description": "string"}],
      "absolute_maximums": {"voltage_max": "float", "temp_max": "float", "current_max": "float"},
      "parameters": {"key": "value"}
    }
    """
    
    response = client.models.generate_content(
        model='gemini-1.5-pro',
        contents=[file_ref, prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )
    return response.text
```

### 5.2 RAG and Alternative Matching Setup (`packages/ai/recommender.py`)
Alternative component discovery is powered by cosine similarity matching on embeddings of structural specifications, combined with hard pin-count matches.

```python
# packages/ai/recommender.py
import psycopg2
import numpy as np

def find_alternatives(conn, component_id: str, limit: int = 5):
    cursor = conn.cursor()
    
    # 1. Fetch target component details and vector embedding
    cursor.execute("""
        SELECT c.id, c.categoryId, d.embedding, COUNT(p.id) as pin_count
        FROM "Component" c
        JOIN "Datasheet" d ON d."componentId" = c.id
        LEFT JOIN "Pin" p ON p."componentId" = c.id
        WHERE c.id = %s
        GROUP BY c.id, d.embedding
    """, (component_id,))
    target = cursor.fetchone()
    if not target:
        return []
    
    target_id, category_id, embedding, pin_count = target
    
    # 2. Query pgvector for components in the same category with similar embeddings
    # and identical pin count to guarantee compatibility.
    cursor.execute("""
        SELECT c.id, c.mpn, c.description, d.embedding <=> %s::vector AS distance
        FROM "Component" c
        JOIN "Datasheet" d ON d."componentId" = c.id
        LEFT JOIN "Pin" p ON p."componentId" = c.id
        WHERE c."categoryId" = %s 
          AND c.id != %s
        GROUP BY c.id, d.embedding
        HAVING COUNT(p.id) = %s
        ORDER BY distance ASC
        LIMIT %s
    """, (embedding, category_id, target_id, pin_count, limit))
    
    return cursor.fetchall()
```

---

## 6. API Architecture (Agent 4)

We expose a clean, RESTful API endpoint structure with Role-Based Access Control (RBAC) and Redis-based rate limiting.

### 6.1 Endpoints Specification

| Method | Endpoint | Description | Auth Required | RBAC Role |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/components` | Search and filter components (Typesense proxy) | No | Guest |
| `GET` | `/api/components/[id]` | Get detailed component specs, pinouts, and alternatives | No | Guest |
| `POST` | `/api/components` | Add a new component to the database | Yes | Admin |
| `PUT` | `/api/components/[id]` | Update component specifications | Yes | Admin |
| `DELETE` | `/api/components/[id]` | Remove a component | Yes | Admin |
| `GET` | `/api/projects` | List all projects belonging to the logged-in user | Yes | Registered |
| `POST` | `/api/projects` | Create a new project workspace | Yes | Registered |
| `POST` | `/api/bom/optimize` | Upload CSV BOM and optimize pricing across distributors | Yes | Registered |
| `POST` | `/api/ai/chat` | Stream AI assistant conversation for the current component | Yes | Registered |

### 6.2 Redis Rate Limiter Middleware (`apps/web/src/middleware.ts`)
We protect public search and AI endpoints using a Redis Token Bucket rate limiter.
* Guest Users: 60 requests / minute.
* Registered Users: 200 requests / minute.

---

## 7. Frontend Architecture (Agent 5)

The frontend is built on Next.js 15 using the App Router. The UI matches the dark-themed, highly polished design language of Vercel and Linear, using Tailwind CSS and Radix UI primitives via `shadcn/ui`.

### 7.1 Page Layouts & User Flow

* **`/` (Landing Page)**: 
  * Layout: Centered search bar with glowing radial background, list of trending microcontrollers, and real-time statistics.
  * Flow: User types "ESP32-S3" -> Instant dropdown list appears -> Press Enter to go to `/search`.
* **`/search` (Component Explorer)**:
  * Layout: Left sidebar containing parametric filters (facets like Manufacturer, Voltage Range, Stock Status). Right side displays a grid of component cards with real-time stock and price indicator badges.
* **`/components/[id]` (Component Dashboard)**:
  * Layout: Split screen. Left pane has metadata, real-time pricing matrix (DigiKey vs Mouser vs LCSC), and an **Interactive Pinout Canvas** (rendered using Canvas/SVG with hover tooltips for pin descriptions). Right pane embeds the official PDF datasheet.
* **`/bom` (BOM Optimizer)**:
  * Layout: Drag-and-drop zone for CSV files. Renders an editable spreadsheet. Highlight colors show stock warnings, out-of-stock items, and a "One-Click Optimize" button that splits the BOM to achieve the lowest total cost.

---

## 8. DevOps & Deployment Architecture (Agent 6)

### 8.1 Docker Compose Configuration (`docker-compose.yml`)
Runs the complete stack locally, including PostgreSQL with `pgvector`, Typesense, Redis, and Next.js.

```yaml
version: '3.8'

services:
  postgres:
    image: ankane/pgvector:v0.5.1
    container_name: electrohub_db
    environment:
      POSTGRES_DB: electrohub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  typesense:
    image: typesense/typesense:0.25.1
    container_name: electrohub_search
    environment:
      TYPESENSE_DATA_DIR: /data
      TYPESENSE_API_KEY: xyz123
      TYPESENSE_ENABLE_CORS: "true"
    ports:
      - "8108:8108"
    volumes:
      - typesense_data:/data

  redis:
    image: redis:7.0-alpine
    container_name: electrohub_cache
    ports:
      - "6379:6379"

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    container_name: electrohub_web
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/electrohub
      - TYPESENSE_API_KEY=xyz123
      - TYPESENSE_HOST=typesense
      - REDIS_URL=redis://redis:6379
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - typesense
      - redis

volumes:
  postgres_data:
  typesense_data:
```

### 8.2 GitHub Actions CI Workflow (`.github/workflows/ci.yml`)
```yaml
name: Continuous Integration

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Run Lint
        run: npm run lint
        
      - name: Validate Prisma Schema
        run: npx prisma validate --schema=packages/database/schema.prisma
        
      - name: Run Unit & Integration Tests
        run: npm run test
        
      - name: Build Next.js App
        run: npm run build
```

---

## 9. Testing Architecture (Agent 7)

We implement a multi-layered testing strategy to guarantee stability and prevent regression:

* **Unit Tests (Vitest)**: Verifies the `Unit Normalization Engine` with exhaustive test cases (e.g., matching `100nF` to `1e-7 F`).
* **Integration Tests (Jest & Supertest)**: Verifies Next.js API routes, ensuring database transactions and Typesense indexing perform correctly.
* **End-to-End Tests (Playwright)**: Automates browser tests simulating the user flow: logging in, searching for "NE555", viewing the pinout, uploading a BOM, and verifying the Vercel-like dark theme styling.

---

## 10. Repository Structure

```
electro-hub/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/             # Next.js API Routes
│       │   │   ├── search/          # Explorer Page
│       │   │   ├── components/      # Detail Pages
│       │   │   ├── bom/             # BOM Upload & Optimizer
│       │   │   └── layout.tsx
│       │   ├── components/          # Shared shadcn/ui React components
│       │   └── middleware.ts        # Redis rate-limiting
│       ├── package.json
│       └── tailwind.config.js
├── packages/
│   ├── database/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── INDEXING.md
│   ├── search/
│   │   ├── schema.json
│   │   ├── normalization.ts
│   │   └── sync.ts
│   └── ai/
│       ├── extractor.py
│       ├── recommender.py
│       └── requirements.txt
├── docker/
│   ├── Dockerfile.web
│   └── Dockerfile.ai
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 11. Deployment Strategy

* **Frontend & APIs**: Deployed to **Vercel** for edge caching, fast static builds, and automated preview deployments.
* **Database**: Hosted on **Supabase** for managed PostgreSQL, built-in connection pooling (PgBouncer), and native `pgvector` support.
* **Search Engine**: **Typesense Cloud** or self-hosted on a **Railway** RAM-optimized instance.
* **Caching**: **Upstash Redis** or managed Redis on **Railway** for serverless, low-latency rate-limiting.
* **Datasheet PDF Storage**: **Cloudflare R2** for S3-compatible, zero-egress-fee storage of parsed PDF datasheets.

---

## 12. Development Roadmap

* **Phase 1: Database, Search & AI (Weeks 1-2)**: Initialize monorepo, deploy Postgres and Typesense, implement the unit normalization engine, write the Prisma schema, and build the Gemini PDF extraction pipeline.
* **Phase 2: Core Platform APIs & Auth (Weeks 3-4)**: Implement Next.js API routes, configure NextAuth (NextAuth.js), write the seed system, and integrate Typesense indexing.
* **Phase 3: Frontend & UI (Weeks 5-6)**: Build the landing page, search explorer, interactive pinout canvas, and the BOM optimizer dashboard.
* **Phase 4: QA, DevOps & Release (Week 7)**: Write Playwright E2E tests, configure CI/CD pipelines, execute performance audits, and deploy to production environments.
