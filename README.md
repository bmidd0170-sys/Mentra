# Mentra

Mentra is a Next.js web application that gives users immediate, AI-powered assignment feedback before official grading. Instead of waiting for delayed review, users can create organizations with custom criteria, submit work, and iterate based on actionable feedback.

## Why Mentra

Traditional grading is often delayed and final. Mentra turns grading into a continuous learning loop:

- Define organizations (courses/programs/teams) with custom rules
- Create assignments under each organization
- Submit work and receive AI-generated score + guidance
- Improve and resubmit with clearer expectations

## Core Features

- Intro and onboarding flow with clear call-to-action
- Login support (Firebase-based auth wiring + demo login mode)
- Dashboard with organizations and assignment overview
- Organization management (create/view/edit flows)
- Assignment management (create/view details and submit work)
- AI-generated rule creation for organizations
- AI grading and feedback for assignment submissions
- Profile and settings pages
- Shared app header/navigation across authenticated screens

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Prisma + PostgreSQL
- OpenAI API (`gpt-4o-mini`) for review and rule generation
- Firebase client auth integration
- Tailwind CSS v4 + Radix UI components

## Project Structure

- `src/app` - Routes and API handlers
- `src/components` - Shared UI and app components
- `src/lib` - Firebase config, demo auth, utilities, mock data
- `prisma/schema.prisma` - Database schema
- `AI_SETUP.md` - AI setup notes
- `AI_TESTING.md` - AI testing scenarios

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` (or `.env`) and fill in real values:

```env
DATABASE_URL="postgresql://mentra:mentra@localhost:5432/mentra?schema=public"
OPENAI_API_KEY="sk_your_key_here"

NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
```

### 3. Start PostgreSQL (local Docker)

If you only need the database container:

```bash
docker compose up -d db
```

### 4. Prepare Prisma

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the app

```bash
npm run dev
```

Open http://localhost:3000.

## Demo Login

For local testing without full auth setup, a demo credential path is available:

- Email: `rob@launchpadphilly.org`
- Password: `password123`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production build
- `npm run lint` - Run ESLint

## API Endpoints

### POST `/api/review`

Evaluates submission content against assignment rules and returns:

- letter grade
- numeric score
- feedback list

### POST `/api/generate-rules`

Generates 5-8 grading rules from organization name + description.

## Docker Notes

The current `docker-compose.yml` references an `./app` subdirectory. This repository is currently rooted at the project top-level, so update compose paths if you want full app + db containerized development from this root.

## Documentation

- `AI_SETUP.md` - OpenAI key setup and endpoint examples
- `AI_TESTING.md` - End-to-end AI test scenarios and troubleshooting
- `Week1.md` and `Week2.md` - milestone planning docs
- `Wireframe.md` - UI planning notes

## Roadmap

- Assignment history and progression tracking visuals
- Better notification workflows and reminders
- More robust file upload pipeline (documents/repos)
- Streaming AI feedback and richer rubric analytics

## Learn More

- Next.js docs: https://nextjs.org/docs
- Prisma docs: https://www.prisma.io/docs
- OpenAI API docs: https://platform.openai.com/docs

