# ElectroHub Backend API Layer

This directory contains the Next.js 15 API routes, middleware, validation schemas, and configurations that power the **ElectroHub** backend.

---

## 1. Directory Structure

```
apps/web/src/
├── app/
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/     # NextAuth.js (Auth.js) credentials endpoint
│       ├── components/
│       │   ├── route.ts           # Parametric search (Typesense proxy) & Admin creation
│       │   └── [id]/
│       │       └── route.ts       # Specs, pinouts, and pgvector-based alternatives
│       ├── circuits/
│       │   ├── route.ts           # Browse and search sub-circuits
│       │   ├── [id]/
│       │   │   └── route.ts       # Get specific circuit details
│       │   └── difficulty/
│       │       └── route.ts       # Get available difficulty levels
│       ├── projects/
│       │   ├── route.ts           # List & create project workspaces
│       │   └── [id]/
│       │       └── route.ts       # Project CRUD & component list management
│       ├── bom/
│       │   └── optimize/
│       │       └── route.ts       # CSV BOM parser & multi-distributor cart optimizer
│       ├── favorites/
│       │   └── route.ts           # Toggle & list user favorites
│       ├── ai/
│       │   └── chat/
│       │       └── route.ts       # Streaming chat with component-specific context
│       ├── rate-limit/
│       │   └── route.ts           # Internal TCP Redis rate-limiter (Node.js runtime)
│       └── openapi.json           # OpenAPI 3.0 specification
├── lib/
│   ├── auth.ts                    # NextAuth options and Credentials provider
│   ├── auth-utils.ts              # RBAC helpers (checkRole, unauthorizedResponse)
│   ├── db.ts                      # PrismaClient singleton client
│   ├── redis.ts                   # Redis client & sliding window rate limiter
│   ├── typesense.ts               # Typesense client & indexing helpers
│   └── validation.ts              # Zod input validation schemas
└── middleware.ts                  # Redis-based rate-limiting middleware (Edge)
```

---

## 2. Authentication & Role-Based Access Control (RBAC)

Authentication is implemented using **NextAuth.js** with the **Credentials Provider** and **JWT-based Sessions**. 

### Role Hierarchy & Permissions

We support three roles:
1. **GUEST**: Unauthenticated public users.
2. **USER (Registered)**: Logged-in developers.
3. **ADMIN**: Platform administrators.

| Endpoint | Method | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `/api/components` | `GET` | `GUEST`, `USER`, `ADMIN` | Search and filter components |
| `/api/components` | `POST` | `ADMIN` | Create a new component |
| `/api/components/[id]` | `GET` | `GUEST`, `USER`, `ADMIN` | Retrieve component details & alternatives |
| `/api/components/[id]` | `PUT` | `ADMIN` | Update component details |
| `/api/components/[id]` | `DELETE` | `ADMIN` | Delete component |
| `/api/circuits` | `GET` | `GUEST`, `USER`, `ADMIN` | Browse reference circuits |
| `/api/projects` | `GET` / `POST` | `USER`, `ADMIN` | List and create workspaces |
| `/api/projects/[id]` | `GET` / `PUT` / `DELETE` | `USER` (Owner), `ADMIN` | Manage project metadata and components |
| `/api/bom/optimize` | `POST` | `USER`, `ADMIN` | Upload CSV and optimize cart splits |
| `/api/favorites` | `GET` / `POST` | `USER`, `ADMIN` | List and toggle favorites |
| `/api/ai/chat` | `POST` | `USER`, `ADMIN` | Stream AI chat with component context |

---

## 3. Redis-Based Rate Limiting

Rate limiting is enforced at the edge via `middleware.ts` protecting the public search and AI endpoints:
- **Guest Users**: 60 requests / minute.
- **Registered Users**: 200 requests / minute.

### Edge Runtime Workaround (Node.js TCP rate-limiter)
Next.js middleware runs in the **Edge Runtime**, which does not support Node.js TCP operations (preventing direct `ioredis` connections to standard Redis containers).
To solve this, `middleware.ts` intercepts incoming requests, determines the rate-limit key, and makes a fast internal HTTP `fetch` to `/api/rate-limit`. This internal API route runs in the **Node.js runtime**, allowing it to connect to the Redis container via TCP, evaluate the limit, and return a status code.

### Sliding Window Algorithm (`apps/web/src/lib/redis.ts`)
We use a **Sliding Window** rate limiter implemented using Redis **Sorted Sets (`ZSET`)** inside a Redis transaction (`multi`):
1. Remove all elements in the sorted set older than `now - 60 seconds` (`ZREMRANGEBYSCORE`).
2. Count the remaining elements in the set (`ZCARD`).
3. If the count is below the limit, add the current timestamp with a unique identifier (`ZADD`) and update the key's TTL (`EXPIRE`).
4. If the count exceeds the limit, block the request and return `429 Too Many Requests`.

### Fail-Open Resilience
If the Redis instance is down or unreachable, the rate limiter catches the error and **fails open** (allows the request), ensuring that a Redis outage does not impact platform availability.

---

## 4. Input Validation (Zod)

All API route payloads are strictly validated using Zod schemas defined in `apps/web/src/lib/validation.ts`:
- `ComponentSearchSchema`: Sanitizes and parses pagination, queries, and filters.
- `ComponentCreateSchema` / `ComponentUpdateSchema`: Validates nested pin configurations and CAD assets.
- `ProjectCreateSchema` / `ProjectUpdateSchema`: Sanitizes name and description lengths.
- `ProjectComponentSchema`: Validates quantities and notes when adding parts to projects.
- `AIChatSchema`: Ensures the chat message is within length limits and validates the structure of the conversational history.

---

## 5. BOM Optimization Engine (`apps/web/src/app/api/bom/optimize/route.ts`)

The BOM optimizer accepts a CSV upload and performs the following operations:
1. **Fuzzy Part Matching**: Matches each CSV item's MPN using Typesense (with typo-tolerance) and falls back to a database lookup.
2. **Distributor Price Evaluation**: Queries cached stock and price-break tiers for **DigiKey**, **Mouser**, and **LCSC**.
3. **Cart Splitting Algorithm**:
   - Assigns each component to the distributor that offers the lowest total cost for the required quantity (based on volume price breaks).
   - If a part is out of stock at the cheapest distributor, it falls back to the next cheapest with sufficient stock.
4. **Shipping Fee Optimization**: Applies shipping rules:
   - **DigiKey**: $9.99 flat shipping, free on orders over $50.00.
   - **Mouser**: $7.99 flat shipping, free on orders over $50.00.
   - **LCSC**: $5.00 flat shipping, free on orders over $15.00.
   - Calculates the final cost including items and shipping, and outputs a detailed breakdown of the optimized splits.

---

## 6. AI Assistant Streaming (`apps/web/src/app/api/ai/chat/route.ts`)

The AI chat endpoint streams responses in real time:
1. It fetches the component's MPN, description, specifications, and full pinout list from the database.
2. It constructs a detailed system instruction injecting this structured component data as the source-of-truth context.
3. It utilizes the `@google/generative-ai` SDK and the `gemini-1.5-flash` model.
4. It calls `model.generateContentStream` and pipes the output chunks back to the client using a `ReadableStream` with `chunked` transfer encoding.
