# Mentra System Design

## Executive Summary

Mentra is a Next.js web application that provides immediate AI-powered assignment feedback before official grading. The system enables a continuous learning loop where users create organizations with custom criteria, submit work, and iterate based on actionable AI-generated feedback.

**Core Value Proposition**: Transform grading from a delayed, final judgment into an iterative learning process.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer (Browser)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Next.js App  │  │ Firebase     │  │ Radix UI +          │  │
│  │ Router Pages │  │ Auth SDK     │  │ Tailwind CSS v4     │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────────────────┘  │
│         │                  │                                      │
│         └──────────────────┼──────────────────────────────────────┘
│                            │
┌────────────────────────────┼──────────────────────────────────────┐
│  Next.js Server (Node.js) │                                      │
│  ┌────────────────────────▼──────────────────────────────────┐   │
│  │              API Routes (/api/*)                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │   │
│  │  │ Organizations│  │ Assignments  │  │ AI Services   │  │   │
│  │  │ & Members    │  │ & Submissions│  │ /review       │  │   │
│  │  └──────────────┘  └──────────────┘  │ /generate-    │  │   │
│  │                                       │   rules       │  │   │
│  │                                       │ /grade-submit │  │   │
│  │                                       └───────────────┘  │   │
│  └───────────────────────────────────────────────────────────┘   │
│                            │                                      │
│  ┌────────────────────────▼──────────────────────────────────┐   │
│  │         Data Access Layer (Prisma v7 + pg Adapter)        │   │
│  └───────────────────────────────────────────────────────────┘   │
└────────────────────────────┬──────────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                    External Services                               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ PostgreSQL   │  │ OpenAI API   │  │ Firebase Auth       │   │
│  │ (Neon DB)    │  │ (gpt-4o-mini)│  │ (Token Validation) │   │
│  └──────────────┘  └──────────────┘  └─────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 + Radix UI components
- **Auth**: Firebase Client SDK
- **State Management**: React built-in (no external state library)

### Backend
- **Runtime**: Node.js (via Next.js server)
- **API Pattern**: Next.js Route Handlers (App Router)
- **ORM**: Prisma v7 with `@prisma/adapter-pg`
- **Database**: PostgreSQL 16 (Neon DB in production)
- **AI Integration**: OpenAI SDK (`gpt-4o-mini` model)

### Development & Build
- **Language**: TypeScript 5
- **Linting**: ESLint (Next.js core web vitals + TypeScript config)
- **Build Tool**: Next.js Turbopack
- **Package Manager**: npm

## Core Components

### 1. Authentication System

**Client-Side Auth Flow**:
```
User Login → Firebase Auth → ID Token → Stored in client → Sent via Authorization header
```

**Server-Side Validation** (`src/lib/server-auth.ts`):
- Extracts Bearer token from `Authorization` header
- Decodes JWT payload (no signature verification - trusts Firebase-issued tokens)
- Extracts `user_id` from token claims (`user_id`, `sub`, or `uid`)
- All API routes scope queries by `createdByUserId`

**Demo Mode**: Available at dev time with hardcoded credentials (`rob@launchpadphilly.org` / `password123`).

### 2. Organization Management

**Key Files**:
- `src/app/api/organizations/route.ts` - List/create organizations
- `src/app/api/organizations/[id]/route.ts` - Get/update/delete specific organization
- `src/app/api/createOrganization/route.ts` - Organization creation handler

**Data Isolation**: Each organization is linked to `createdByUserId`. Users can only access their own organizations.

### 3. Assignment System

**Key Files**:
- `src/app/api/assignments/[id]/route.ts` - Assignment details
- `src/app/api/createAssignment/route.ts` - Assignment creation
- `src/app/api/organizations/[id]/assignments/route.ts` - List org assignments

**Flow**: Organization → Assignment → Submission → AI Review

### 4. AI Grading Engine

**Review Endpoint** (`/api/review`):
- Accepts: Text content, file uploads (DOCX, TXT), or screenshot data URLs
- Processes documents via `mammoth` (DOCX) or `pdf-parse` (PDF)
- Sends structured prompt to OpenAI with grading rules
- Returns: Letter grade, numeric score, feedback array
- Supports multiple grading systems: Letter grades, percentages, GPA scale

**Rule Generation** (`/api/generate-rules`):
- Generates 5-8 grading criteria from organization name + description
- Uses OpenAI with JSON schema enforcement (`response_format: json_schema`)
- Handles descriptions >500 chars via chunking

**Grading System Support** (`/api/gradeSubmission`):
- Custom grading rubrics with configurable levels
- Criterion-based assessment with AI-generated results

## Data Model

### Core Entities

```
User
├── id: cuid
├── email: unique
├── name: optional
├── organizationsCreated: Organization[]
├── submissions: Submission[]
└── memberships: OrganizationMember[]

Organization
├── id: cuid
├── createdByUserId: FK → User
├── name
├── description
├── gradingSystem (e.g., "letter", "percentage", "gpa")
├── gradingRubric: JSON array of grade entries
├── criteria: Criterion[]
├── rules: Rule[]
├── assignments: Assignment[]
└── members: OrganizationMember[]

Assignment
├── id: cuid
├── organizationId: FK → Organization
├── createdByUserId: FK → User
├── title
├── instructions
├── rules: AssignmentRule[]
└── submissions: Submission[]

Submission
├── id: cuid
├── assignmentId: FK → Assignment
├── userId: FK → User
├── content: text
├── aiScore: float
├── status: "draft" | ...
├── feedback: Feedback?
└── results: Result[]

Criterion
├── id: cuid
├── organizationId: FK → Organization
├── name
├── description
├── levels: Level[]
└── results: Result[]

Level
├── id: cuid
├── criterionId: FK → Criterion
├── label (e.g., "Excellent", "Good", "Poor")
├── score: float
└── description

Result
├── id: cuid
├── submissionId: FK → Submission
├── criterionId: FK → Criterion
├── selectedLevelId: FK → Level
├── reasoning
├── improvementSuggestions: JSON
└── confidence: float

Rule
├── id: cuid
├── organizationId: FK → Organization
├── title
├── description
├── weight: default 1
└── assignments: AssignmentRule[]

Feedback
├── id: cuid
├── submissionId: FK → Submission (unique)
├── overallComment
├── strengths
├── improvements
└── rubricBreakdown: JSON
```

### Data Isolation Strategy

All queries are scoped by `createdByUserId`:
- API routes extract user ID from Firebase token
- Database queries filter by `createdByUserId` on organizations
- Cross-user access returns 403 Forbidden

## API Design

### Authentication

All API routes expect:
```
Authorization: Bearer <Firebase ID Token>
```

### Key Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/organizations` | GET, POST | List/create organizations | Yes |
| `/api/organizations/[id]` | GET, PUT, DELETE | Organization CRUD | Yes (owner) |
| `/api/organizations/[id]/assignments` | GET, POST | List/create assignments | Yes (owner) |
| `/api/assignments/[id]` | GET | Assignment details | Yes (via org) |
| `/api/createOrganization` | POST | Create organization | Yes |
| `/api/createAssignment` | POST | Create assignment | Yes |
| `/api/submitAssignment` | POST | Submit work | Yes |
| `/api/gradeSubmission` | POST | Grade with criteria | Yes |
| `/api/review` | POST | AI review (content/file) | No* |
| `/api/generate-rules` | POST | AI rule generation | No* |

*AI endpoints check `OPENAI_API_KEY` env var, not user auth.

### Request/Response Patterns

**Content Types**:
- `application/json` for structured data
- `multipart/form-data` for file uploads (DOCX, TXT, PDF)

**AI Response Format** (enforced via JSON schema):
```json
{
  "grade": "B+",
  "score": 87,
  "feedback": ["strength1", "improvement1", ...]
}
```

## Security Architecture

### Authentication & Authorization

1. **Firebase Auth**: Client-side authentication with ID tokens
2. **Server Validation**: JWT decoding (no signature check - trusts Firebase)
3. **Data Scoping**: All queries filtered by `createdByUserId`
4. **Demo Mode**: Separate auth path for development testing

### API Security

- No auth: AI endpoints validate `OPENAI_API_KEY` presence
- With auth: Token extraction → user ID → scoped queries
- 401 for missing/invalid tokens
- 403 for cross-user access attempts

### Environment Security

- `.env.local` excluded from git (in `.gitignore`)
- `OPENAI_API_KEY` server-side only (not `NEXT_PUBLIC_*`)
- Firebase config exposed to client (safe for Firebase)

## AI Integration

### Model Configuration

- **Model**: `gpt-4o-mini` (cost-effective for grading)
- **Temperature**: 0.2 (low randomness for consistent grading)
- **Response Format**: JSON schema enforcement (structured output)

### Prompt Engineering

**Review Prompt Structure**:
1. System context (expert academic grader)
2. Assignment/org context
3. Grading criteria (rules)
4. Student submission content
5. Optional screenshot for visual context
6. Grading system instructions (letter/percentage/GPA)
7. JSON output format specification

**Rule Generation Prompt**:
1. Curriculum designer persona
2. Organization context
3. Chunking for long descriptions (>500 chars)
4. Measurable criteria requirements
5. JSON array output

### Error Handling

- OpenAI API errors mapped to user-friendly messages
- Rate limiting (429) → retry suggestion
- Auth errors (401) → key configuration message
- Server errors (5xx) → temporary unavailability message

## Deployment Architecture

### Development

```
Local Machine
├── Next.js Dev Server (npm run dev)
│   └── Custom wrapper: Temporarily renames .env.local
├── PostgreSQL (Docker: docker compose up -d db)
└── Environment: .env.local
```

### Production (Recommended)

```
Vercel (or similar)
├── Next.js Build (npm run build)
│   └── Runs prisma generate before build
├── PostgreSQL: Neon DB (serverless Postgres)
└── Environment Variables (Vercel dashboard)
    ├── DATABASE_URL (Neon connection string)
    ├── OPENAI_API_KEY
    └── NEXT_PUBLIC_FIREBASE_*
```

### Docker Setup

Current `docker-compose.yml` has path issues (assumes `./app` subdirectory). For containerized deployment:
- Update volume mounts to match repo root structure
- Use `npm run dev` command (which handles env file renaming)

## Performance Considerations

### Database
- Prisma connection pooling via `pg` Pool
- Neon DB serverless for automatic scaling
- Cascade deletes on related entities

### AI Calls
- No caching layer currently (each review hits OpenAI API)
- Cost: ~$0.01-0.05 per submission review
- Rate limiting handled via error responses

### File Uploads
- Supported: DOCX (mammoth), TXT (native), PDF (pdf-parse)
- DOCX parsing on server-side
- PDF support noted as requiring additional setup

## Scalability Considerations

### Current Limitations
- No caching for AI responses (repeated submissions cost again)
- Single-tenant architecture (no multi-user org sharing beyond members)
- No background job queue for heavy AI processing

### Future Scaling Paths
1. Add Redis caching for AI responses (key: content hash + rules hash)
2. Implement background job queue (Bull/Redis) for AI processing
3. Add organization membership roles (admin, member, viewer)
4. File storage service (S3/R2) for large submissions
5. Rate limiting per user (to control AI costs)

## Monitoring & Observability

### Current
- Prisma logging: Errors only in production, silent in dev
- Console.error for API failures
- OpenAI API error status codes mapped to messages

### Recommended Additions
- Error tracking (Sentry)
- AI cost tracking (OpenAI usage dashboard)
- Database query performance (Prisma logs in dev)
- API response times and success rates

## Testing Strategy

### Current State
- No automated test framework configured
- Manual testing via demo login
- AI testing scenarios documented in `AI_TESTING.md`

### Recommended
1. Unit tests: Business logic, prompt construction, response parsing
2. Integration tests: API routes with test database
3. E2E tests: Critical paths (login → create org → submit → review)
4. AI mocking: Mock OpenAI responses for deterministic tests
5. Fixtures: Test data for organizations, assignments, submissions
