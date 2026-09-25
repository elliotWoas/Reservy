## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Project Overview

**Reservy** — Multi-tenant booking SaaS (Clean Architecture, Modular Monolith).
- **Runtime**: Bun 1.3+ workspaces
- **API**: NestJS 10 (apps/api) — REST, JWT auth, RBAC, Prisma ORM
- **Web**: Next.js 14 App Router (apps/web) — React 18, Tailwind, RTL/Jalali
- **Packages**: @reservy/domain (pure logic), @reservy/database (Prisma), @reservy/validation (Zod), @reservy/config (tsconfig)

---

## Monorepo Structure

```
apps/
  api/          # NestJS backend (port 4000)
  web/          # Next.js frontend (port 3000)
packages/
  config/       # Shared tsconfig.base.json
  domain/       # Pure TS: state machines, availability engine, money, permissions
  validation/   # Zod schemas (phone, booking, payment, etc.)
  database/     # Prisma client + schema.prisma + seed
```

---

## Key Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Run API + Web concurrently |
| `bun dev:api` | API only (http://localhost:4000) |
| `bun dev:web` | Web only (http://localhost:3000) |
| `bun build` | Build all workspaces for production |
| `bun build:api` / `bun build:web` | Individual builds |
| `bun start` | Start production servers |
| `bun test` | Run all tests (bun:test) |
| `bun test:coverage` | Tests with coverage |
| `bun typecheck` | `tsc -b` across all packages |
| `bun lint` | Lint all workspaces (API: none configured, Web: next lint) |

### Database (Prisma) — managed directly from monorepo root

| Command | Description |
|---------|-------------|
| `bun db:generate` / `bun prisma:generate` | Generate Prisma Client |
| `bun db:push` | Sync schema to DB (dev) |
| `bun db:migrate` | Create + apply migration (dev) |
| `bun db:migrate:prod` | Deploy migrations (prod) |
| `bun db:seed` | Seed Persian demo data |
| `bun db:studio` | Open Prisma Studio |

### PM2 Process Management (No-Docker API Deployment)

| Command | Description |
|---------|-------------|
| `bun pm2:start` | Launch API process via PM2 |
| `bun pm2:stop` | Stop `reservy-api` PM2 process |
| `bun pm2:restart` | Restart `reservy-api` PM2 process |
| `bun pm2:logs` | Stream `reservy-api` logs |
| `bun pm2:status` | Check PM2 process status |

### Docker

| Command | Description |
|---------|-------------|
| `bun docker:up` | Start Postgres, Redis, MinIO |
| `bun docker:down` | Stop containers |
| `bun docker:build` | Build production images |
| `bun docker:prod` | Launch full prod stack |

---

## Environment Setup

1. Copy `.env.example` → `.env`
2. `bun docker:up` (starts Postgres, Redis, MinIO)
3. `bun db:generate && bun db:push && bun db:seed`
4. `bun dev`

**⚠️ Port 5432 conflict (macOS)**: If you have Postgres.app or Homebrew PostgreSQL installed locally, Docker cannot bind to port 5432. Fix:
   - **Option A (preferred)**: Stop the local PostgreSQL: `brew services stop postgresql@18` + quit Postgres.app, then use port 5432
   - **Option B**: Set `DB_PORT=5433` in `.env` and `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/reservy?schema=public"` — docker-compose reads `DB_PORT` via `${DB_PORT:-5432}`

**⚠️ Credentials**: `.env` password must match docker-compose's `POSTGRES_PASSWORD` env (both `postgres` by default). Mismatched passwords cause `db:push` to fail with auth errors.

**Demo accounts** (after seed):
- Business Owner: `owner@reservy.com` / `password123` → `/dashboard`
- Platform Admin: `admin@reservy.com` / `password123` → `/admin`
- Public storefront: `http://localhost:3000/aria-beauty`

---

## Common Gotchas

1. **Prisma schema path**: Root scripts use `./packages/database/prisma/schema.prisma` — run db commands from repo root
2. **API build output**: `apps/api/dist/` (tsc emits there; `start` runs `bun dist/main.js`)
3. **No API lint script** — only `bun lint` runs web lint (`next lint`)
4. **Domain package has no build step** — consumed as source (`main: ./src/index.ts`)
5. **Module aliases**: `@reservy/*` resolve via Bun workspaces + tsconfig paths
6. **Persian/RTL**: All UI uses `dir="rtl"`, Jalali dates via frontend libs
7. **Local PostgreSQL conflict**: macOS often has Postgres.app or Homebrew PostgreSQL occupying port 5432 — see Environment Setup above
8. **Seed idempotency**: `db:seed` is not idempotent — if it fails mid-way, run `bun db:push --force-reset` first to reset the DB, then reseed
9. **Docker image pull time**: First `bun docker:up` pulls ~200MB+ of images (Postgres, Redis, MinIO) — subsequent runs are instant

---

## Architecture Notes (Agent-Critical)

### Multi-Tenancy Enforcement
- Every request resolves `organizationId` from JWT membership + validated `X-Organization-Id` header
- **All DB queries must scope `where: { organizationId }`** — tenant isolation is a security boundary
- Guards: `JwtAuthGuard` → `PermissionsGuard` (`requirePermission(Permission.X)`)

### Timezone & Availability Engine
- **Canonical storage**: UTC (`timestamptz`) in PostgreSQL
- **Org timezone**: `Asia/Tehran` default — conversion at read/write boundaries
- **Jalali calendar**: Presentation-layer only (frontend)
- **Slot formula**: `(Shifts - Breaks - Blocked - Bookings) / (Duration + Buffers)`
- Core logic in `@reservy/domain` → `generateAvailableSlots()`, `localTehranToUtc()`

### Double-Booking Prevention
- Atomic `prisma.$transaction` for all booking writes
- Overlap query: `start_at < searchEnd AND end_at > searchStart` with buffers
- Returns `DomainError(BOOKING_SLOT_UNAVAILABLE)` + HTTP 409 on conflict

### Card-to-Card Payment Flow
```
PENDING_PAYMENT → (customer uploads receipt) → PROOF_SUBMITTED
                      │
                      ▼
              Admin reviews in dashboard
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
   VERIFIED/CONFIRMED          REJECTED (with reason)
```
- Magic-byte MIME validation (JPG, PNG, WEBP, PDF) on upload
- Storage abstraction: `IStorageService` (Local dev / S3 prod)

### State Machines (in `@reservy/domain`)
- **Booking**: PENDING_PAYMENT → PAYMENT_SUBMITTED → CONFIRMED → IN_PROGRESS → COMPLETED
- **Payment**: PENDING → PROOF_SUBMITTED → UNDER_REVIEW → VERIFIED/REJECTED
- Use `canTransitionBooking()` / `canTransitionPayment()` — never hardcode transitions

### Money Handling
- **Integers only** (Toman/Rial) — no floating point
- `tomanToRial(n) = n * 10`, `rialToToman(n) = n / 10`
- Formatting (`formatToman`) is presentation-layer only

---

## Testing

- **Framework**: `bun:test` (no Jest/Vitest)
- **Locations**:
  - `apps/api/src/__tests__/integration.test.ts` — cross-module integration
  - `packages/domain/src/__tests__/domain.test.ts` — pure domain logic
- Run single test: `bun test <path/to/file.test.ts>`
- Tests import from `@reservy/domain`, `@reservy/validation` (workspace packages)

---

## References

- `ARCHITECTURE.md` — Multi-tenancy, availability engine, concurrency, payment flow, storage abstraction
- `DOMAIN.md` — Entity relationships, state machines (Mermaid), money architecture
- `API.md` — Full REST endpoints and payloads
