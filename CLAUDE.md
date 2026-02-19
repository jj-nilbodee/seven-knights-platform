# CLAUDE.md — Seven Knights Re:Birth Guild Platform

## Project Overview

Unified guild management platform for Seven Knights Re:Birth mobile game. Combines two previously separate apps:
1. **Guild Tracker** (battle tracking, analytics, advent expedition, castle rush)
2. **GVG Guide Search** (attack guide database with hero search)

## Architecture

```
frontend/    → Next.js 16, React 19, Tailwind 4, Radix UI, Recharts
backend/     → FastAPI, Python 3.13+, SQLAlchemy 2.0, Pydantic v2, Alembic
database     → Supabase PostgreSQL 15+
auth         → Supabase Auth (email/password, app_metadata for roles)
storage      → Supabase Storage (hero images, battle media)
ai           → Google Vertex AI (screenshot OCR, advent optimization)
```

**No Firebase.** Supabase handles auth, database, and storage. GCP is only for Vertex AI + Cloud Run.

## Tech Stack Details

### Backend
- **FastAPI** with async endpoints
- **SQLAlchemy 2.0** async with `asyncpg` driver
- **Alembic** for migrations
- **Pydantic v2** for request/response schemas (use `model_config = ConfigDict(populate_by_name=True)` and `alias` for camelCase API responses)
- **python-jose** for Supabase JWT verification
- **supabase-py** for admin operations (user management, storage)
- **Layered architecture**: routes → services → repositories
  - `routes/` — thin HTTP handlers, parse request, call service, return response
  - `services/` — business logic, orchestration, validation
  - `repositories/` — all SQL queries via SQLAlchemy, one per entity

### Frontend
- **Next.js 16** with App Router
- **React 19** with hooks
- **Tailwind CSS 4** for styling
- **Radix UI** for accessible primitives
- **Recharts** for analytics charts
- **@supabase/ssr** for cookie-based auth sessions
- **Centralized API client** (`lib/api-client.ts`) that passes Supabase JWT to FastAPI
- Route groups: `(public)/` for unauthenticated, `(auth)/` for authenticated

### Database Conventions
- All tables use `uuid` primary keys (uuid_generate_v4)
- Timestamps: `created_at` and `updated_at` (TIMESTAMPTZ, auto-updated via trigger)
- JSONB for flexible nested data (team compositions, skill sequences, scores)
- TEXT arrays with GIN indexes for hero search (defense_heroes, attack_heroes)
- pg_trgm for Thai fuzzy text search on hero names
- Foreign keys with ON DELETE CASCADE where appropriate
- CHECK constraints for enums (status, result, battle_type, etc.)

### Auth Model
Three-tier roles stored in Supabase Auth `app_metadata`:
- **admin**: full access, can manage all guilds
- **officer**: manage their guild's data (battles, members, guides)
- **member**: view their guild's data (pending → approved workflow)

FastAPI verifies Supabase JWT and reads `app_metadata.role` + `app_metadata.guildId`.
RLS on PostgreSQL as defense-in-depth (primary enforcement is in FastAPI middleware).

### API Conventions
- All routes prefixed with `/api/`
- Response schemas use camelCase aliases (e.g., `guild_id` → `guildId`)
- List endpoints return arrays directly (not wrapped in `{ data: [...] }`)
- Errors return `{ "detail": "..." }` with appropriate HTTP status
- Pagination: `?limit=20&offset=0` where needed
- Filtering: query params (e.g., `?status=published&defense_heroes=hero1,hero2`)

## Reference Repos

The old repos contain business logic to port (not copy verbatim — adapt to new architecture):

- `../seven-knights-guild-tracker/` — FastAPI + Firestore guild tracker
  - `backend/app/api/routes/` — route logic to port
  - `backend/app/models/schemas.py` — Pydantic schemas to adapt
  - `backend/app/services/ai/` — Vertex AI client (port mostly as-is)
  - `backend/app/services/advent_optimizer.py` — port as-is
  - `backend/tests/` — test patterns to follow
  - `frontend/components/` — React components to port
  - `frontend/app/` — page structure to replicate
  - `frontend/types/index.ts` — TypeScript types to merge

- `../gvg-7k-search/` — Next.js + Supabase GVG guide search
  - `gvg-7k-search/app/page.tsx` — hero search + guide card components to port
  - `gvg-7k-search/app/guide/[id]/` — guide detail view
  - `gvg-7k-search/app/admin/` — guide admin pages
  - `gvg-7k-search/app/api/` — guide API logic (rewrite as FastAPI routes)
  - `gvg-7k-search/supabase/schema.sql` — guide schema (merged into unified schema)
  - `gvg-7k-search/app/globals.css` — GVG-specific styles to merge

## Build Phases

Build in this order. Each phase should be fully working before moving to the next.

### Phase 1: Foundation
- [ ] Project scaffolding (backend + frontend directories)
- [ ] Backend: FastAPI app with health check
- [ ] Backend: SQLAlchemy 2.0 async engine + session management
- [ ] Backend: Alembic setup + initial migration with full schema
- [ ] Backend: Supabase JWT auth middleware (CurrentUser, role dependencies)
- [ ] Backend: Supabase admin client for user management + storage
- [ ] Frontend: Next.js 16 app with Tailwind 4 + Radix UI setup
- [ ] Frontend: Supabase Auth context (login, register, signOut)
- [ ] Frontend: API client that passes Supabase JWT to FastAPI
- [ ] Frontend: Protected route component + auth layout

### Phase 2: Core Entities
- [ ] Heroes: SQLAlchemy model, repository, schemas, routes (CRUD + Thai search)
- [ ] Guilds: model, repo, schemas, routes
- [ ] Members: model, repo, schemas, routes (roster management)
- [ ] Users + Officers: models, repo, routes
- [ ] Member Access: model, repo, routes (request/approve/reject flow)
- [ ] Frontend: Admin hero management page
- [ ] Frontend: Admin guild management page
- [ ] Frontend: Roster page
- [ ] Frontend: Login + Register pages
- [ ] Frontend: Access request page

### Phase 3: Guild War
- [ ] Battles: model, repo, service, routes (CRUD with team composition validation)
- [ ] Battle hero pairs: auto-populated via SQLAlchemy event or DB trigger
- [ ] Frontend: Battle list page
- [ ] Frontend: Battle submission page (formation selector, hero selector, skill sequence)
- [ ] Frontend: Battle detail page

### Phase 4: Analytics
- [ ] Analytics repository: all SQL queries (dashboard, matchups, formations, speed, counter-comp, etc.)
- [ ] Analytics service + routes (thin, delegates to repo)
- [ ] Frontend: Dashboard with KPIs
- [ ] Frontend: Analytics sub-pages (matchups heatmap, formation matrix, speed charts, counter recommendations, member performance, enemy guilds, win rate trend, hero usage)

### Phase 5: GVG Guides
- [ ] GVG Guide: model, repo, service, routes (public search + admin CRUD)
- [ ] Guide versioning: auto-snapshot via DB trigger
- [ ] Frontend: Public guide search page (hero autocomplete, guide cards)
- [ ] Frontend: Public guide detail page (skill chain visualization)
- [ ] Frontend: Admin guide management (list, create, edit)

### Phase 6: Advent + Castle Rush
- [ ] Advent: models, repo, service, routes (cycles, profiles, AI optimization)
- [ ] Advent AI: port Vertex AI client + advent extractor
- [ ] Castle Rush: models, repo, service, routes (scores, AI screenshot extraction)
- [ ] Frontend: Advent expedition pages (main, cycles, plan, public submission)
- [ ] Frontend: Castle Rush pages (main, submit, history, rankings)

### Phase 7: Attack Guidelines
- [ ] Attack Guidelines: model, repo, routes (defense team → counter strategies)
- [ ] Frontend: Public guidelines view
- [ ] Frontend: Admin guidelines CRUD

### Phase 8: Polish
- [ ] Integration tests (testcontainers-postgres)
- [ ] E2E tests (Playwright)
- [ ] Error handling + loading states across all pages
- [ ] Mobile responsiveness
- [ ] Thai language throughout UI
- [ ] Deployment configs (Cloud Run Dockerfile, Vercel config)

## Testing

### Backend
- Use `pytest` with `pytest-asyncio`
- Use `testcontainers` for real PostgreSQL in tests
- Factory pattern for test data (see `tests/factories/`)
- Target 90%+ coverage
- Test files mirror source: `tests/integration/routes/test_battles.py`

### Frontend
- Use `vitest` + `@testing-library/react`
- Use `msw` for API mocking
- Test files in `__tests__/` mirroring source structure
- E2E with Playwright in `e2e/`

## Supabase Key Convention

This project uses the **Supabase Vercel Integration**, which provisions keys as:
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not the old `anon_key`)
- `SUPABASE_SERVICE_ROLE_KEY`

The publishable key uses the `sb_publishable_` prefix format. All frontend Supabase clients use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, NOT `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The backend uses `SUPABASE_SERVICE_ROLE_KEY` for admin operations and `SUPABASE_JWT_SECRET` for token verification.

## Commands

```bash
# Backend
cd backend
uv run alembic upgrade head          # Run migrations
uv run uvicorn main:app --reload     # Dev server on :8000
uv run pytest                        # Tests

# Frontend
cd frontend
npm run dev                          # Dev server on :3000
npm run test                         # Unit tests
npm run build                        # Production build
```

## Style Notes

- Thai language for all user-facing text in the frontend
- Dark theme with gaming aesthetic (reds, golds, tactical feel)
- Mobile-first responsive design
- The GVG guide search page has a distinctive visual style from the old repo — preserve that aesthetic
