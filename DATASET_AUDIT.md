# ElectroHub Dataset Audit

This audit was conducted on **2026-06-30T08:31:17+05:30**.

---

## Database Connection Status

* **PostgreSQL Port (5432)**: Closed (Offline)
* **Typesense Port (8108)**: Closed (Offline)
* **Redis Port (6379)**: Closed (Offline)
* **Web App Port (3000)**: Open (Running)
* **Environment Variable `DATABASE_URL`**: Not Set (Missing)

Because the database connection is offline, database queries fail with connection and configuration errors.

---

## Database Metric Counts

Below are the results of attempting to query the tables:

### 1. Total Components
* **SQL Query**: `SELECT COUNT(*) FROM "Component";`
* **Result**: **0** (Unreachable - Connection Failed: `Environment variable not found: DATABASE_URL`)

### 2. Total Manufacturers
* **SQL Query**: `SELECT COUNT(*) FROM "Manufacturer";`
* **Result**: **0** (Unreachable - Connection Failed)

### 3. Total Categories
* **SQL Query**: `SELECT COUNT(*) FROM "Category";`
* **Result**: **0** (Unreachable - Connection Failed)

### 4. Total Datasheets
* **SQL Query**: `SELECT COUNT(*) FROM "Datasheet";`
* **Result**: **0** (Unreachable - Connection Failed)

### 5. Total Pinouts
* **SQL Query**: `SELECT COUNT(*) FROM "Pin";`
* **Result**: **0** (Unreachable - Connection Failed)

### 6. Total Distributor Records
* **SQL Query**: `SELECT COUNT(*) FROM "DistributorStock";`
* **Result**: **0** (Unreachable - Connection Failed)

### 7. Total Projects
* **SQL Query**: `SELECT COUNT(*) FROM "Project";`
* **Result**: **0** (Unreachable - Connection Failed)

### 8. Total Favorites
* **SQL Query**: `SELECT COUNT(*) FROM "Favorite";`
* **Result**: **0** (Unreachable - Connection Failed)

### 9. Total AI Conversations
* **SQL Query**: `SELECT COUNT(*) FROM "AIConversation";`
* **Result**: **0** (Unreachable - Connection Failed)
