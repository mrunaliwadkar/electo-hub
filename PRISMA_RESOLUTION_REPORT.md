# Prisma Client Resolution Report

This report explains the resolution path, import structure, build issues, and the recommended low-risk fix for the Prisma Client within the ElectroHub monorepo structure.

---

## 1. Actual Generated Paths & Import Paths

### A. Location of `schema.prisma`
*   The primary Prisma schema lives at:
    `[packages/database/schema.prisma](file:///d:/antigravity/electro%20hub/packages/database/schema.prisma)`

### B. Actual Generated Path
Because this repository contains separate modules with their own individual `package-lock.json` and dependency structures (rather than a single unified package workspace), `prisma generate` compiles the client into separate locations based on where the CLI command is run:
1.  **For Database Package**: When run in `packages/database`, it generates to:
    `[packages/database/node_modules/.prisma/client](file:///d:/antigravity/electro%20hub/packages/database/node_modules/.prisma/client)`
2.  **For Web Application**: When run in `apps/web`, it generates to:
    `[apps/web/node_modules/.prisma/client](file:///d:/antigravity/electro%20hub/apps/web/node_modules/.prisma/client)`

### C. Actual Import Path
*   **Import Statement in Web App**: In `[apps/web/src/lib/db.ts](file:///d:/antigravity/electro%20hub/apps/web/src/lib/db.ts)`, Prisma is imported directly:
    ```typescript
    import { PrismaClient } from '@prisma/client';
    ```
*   **Resolution Path**: This import statement resolves to the local `@prisma/client` dependency in:
    `[apps/web/node_modules/@prisma/client](file:///d:/antigravity/electro%20hub/apps/web/node_modules/@prisma/client)`
    which reads the generated database client inside `apps/web/node_modules/.prisma/client`.

> [!NOTE]
> Even though there is a shared `@electrohub/database` package defined in `packages/database`, it is never imported or used by `apps/web` or `packages/search`. Both modules import directly from `@prisma/client` and rely on local generation.

---

## 2. Why Next.js Cannot Find the Generated Client

During deployment (specifically in the `deploy-frontend` job inside `[.github/workflows/cd.yml](file:///d:/antigravity/electro%20hub/.github/workflows/cd.yml)`), Vercel CLI executes the build process:
```yaml
- name: Build Project Artifacts
  run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
```

1.  **Missing `npm install` in Action Runner**: The `deploy-frontend` workflow job does not run `npm ci` or `npm install` in the runner workspace before executing `vercel build`.
2.  **Vercel Build Compilation**: Vercel CLI automatically installs dependencies inside its own build environment and triggers Next.js's compilation command (`next build`).
3.  **Missing Generation Step**:
    *   There is no `prisma generate` step in the `deploy-frontend` workflow.
    *   There is no `postinstall` script defined inside `[apps/web/package.json](file:///d:/antigravity/electro%20hub/apps/web/package.json)`.
    *   The `build` script in `apps/web/package.json` is simply `"build": "next build"`.
4.  **Failure**: Since Vercel CLI installs dependencies but never runs `prisma generate`, Next.js attempts to compile the code imports from `@prisma/client` before the client is generated, causing the compilation to fail with a missing client reference error.

---

## 3. Lowest-Risk Fix

To force Prisma to generate the client into the local `apps/web/node_modules` directory, we need the generation command to be run in a context where the schema file is local to the `apps/web` package. 

The most robust and cross-platform fix is to add a `postinstall` script in `[apps/web/package.json](file:///d:/antigravity/electro%20hub/apps/web/package.json)` that dynamically copies `schema.prisma` from the database package to `apps/web/schema.prisma`, executes `prisma generate`, and then cleans up the copied schema file.

This guarantees that:
1.  **Vercel / Next.js Build**: When Vercel CLI installs the dependencies, it automatically runs the copy, generate, and cleanup tasks prior to executing `next build`, producing the client in the local `apps/web/node_modules`.
2.  **Local Development**: When developers run `npm install` inside `apps/web`, the Prisma Client is generated automatically and locally.
3.  **CI/CD Workflow**: Keeps the deployment workflows simple and clean.

### Code Implementation

Update the `scripts` block in `[apps/web/package.json](file:///d:/antigravity/electro%20hub/apps/web/package.json)` as follows:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "postinstall": "node -e \"const fs = require('fs'); fs.copyFileSync('../../packages/database/schema.prisma', 'schema.prisma');\" && prisma generate --schema=schema.prisma && node -e \"const fs = require('fs'); fs.unlinkSync('schema.prisma');\""
  },
```
