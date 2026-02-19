# CLAUDE.md — Seven Knights Re:Birth Guild Platform

## Project Overview

Unified guild management platform for Seven Knights Re:Birth mobile game. Combines two previously separate apps:
1. **Guild Tracker** (battle tracking, analytics, advent expedition, castle rush)
2. **GVG Guide Search** (attack guide database with hero search)

## Architecture

```
app/              → Next.js 16 App Router (pages, layouts, server components)
app/api/          → Route Handlers (REST endpoints where needed)
actions/          → Server Actions (mutations, form handling)
lib/db/           → Drizzle ORM (schema, queries, migrations)
lib/ai/           → Vertex AI JS SDK (screenshot OCR, advent optimizer)
lib/supabase/     → Supabase client (auth, storage)
components/       → React components (UI, analytics charts, guild-war, guides)
```

**Full-stack Next.js. One language. One deployment.**

- **No Python backend.** No FastAPI. No Cloud Run.
- **No Firebase.** Supabase handles auth, database, and storage.
- **Deployed entirely on Vercel.**

## Tech Stack

| Concern | Solution |
|---------|----------|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript (end-to-end) |
| React | React 19 + React Compiler (`reactCompiler: true`) |
| Styling | Tailwind CSS 4 |
| UI primitives | Radix UI |
| Charts | Recharts |
| ORM | Drizzle ORM + drizzle-kit (migrations) |
| Database | Supabase PostgreSQL 15+ |
| Auth | Supabase Auth (@supabase/ssr, cookie-based sessions) |
| Storage | Supabase Storage (hero images, battle media) |
| Validation | Zod (shared between client and server) |
| AI | @google-cloud/vertexai (screenshot OCR, advent optimization) |
| Testing | Vitest + Testing Library + Playwright |
| Deployment | Vercel |

## Supabase Key Convention

This project uses the **Supabase Vercel Integration**, which provisions keys as:
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not the old `anon_key`)
- `SUPABASE_SERVICE_ROLE_KEY`

The publishable key uses the `sb_publishable_` prefix format. All frontend Supabase clients use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Server-side admin operations use `SUPABASE_SERVICE_ROLE_KEY`.

## Key Architectural Patterns

### Data Fetching — Server Components (not API calls)

Pages fetch data directly on the server. No API client, no CORS, no round-trips:

```typescript
// app/(auth)/guild-war/page.tsx — Server Component
import { db } from "@/lib/db";
import { battles, members } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";

export default async function GuildWarPage() {
  const user = await getCurrentUser();

  const recentBattles = await db
    .select()
    .from(battles)
    .where(eq(battles.guildId, user.guildId))
    .orderBy(desc(battles.date))
    .limit(20);

  return <BattleList battles={recentBattles} />;
}
```

### Mutations — Server Actions

Form submissions and data mutations use Server Actions:

```typescript
// actions/battles.ts
"use server";
import { db } from "@/lib/db";
import { battles } from "@/lib/db/schema";
import { battleCreateSchema } from "@/lib/validations/battle";
import { getCurrentUser } from "@/lib/auth";

export async function createBattle(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role === "member") throw new Error("Unauthorized");

  const data = battleCreateSchema.parse(Object.fromEntries(formData));
  const [battle] = await db.insert(battles).values({ ...data, guildId: user.guildId }).returning();
  revalidatePath("/guild-war");
  return battle;
}
```

### API Route Handlers — Only When Needed

Use Route Handlers (`app/api/`) only for:
- Public REST endpoints consumed by external clients
- Webhook receivers
- File upload processing
- Anything that can't be a Server Action

For internal data fetching: use Server Components.
For internal mutations: use Server Actions.

### Validation — Zod (shared)

Define schemas once, use everywhere:

```typescript
// lib/validations/battle.ts
import { z } from "zod";

export const teamCompositionSchema = z.object({
  heroes: z.array(z.object({ heroId: z.string().uuid(), position: z.enum(["front", "back"]) })).max(5),
  formation: z.enum(["4-1", "3-2", "1-4", "2-3"]).nullable(),
  skillSequence: z.array(z.object({ heroId: z.string(), skillId: z.string(), order: z.number().min(1).max(3) })).length(3),
  speed: z.number().int(),
});

export const battleCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  memberId: z.string().uuid(),
  result: z.enum(["win", "loss"]),
  enemyGuildName: z.string().default(""),
  alliedTeam: teamCompositionSchema,
  enemyTeam: teamCompositionSchema,
  firstTurn: z.boolean().nullable(),
});
```

### Database Queries — Drizzle ORM

Drizzle provides type-safe SQL with full TypeScript inference:

```typescript
// lib/db/queries/analytics.ts
import { db } from "@/lib/db";
import { battleHeroPairs } from "@/lib/db/schema";
import { sql, eq, gte, and, count } from "drizzle-orm";

export async function getHeroMatchups(guildId: string, days: number, minBattles: number) {
  return db
    .select({
      alliedHeroId: battleHeroPairs.alliedHeroId,
      enemyHeroId: battleHeroPairs.enemyHeroId,
      wins: count(sql`CASE WHEN ${battleHeroPairs.result} = 'win' THEN 1 END`),
      total: count(),
    })
    .from(battleHeroPairs)
    .where(and(
      eq(battleHeroPairs.guildId, guildId),
      gte(battleHeroPairs.date, sql`NOW() - INTERVAL '${days} days'`)
    ))
    .groupBy(battleHeroPairs.alliedHeroId, battleHeroPairs.enemyHeroId)
    .having(gte(count(), minBattles));
}
```

### Auth — Supabase with Middleware

```typescript
// lib/auth.ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "admin" | "officer" | "member";

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  guildId: string | null;
  accessStatus: string | null;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const meta = user.app_metadata;
  return {
    id: user.id,
    email: user.email ?? "",
    role: meta.role ?? "member",
    guildId: meta.guildId ?? null,
    accessStatus: meta.accessStatus ?? null,
  };
}

export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireOfficer(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "officer") redirect("/dashboard");
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
```

## Database Conventions

- All tables use `uuid` primary keys (`uuid_generate_v4`)
- Timestamps: `created_at` and `updated_at` (TIMESTAMPTZ, auto-updated via trigger)
- Drizzle schema is the source of truth — migrations generated via `drizzle-kit generate`
- JSONB for flexible nested data (team compositions, skill sequences, scores)
- TEXT arrays with GIN indexes for hero search
- pg_trgm extension for Thai fuzzy text search on hero names
- CHECK constraints for enums
- Foreign keys with `onDelete: "cascade"` where appropriate

## Project Structure

```
seven-knights-platform/
├── CLAUDE.md
├── INTEGRATION_PLAN.md
├── next.config.ts
├── package.json
├── tsconfig.json
├── drizzle.config.ts                    # Drizzle migration config
├── middleware.ts                         # Supabase auth session refresh
├── app/
│   ├── layout.tsx                       # Root layout + AuthProvider
│   ├── globals.css
│   ├── (public)/                        # No auth required
│   │   ├── gvg-guides/
│   │   │   ├── page.tsx                 # Hero search + guide cards
│   │   │   └── [id]/page.tsx            # Guide detail
│   │   ├── guidelines/page.tsx          # Public attack guidelines
│   │   └── submit/
│   │       └── advent-expedition/page.tsx
│   ├── (auth)/                          # Auth required
│   │   ├── layout.tsx                   # Auth guard + sidebar layout
│   │   ├── dashboard/page.tsx
│   │   ├── guild-war/
│   │   │   ├── page.tsx
│   │   │   ├── submit/page.tsx
│   │   │   ├── detail/page.tsx
│   │   │   ├── guidelines/page.tsx
│   │   │   └── analytics/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       ├── matchups/page.tsx
│   │   │       ├── formations/page.tsx
│   │   │       ├── skills/page.tsx
│   │   │       ├── speed/page.tsx
│   │   │       ├── counter/page.tsx
│   │   │       ├── members/page.tsx
│   │   │       └── enemy-guilds/page.tsx
│   │   ├── advent-expedition/
│   │   │   ├── page.tsx
│   │   │   ├── cycles/page.tsx
│   │   │   └── plan/page.tsx
│   │   ├── castle-rush/
│   │   │   ├── page.tsx
│   │   │   ├── submit/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   └── rankings/page.tsx
│   │   ├── roster/page.tsx
│   │   ├── access-requests/page.tsx
│   │   └── admin/
│   │       ├── heroes/page.tsx
│   │       ├── guilds/page.tsx
│   │       └── gvg-guides/
│   │           ├── page.tsx
│   │           ├── new/page.tsx
│   │           └── [id]/edit/page.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── api/                             # Route Handlers (only when needed)
│       ├── upload/route.ts              # File upload
│       └── ai/
│           ├── extract-screenshot/route.ts
│           └── advent-optimize/route.ts
├── actions/                             # Server Actions (mutations)
│   ├── auth.ts
│   ├── battles.ts
│   ├── heroes.ts
│   ├── members.ts
│   ├── guilds.ts
│   ├── gvg-guides.ts
│   ├── guidelines.ts
│   ├── advent.ts
│   └── castle-rush.ts
├── components/
│   ├── ui/                              # Design system (Radix + Tailwind)
│   ├── layout/                          # App header, sidebar
│   ├── auth/                            # Protected route, pending access
│   ├── analytics/                       # Charts (Recharts)
│   ├── battle/                          # Team display, similar battles
│   ├── guild-war/                       # Formation, hero selector, skill sequence
│   └── gvg-guide/                       # Hero search, guide cards, skill chain
├── lib/
│   ├── db/
│   │   ├── index.ts                     # Drizzle client
│   │   ├── schema.ts                    # All table definitions
│   │   └── queries/                     # Query modules
│   │       ├── heroes.ts
│   │       ├── battles.ts
│   │       ├── analytics.ts
│   │       ├── gvg-guides.ts
│   │       ├── members.ts
│   │       └── ...
│   ├── supabase/
│   │   ├── client.ts                    # Browser client (publishable key)
│   │   ├── server.ts                    # Server client (publishable key)
│   │   └── admin.ts                     # Admin client (service role key)
│   ├── ai/
│   │   ├── vertex-client.ts             # Vertex AI singleton
│   │   ├── screenshot-extractor.ts
│   │   └── advent-optimizer.ts
│   ├── auth.ts                          # getCurrentUser, requireOfficer, etc.
│   └── validations/                     # Zod schemas
│       ├── battle.ts
│       ├── hero.ts
│       ├── guide.ts
│       └── ...
├── types/
│   └── index.ts                         # Shared TypeScript types
├── drizzle/                             # Generated migrations
│   └── 0000_initial.sql
├── __tests__/                           # Unit + integration tests
├── e2e/                                 # Playwright E2E tests
└── .env.local.example
```

## Build Phases

Build in this order. Each phase should be fully working before moving to the next.

### Phase 1: Foundation
- [ ] Next.js 16 app with Tailwind 4, React Compiler, Radix UI
- [ ] Drizzle ORM setup with full schema (all tables)
- [ ] drizzle-kit migration generated and applied to Supabase
- [ ] Supabase client helpers (browser, server, admin)
- [ ] Auth: middleware for session refresh, getCurrentUser helpers
- [ ] Auth context for client components
- [ ] Login + Register pages
- [ ] Protected layout for (auth) routes

### Phase 2: Core Entities
- [ ] Heroes: schema, queries, server actions, admin page (Thai search)
- [ ] Guilds: queries, actions, admin page
- [ ] Members: queries, actions, roster page
- [ ] Users + Officers: schema, admin management
- [ ] Member Access: request/approve/reject flow

### Phase 3: Guild War
- [ ] Battles: schema, queries, server actions (validation, hero pair extraction)
- [ ] Battle list page (Server Component with filters)
- [ ] Battle submission page (formation selector, hero selector, skill sequence)
- [ ] Battle detail page

### Phase 4: Analytics
- [ ] Analytics queries in lib/db/queries/analytics.ts (all SQL)
- [ ] Dashboard page with KPIs
- [ ] Analytics sub-pages (matchups, formations, skills, speed, counter, members, enemy guilds)
- [ ] Recharts integration for all visualizations

### Phase 5: GVG Guides
- [ ] GVG Guide: schema, queries, server actions
- [ ] Public guide search page (hero autocomplete, guide cards)
- [ ] Public guide detail page (skill chain)
- [ ] Admin guide CRUD pages
- [ ] Auto-versioning via DB trigger

### Phase 6: Advent + Castle Rush
- [ ] Vertex AI client setup (@google-cloud/vertexai)
- [ ] Advent optimizer (port algorithm from Python to TypeScript)
- [ ] Advent pages (cycles, plan, public submission)
- [ ] Castle Rush (scores, AI extraction, history, rankings)

### Phase 7: Attack Guidelines
- [ ] Attack Guidelines: queries, actions, pages
- [ ] Public guidelines view
- [ ] Admin CRUD

### Phase 8: Polish
- [ ] Error handling + loading states (Suspense boundaries)
- [ ] Mobile responsiveness
- [ ] Thai language throughout UI
- [ ] E2E tests (Playwright)
- [ ] Unit tests (Vitest)
- [ ] Vercel deployment config

## Reference Repos

The old repos contain business logic to port (not copy verbatim — adapt to Next.js patterns):

- `../seven-knights-guild-tracker/` — FastAPI + Firestore guild tracker
  - `backend/app/api/routes/analytics.py` — analytics logic (rewrite as SQL in lib/db/queries/analytics.ts)
  - `backend/app/models/schemas.py` — data models (rewrite as Zod + Drizzle schema)
  - `backend/app/services/ai/` — Vertex AI (port to TypeScript using @google-cloud/vertexai)
  - `backend/app/services/advent_optimizer.py` — optimization algorithm (port to TypeScript)
  - `frontend/components/` — React components (port, remove manual memoization)
  - `frontend/app/` — page structure to replicate
  - `frontend/types/index.ts` — TypeScript types to merge

- `../gvg-7k-search/` — Next.js + Supabase GVG guide search
  - `gvg-7k-search/app/page.tsx` — hero search + guide card components
  - `gvg-7k-search/app/guide/[id]/` — guide detail view
  - `gvg-7k-search/app/admin/` — guide admin pages
  - `gvg-7k-search/supabase/schema.sql` — guide schema (merged into unified Drizzle schema)

## Commands

```bash
npm run dev                              # Dev server on :3000
npm run build                            # Production build
npm run test                             # Unit tests (vitest)
npm run test:e2e                         # E2E tests (playwright)
npx drizzle-kit generate                 # Generate migration from schema changes
npx drizzle-kit push                     # Push schema directly (dev)
npx drizzle-kit migrate                  # Run pending migrations
npx drizzle-kit studio                   # Visual schema browser
```

## Environment Variables

```bash
# Supabase (auto-provisioned by Vercel Supabase Integration)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (Supabase connection pooler — use Transaction mode)
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# GCP (Vertex AI only)
GCP_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

## Style Notes

- Thai language for all user-facing text in the frontend
- Dark theme with gaming aesthetic (reds, golds, tactical feel)
- Mobile-first responsive design
- The GVG guide search page has a distinctive visual style from the old repo — preserve that aesthetic
- **Do NOT use `useMemo`, `useCallback`, or `React.memo`** — React Compiler handles memoization automatically. The old repos are full of manual memoization — do not carry that pattern over.
- **Prefer Server Components over client components** — only add "use client" when you need interactivity (forms, event handlers, hooks)
- **Prefer Server Actions over API routes** — only use Route Handlers for file uploads, webhooks, or external API endpoints
