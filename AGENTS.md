# AGENTS.md

## Commands

- `npm run dev` — uses `scripts/run-next-env-only.mjs` which renames `.env.local` → `.env.local.__next-dev-backup__` while the dev server runs, then restores it on exit. Next.js loads `.env` instead during dev.
- `npm run build` — runs `prisma generate` before building. Never skip this step.
- `npm run lint` — ESLint only. No typecheck script exists; use `npx tsc --noEmit` directly if needed.

## Dev environment

- PostgreSQL required locally. Start with `docker compose up -d db` or provide a `DATABASE_URL` in `.env`.
- After pulling/changing schema: `npx prisma generate && npx prisma db push`
- Demo login: `rob@launchpadphilly.org` / `password123` (Firebase demo mode, no real auth needed)

## Architecture notes

- Next.js 16 App Router, `"use client"` directives used extensively in dashboard routes
- Path alias: `@/*` → `./src/*` (see `tsconfig.json`)
- All API routes under `src/app/api/*` require Firebase ID token in `Authorization: Bearer <idToken>` header; unauthenticated requests return 401
- Data isolation: all Prisma queries filter by `createdByUserId` — never skip this in new API routes
- Prisma IDs use `cuid()`; `datasource db` in `schema.prisma` has no `url` — it reads from `DATABASE_URL` env var
- OpenAI calls use `gpt-4o-mini` for `/api/review` and `/api/generate-rules`

## Mock data

`src/lib/mock-data.ts` exports `mockUser`, `mockOrganizations`, and `mockAssignments` used in dashboard routes. Notification mock data has been removed; notification state is now managed locally with empty arrays in `layout.tsx` and `profile/page.tsx`.

## Docker

`docker-compose.yml` assumes the repo root is the project root. The README notes that compose paths may need updating if the app is moved to an `./app` subdirectory.
