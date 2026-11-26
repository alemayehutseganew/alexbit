# PrimeHorizon Group PLC - Agent Instructions

## Brand Identity (Strictly Enforced)
- **Legal Name (EN):** PrimeHorizon Group Trading PLC
- **Legal Name (AM):** ፕራይም ሆራይዘን ግሩፕ ትሬዲንግ ኃ/የተ/የግ/ማህበር
- **Official Phone:** 0914230500
- **Primary Brand Color:** Deep Corporate Blue (`#0b4a8b`)

## Tech Stack
- **Frontend (`frontend/`):** Next.js 15 (App Router), React 19, Tailwind CSS, `next-intl` (for EN/AM bilingual support).
- **Backend (`backend/`):** NestJS 11 (Fastify adapter), Prisma ORM, PostgreSQL.
- **Language:** TypeScript (Strict mode).

## Architecture Rules
- **Applications:** Keep the frontend and backend independently installable and buildable; do not reintroduce workspace/monorepo dependencies.
- **Auth:** Separate Keycloak realms for Clients and Shareholders (do not merge logic).
- **Database:** Multi-tenant with PostgreSQL Row-Level Security (RLS). All queries must filter by `tenantId`.
- **Fonts:** Pair `Inter` for English and `Noto Sans Ethiopic` for Amharic.