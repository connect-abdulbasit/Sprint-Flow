# Sprint-Flow

A full-stack project management platform — create organizations, workspaces, and projects; plan sprints on a Kanban board; track tickets with dependencies, time entries, comments, and @mentions; and manage team access with role-based permissions.

---

## Features

- **Organizations & Workspaces** — multi-tenant structure with invite-based onboarding
- **Projects & Sprints** — full sprint lifecycle (planning → active → completed)
- **Kanban Board** — drag-and-drop columns with custom configuration per project
- **Tickets** — auto-numbered keys (SF-1, SF-2…), priorities, types, story points, assignees, due dates, image attachments, and blocking/blocked-by dependencies
- **Time Tracking** — log hours per ticket with descriptions
- **Comments & @Mentions** — nested comments with mention-based notifications
- **Notifications** — real-time feed with pagination and read/unread tracking
- **Activity Log** — workspace-level audit trail for all actions
- **RBAC** — three-tier role hierarchy (admin / project_manager / member) with 42 granular permissions
- **Authentication** — email/password with JWT sessions + Google OAuth 2.0

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, TypeScript 5, Tailwind CSS 4 |
| Backend | Next.js API Routes (Node.js runtime) |
| Database | PostgreSQL via Drizzle ORM |
| Auth | Custom JWT (HS256, constant-time comparison) + Google OAuth 2.0 |
| Dev tooling | ESLint, Prettier, Husky pre-commit hooks |
| Analytics | Vercel Analytics |

---

## Architecture

The backend follows a three-layer architecture inside `src/modules/`:

```
Controller  →  receives HTTP request, validates input, serializes response
Service     →  business logic, cross-cutting concerns (notifications, activity log)
Repository  →  all database access via Drizzle ORM
```

Each of the 14 feature modules (auth, workspace, project, sprint, task, comment, time\_entry, notification, activity, organization, user, board, attachment) is self-contained with its own schema, types, and the three layers above.

Additional design decisions:

- **RBAC** — permission-based authorization enforced in service layer (`src/lib/auth/rbac.ts`)
- **Sliding-window rate limiter** — in-memory algorithm guards all auth endpoints against brute force (`src/lib/rate-limiter.ts`)
- **Monotonic ticket numbering** — per-project auto-increment inside a DB transaction prevents gaps and race conditions
- **Denormalization** — `assigneeName`/`reporterName` stored on the tasks row to eliminate repeated user joins on board render
- **DB connection pooling** — `globalThis` singleton in `src/lib/db.ts` reuses the pool across hot-reloads in dev

**Design diagrams** — [`docs/diagrams/`](docs/diagrams/) (architecture, data model, and behavior views):

- [Architecture overview](docs/diagrams/Architecture-Diagram.png)
- [Entity–relationship diagram](docs/diagrams/ERD.png)
- [Class diagram](docs/diagrams/Class-Diagram.svg)
- [Sequence diagram](docs/diagrams/Sequence-Diagram.png)
- [Use-case diagram](docs/diagrams/Use-Case-Diagram.png)

**Project documents** — [`docs/documents/`](docs/documents/) (Word / PDF deliverables; files follow `SprintFlow_<Title>_<optional-version>.<ext>`):

- `SprintFlow_SRS.docx` — software requirements specification
- `SprintFlow_Project_Report_v2.docx` — project report
- `SprintFlow_Project_Proposal.pdf` — project proposal

---

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local Docker or a hosted service like Supabase)
- A Google Cloud project with an OAuth 2.0 client (only required for Google sign-in)

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/sprint-flow.git
cd sprint-flow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in every value. See [Environment Variables](#environment-variables) below.

### 4. Start the database

A `docker-compose.yml` is included for a local PostgreSQL instance:

```bash
docker compose up -d
```

Or point `DATABASE_URL` at any existing PostgreSQL server.

### 5. Push the database schema

```bash
npm run db:push
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT access tokens (min 32 chars). Generate with `openssl rand -hex 32` |
| `ACCESS_TOKEN_EXPIRES_IN` | No | Access token TTL, e.g. `15m`, `1h` (default: `15m`) |
| `GOOGLE_CLIENT_ID` | Yes* | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes* | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Yes* | Must match the redirect URI registered in Google Cloud Console |

\* Required only if Google sign-in is used. Email/password auth works without these.

See [`.env.example`](.env.example) for a template.

---

## Available Scripts

```bash
npm run dev           # Start development server
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint (strict, zero warnings)
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier formatting
npm run type-check    # TypeScript type check (no emit)
npm run db:push       # Apply Drizzle schema to the database
npm run db:studio     # Open Drizzle Studio (interactive DB browser)
```

---

## API Overview

All API routes live under `src/app/api/` and follow RESTful conventions.

| Resource | Base path |
|---|---|
| Authentication | `/api/auth/` |
| Organizations | `/api/organizations/` |
| Workspaces | `/api/workspaces/` |
| Projects | `/api/projects/` |
| Sprints | `/api/projects/[id]/sprints/` |
| Tickets | `/api/projects/[id]/tickets/` |
| Time entries | `/api/projects/[id]/tickets/[id]/time-entries/` |
| Comments | `/api/workspaces/[id]/tasks/[id]/comments/` |
| Notifications | `/api/workspaces/[id]/notifications/` |
| Invites | `/api/invites/` |

Every route returns JSON. Errors follow `{ "error": "message" }` with an appropriate HTTP status code.

---

## Project Structure

```
docs/
├── diagrams/             # Visual design: architecture, ERD, class, sequence, use case
└── documents/            # Written deliverables: SRS, report, proposal (Word / PDF)

drizzle/                  # Generated SQL migrations + Drizzle Kit meta

src/
├── app/                  # Next.js App Router (pages + API routes)
│   ├── api/              # REST API route handlers
│   ├── workspace/        # Workspace pages (board, sprints, settings…)
│   ├── organization/     # Organization pages
│   ├── onboarding/       # First-run onboarding flow
│   ├── signin/           # Sign-in page
│   └── signup/           # Sign-up page
├── modules/              # 14 feature modules (controller/service/repository)
├── components/           # React UI components
├── hooks/                # Custom React hooks
├── contexts/             # React context providers
├── lib/                  # Shared utilities (JWT, RBAC, rate limiter, pagination…)
├── db/                   # Drizzle ORM schema + client
└── middleware.ts         # Auth middleware (token refresh on every request)
```

---

## Deployment

The app is designed to deploy on [Vercel](https://vercel.com):

1. Push to GitHub
2. Import the repository in Vercel
3. Set all environment variables in the Vercel dashboard
4. Deploy — Vercel detects Next.js automatically

For a self-hosted deployment, run `npm run build && npm run start` on any Node.js 20+ server and point the environment at a production PostgreSQL instance.

---

## License

MIT
