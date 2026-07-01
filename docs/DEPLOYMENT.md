# ElectroHub: DevOps & Deployment Guide

This document provides comprehensive, step-by-step instructions for running **ElectroHub** locally using Docker Compose, configuring its environment variables, managing database migrations, and deploying the entire stack to production.

---

## 1. Local Development Environment

ElectroHub uses a multi-service local environment coordinated via Docker Compose. This ensures all team members run identical versions of the database, search engine, cache, frontend, and AI worker.

### 1.1 Prerequisites
- **Docker & Docker Compose**: Ensure Docker Desktop is installed and running.
- **Node.js v20**: For running local scripts or building packages outside of Docker.
- **Google Gemini API Key**: An active API key from Google AI Studio is required for the AI worker.

### 1.2 Running the Stack
1. Clone the repository and navigate to the root directory:
   ```bash
   cd electro-hub
   ```
2. Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
3. Start all services in detached mode:
   ```bash
   docker compose up -d --build
   ```
4. Verify all containers are running and healthy:
   ```bash
   docker compose ps
   ```

### 1.3 Local Services Map

| Service Name | Technology | Internal Port | External Port | Data Persistence |
| :--- | :--- | :--- | :--- | :--- |
| `postgres` | `ankane/pgvector:v0.5.1` | `5432` | `5432` | `postgres_data` volume |
| `typesense` | `typesense/typesense:0.25.1` | `8108` | `8108` | `typesense_data` volume |
| `redis` | `redis:7.0-alpine` | `6379` | `6379` | `redis_data` volume |
| `web` | `Next.js 15 (Node 20)` | `3000` | `3000` | N/A (Stateless) |
| `ai` | `Python 3.11` | N/A | N/A | N/A (Stateless) |

### 1.4 Seeding the Local Database & Syncing Search
Once the containers are running, you must run the database migrations, seed the initial data, and synchronize it with the Typesense search index:

1. **Apply Prisma Migrations**:
   ```bash
   cd packages/database
   npm install
   npx prisma migrate dev --name init
   ```
2. **Seed the Database**:
   ```bash
   npm run seed
   ```
3. **Synchronize Typesense Index**:
   ```bash
   cd ../search
   npm install
   npm run sync
   ```

---

## 2. Environment Variables Reference

### 2.1 Next.js Web App (`apps/web`)
Create `apps/web/.env.local` for local development. These must also be configured in the Vercel dashboard for production.

| Variable | Description | Local Default / Example | Production Source |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string. Use transaction pooler (port 6543) in production. | `postgresql://postgres:password@localhost:5432/electrohub` | Supabase Database |
| `DIRECT_URL` | Direct connection string for Prisma migrations (bypasses pooler). | `postgresql://postgres:password@localhost:5432/electrohub` | Supabase Database |
| `REDIS_URL` | Connection URL for rate limiting and caching. | `redis://localhost:6379` | Upstash / Railway Redis |
| `TYPESENSE_HOST` | Hostname of the Typesense search engine. | `localhost` | Typesense Cloud / Railway |
| `TYPESENSE_PORT` | Port of the Typesense search engine. | `8108` | `443` (Cloud) / `8108` (Railway) |
| `TYPESENSE_PROTOCOL` | Protocol for Typesense connection (`http` or `https`). | `http` | `https` (Cloud) |
| `TYPESENSE_API_KEY` | Admin API Key for Typesense. | `xyz123` | Typesense Dashboard |
| `NEXTAUTH_SECRET` | Secret key used to encrypt NextAuth session cookies. | `supersecretnextauthkey123` | Generate using `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical URL of the web application. | `http://localhost:3000` | `https://electrohub.yourdomain.com` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID for Google Sign-In. | `optional_client_id` | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret for Google Sign-In. | `optional_client_secret` | Google Cloud Console |

### 2.2 AI Background Worker (`packages/ai`)
These variables must be supplied to the Docker container or configured in the Railway dashboard.

| Variable | Description | Local Default / Example | Production Source |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string. | `postgresql://postgres:password@postgres:5432/electrohub` | Supabase Database |
| `GEMINI_API_KEY` | API Key for accessing Google Gemini 1.5 Pro. | `your_api_key_here` | Google AI Studio |
| `POLL_INTERVAL` | Frequency (in seconds) the worker polls the database for work. | `10` | N/A (Internal) |

---

## 3. Production Cloud Architecture

```mermaid
graph TD
    User([User / Client Browser]) <--> |HTTPS| Vercel[Vercel - Next.js App]
    Vercel <--> |Direct Query / Pooler| Supabase[(Supabase - PostgreSQL + pgvector)]
    Vercel <--> |Search Queries| Typesense[[Typesense Cloud]]
    Vercel <--> |Rate Limit / Cache| Upstash[(Upstash Redis)]
    
    %% AI Pipeline
    Railway[Railway - Python AI Worker] --> |Polls & Updates| Supabase
    Railway --> |API Requests| Gemini[Google Gemini 1.5 Pro]
    Vercel -.-> |Triggers Ingestion| Supabase
```

---

## 4. Step-by-Step Cloud Deployment

Follow these steps in order to deploy ElectroHub to production.

### Step 1: Database Setup (Supabase)
1. Log in to [Supabase](https://supabase.com/).
2. Click **New Project** and select your organization.
3. Set the project name to `electrohub` and generate a secure database password.
4. Once the project is provisioned, go to **Project Settings -> Database**.
5. Copy the **Connection String** under **URI**:
   - **Transaction Pooler (Session-based)**: Use this for `DATABASE_URL` in the Next.js app. It typically uses port `6543` and has `?pgbouncer=true` appended.
   - **Session / Direct**: Use this for `DIRECT_URL` in the Next.js app (for migrations) and as `DATABASE_URL` in the Python AI worker.
6. Enable the `pgvector` extension by running the following SQL in the Supabase SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pgvector;
   ```

### Step 2: Search Engine Setup (Typesense Cloud)
1. Log in to [Typesense Cloud](https://cloud.typesense.org/).
2. Click **Launch Cluster**.
3. Select your region, keep the RAM size at the default minimum (0.5 GB is sufficient for up to 100,000 components), and select Typesense Version `25.1` or higher.
4. Once the cluster is active, download the **API Key Credentials** file.
5. Extract the `Host`, `Port`, `Protocol` (`https`), and `Admin API Key`.

### Step 3: Cache & Rate Limiting Setup (Upstash Redis)
1. Log in to [Upstash](https://upstash.com/).
2. Click **Create Database**.
3. Set the name to `electrohub-cache`, select your region, and choose **Primary**.
4. Once created, copy the **Redis Connection URL** (e.g., `rediss://default:password@hostname:port`).

### Step 4: AI Worker Deployment (Railway)
1. Log in to [Railway](https://railway.app/).
2. Click **New Project -> Deploy from GitHub repo**.
3. Select your `electro-hub` repository.
4. When prompted, configure the service settings:
   - **Service Name**: `ai-worker`
   - **Source Directory**: Leave as root.
   - **Dockerfile Path**: `docker/Dockerfile.ai` (Railway will automatically detect this and build it using Docker).
5. Add the following **Environment Variables** in the Railway service dashboard:
   - `DATABASE_URL`: Your Supabase direct connection URL.
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `POLL_INTERVAL`: `10`
6. Click **Deploy**. Railway will build the Docker image and start the worker.

### Step 5: Web Application Deployment (Vercel)
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New -> Project**.
3. Import your `electro-hub` GitHub repository.
4. Configure the project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
5. Expand the **Environment Variables** section and add all variables listed in Section 2.1.
6. Click **Deploy**. Vercel will build and host your Next.js application.

---

## 5. Production Database Migrations

In production, you must **NEVER** use `prisma migrate dev` because it can reset the database and cause catastrophic data loss. Instead, use `prisma migrate deploy`.

### 5.1 Automatic Migrations via CD
The CI/CD pipeline is configured to automatically run migrations upon merging to the `main` branch. This is defined in `.github/workflows/cd.yml`.

To enable this:
1. Go to your GitHub repository **Settings -> Secrets and variables -> Actions**.
2. Add a new repository secret:
   - **Name**: `SUPABASE_DATABASE_URL`
   - **Value**: Your Supabase direct connection string (must bypass PgBouncer, e.g. port 5432).

### 5.2 Manual Migrations
If you need to run migrations manually from your local machine to the production database:
1. Ensure your local environment has the production connection string.
2. Run the following command from the root of the project:
   ```bash
   DATABASE_URL="your_production_direct_connection_string" npx prisma migrate deploy --schema=packages/database/schema.prisma
   ```

### 5.3 Rollbacks & Failed Migrations
If a migration fails in production:
1. Identify the failed migration name (it will be logged in GitHub Actions or visible in the `_prisma_migrations` table).
2. Mark the migration as resolved if you have manually fixed the database schema:
   ```bash
   DATABASE_URL="your_production_direct_connection_string" npx prisma migrate resolve --applied <migration_name> --schema=packages/database/schema.prisma
   ```
3. If you need to roll back, write a new migration that reverts the changes and deploy it. Do not manually edit the database schema outside of migrations.

---

## 6. SSL, Custom Domains, and DNS Setup

### 6.1 Vercel (Frontend)
Vercel automatically provisions Let's Encrypt SSL certificates for all deployments and custom domains.
1. In the Vercel dashboard, navigate to your project and go to **Settings -> Domains**.
2. Enter your custom domain (e.g., `electrohub.com` or `components.electrohub.com`).
3. Vercel will provide DNS records (CNAME or A record).
4. Log in to your DNS provider (e.g., Cloudflare, GoDaddy) and add the specified records.
5. Once the DNS propagates, Vercel will automatically issue the SSL certificate.

### 6.2 Cloudflare Integration (Recommended)
If using Cloudflare for DNS and proxying:
1. Set the SSL/TLS encryption mode to **Full** or **Full (strict)** in the Cloudflare dashboard.
2. If you encounter redirect loops, ensure Vercel is configured to handle the Cloudflare proxy correctly by disabling "Always Use HTTPS" in Cloudflare (since Vercel will enforce HTTPS on its side).
