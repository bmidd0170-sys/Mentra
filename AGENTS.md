# AGENTS.md

## Commands

- `npm run dev` — Starts Next.js dev server via custom wrapper (`scripts/run-next-env-only.mjs`). The wrapper temporarily renames `.env.local` to `.env.local.__next-dev-backup__` while the dev server runs, restoring it on exit.
- `npm run build` — Runs `prisma generate` then `next build`. Prisma client must be regenerated before each build.
- `npm run lint` — ESLint (Next.js core web vitals + TypeScript config).

No test framework or test script is configured.

## Environment

Requires `.env.local` with:
- `DATABASE_URL` — PostgreSQL connection (default: `postgresql://mentra:mentra@localhost:5432/mentra?schema=public`)
- `OPENAI_API_KEY` — Used by `/api/review` and `/api/generate-rules` (model: `gpt-4o-mini`)
- `NEXT_PUBLIC_FIREBASE_*` — Firebase client config for auth

Docker: `docker compose up -d db` starts PostgreSQL 16. The `docker-compose.yml` assumes an `./app` subdirectory, but this repo is rooted at the top level — update compose paths if containerizing the app.

## Architecture

Single Next.js 16 App Router app (not a monorepo). Path alias: `@/*` → `./src/*`.

- `src/app/*` — Routes and API handlers (`/api/review`, `/api/generate-rules`)
- `src/components/*` — Shared UI (Radix UI + Tailwind CSS v4)
- `src/lib/*` — Firebase config, demo auth, utilities
- `prisma/schema.prisma` — PostgreSQL schema (User, Organization, Assignment, Submission, etc.)

Firebase auth is client-side only; API routes read `Authorization: Bearer <idToken>` and scope all queries by `createdByUserId`. Demo login available at dev time (email: `rob@launchpadphilly.org`, password: `password123`).

## Prisma

After schema changes: `npx prisma generate && npx prisma db push`. Client output is consumed by `@prisma/client` in `node_modules/.prisma`.
