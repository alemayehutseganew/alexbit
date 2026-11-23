# PrimeHorizon Group PLC - Agent Instructions

## Brand Identity (Strictly Enforced)
- **Legal Name (EN):** PrimeHorizon Group Trading PLC
- **Legal Name (AM):** ፕራይም ሆራይዘን ግሩፕ ትሬዲንግ ኃ/የተ/የግ/ማህበር
- **Official Phone:** 0914230500
- **Primary Brand Color:** Deep Corporate Blue (`#0b4a8b`)

## Tech Stack
- **Frontend (`apps/web`):** Next.js 15 (App Router), React 19, Tailwind CSS, `next-intl` (for EN/AM bilingual support).
- **Backend (`apps/api`):** NestJS 11 (Fastify adapter), Prisma ORM, PostgreSQL.
- **Language:** TypeScript (Strict mode).

## Architecture Rules
- **Monorepo:** Turborepo.
- **Auth:** Separate Keycloak realms for Clients and Shareholders (do not merge logic).
- **Database:** Multi-tenant with PostgreSQL Row-Level Security (RLS). All queries must filter by `tenantId`.
- **Fonts:** Pair `Inter` for English and `Noto Sans Ethiopic` for Amharic.