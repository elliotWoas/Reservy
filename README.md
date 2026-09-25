# Reservy

> **Enterprise Multi-Tenant Online Service Booking SaaS Platform**
> Clean Architecture • Domain-Oriented Modular Monolith • Card-to-Card Payment Flow • Full Persian/RTL Support • Jalali Calendar

---

## 🌟 Key Features

- **Multi-Tenant Architecture**: Complete tenant data isolation at the database, service, and security layers.
- **Industry-Agnostic Core Domain**: Generic `Service + Staff + Schedule + Availability + Booking + Resource + Payment` engine suitable for Salons, Clinics, Doctors, Gyms, Consultants, Lawyers, Auto Shops, and beyond.
- **Advanced Availability Engine**: Timezone-aware slot generation accounting for shifts, breaks, holidays, blocked times, and service buffer times.
- **Double-Booking & Concurrency Prevention**: Database transactional conflict detection guaranteeing race-condition safety.
- **Card-to-Card Payment Workflow**: Bank card details presentation, client receipt image/PDF upload, server-side magic byte MIME validation, and admin approval/rejection dashboard.
- **Lightweight CRM**: Organization-scoped customer database tracking visit histories, completed/cancelled ratios, total spend, and internal staff notes.
- **Persian UI & Jalali Calendar**: Full `fa-IR` interface, `dir="rtl"` layout, Solar Hijri date display, and Toman currency handling.
- **Business Dashboard**: Day/Week calendar, manual booking creation, services CRUD, team & shift management, and financial analytics.
- **Platform Super Admin Panel**: Platform-level overview of tenants, organizations, and global metrics.

---

## 🛠 Tech Stack

- **Monorepo & Runtime**: Bun 1.3+ workspaces
- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Modular NestJS REST API with Clean Architecture and TypeScript
- **Database & ORM**: PostgreSQL / SQLite, Prisma ORM
- **Security**: JWT Authentication, RBAC & granular permissions, Magic byte MIME verification, input validation with Zod
- **Containers**: Docker & Docker Compose multi-stage production builds

---

## 💻 Command Line Interface (CLI) Guide

### 1. Local Development Commands

| Command | Description |
| :--- | :--- |
| `bun dev` | Run all applications (API & Web) concurrently in development mode |
| `bun dev:api` | Run only the Backend REST API (`http://localhost:4000`) |
| `bun dev:web` | Run only the Next.js Frontend (`http://localhost:3000`) |
| `bun test` | Run all unit and integration test suites |
| `bun test:coverage` | Run test suites with code coverage reporting |
| `bun typecheck` | Run TypeScript type checks across all packages |
| `bun lint` | Run code linter across all workspaces |

**⚠️ Port 5432 conflict (macOS)**: If you have Postgres.app or Homebrew PostgreSQL installed, Docker can't bind to 5432. Fix:
- **Option A**: Stop local PostgreSQL (`brew services stop postgresql@18` + quit Postgres.app), then use default port 5432
- **Option B**: Add `DB_PORT=5433` to `.env` and update `DATABASE_URL` to use port 5433

### 2. Database & Prisma Commands

| Command | Description |
| :--- | :--- |
| `bun db:generate` | Generate Prisma Client from `schema.prisma` |
| `bun db:push` | Synchronize Prisma schema with the active database |
| `bun db:migrate` | Create and apply database migrations in development |
| `bun db:migrate:prod` | Deploy pending database migrations to production |
| `bun db:seed` | Populate database with realistic Persian demo data |
| `bun db:studio` | Launch visual Prisma Studio database GUI |

**Note**: `db:seed` is not idempotent — if it fails mid-way, reset first: `bun db:push --force-reset`, then reseed.

### 3. Production & Build Commands

| Command | Description |
| :--- | :--- |
| `bun build` | Compile and bundle all workspaces for production |
| `bun build:api` | Build Backend API for production (`apps/api/dist`) |
| `bun build:web` | Build Next.js Web App for production |
| `bun start` | Start production servers |
| `bun start:api` | Start Backend API in production mode |
| `bun start:web` | Start Next.js Web App in production mode |

### 4. PM2 Process Management (No-Docker Deployment)

All operations are executed directly from the monorepo root:

| Command | Description |
| :--- | :--- |
| `bun pm2:start` | Start API via PM2 using `ecosystem.config.cjs` |
| `bun pm2:stop` | Stop the `reservy-api` PM2 instance |
| `bun pm2:restart` | Restart the `reservy-api` PM2 instance |
| `bun pm2:logs` | View real-time logs for `reservy-api` |
| `bun pm2:status` | Check the status of PM2 processes |

### 5. Docker & Container Commands

| Command | Description |
| :--- | :--- |
| `bun docker:up` | Start local Postgres, Redis, and MinIO S3 containers |
| `bun docker:down` | Stop and remove running docker compose containers |
| `bun docker:build` | Build production Docker images for API and Web |
| `bun docker:prod` | Launch complete containerized production stack (Postgres + Redis + API + Web) |

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Business Owner** | `owner@reservy.com` | `password123` | [http://localhost:3000/dashboard](http://localhost:3000/dashboard) |
| **Platform Super Admin** | `admin@reservy.com` | `password123` | [http://localhost:3000/admin](http://localhost:3000/admin) |

### Public Demo Links
- **Business Storefront**: [http://localhost:3000/aria-beauty](http://localhost:3000/aria-beauty)
- **Direct 6-Step Booking Wizard**: [http://localhost:3000/book/aria-beauty](http://localhost:3000/book/aria-beauty)

---

## 📄 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Architectural decisions, multi-tenancy, availability engine & concurrency design.
- [DOMAIN.md](./DOMAIN.md) — Entity relationships, state machines, and lifecycles.
- [API.md](./API.md) — Full REST API endpoints and payload specifications.
