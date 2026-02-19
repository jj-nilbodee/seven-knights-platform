# How to Execute: Building with Claude Code

## Setup (~15 minutes)

### 1. Create the new repo

```bash
mkdir seven-knights-platform
cd seven-knights-platform
git init
```

### 2. Clone the old repos next to it (as reference)

```bash
# Your workspace should look like:
# workspace/
# ├── seven-knights-platform/       ← NEW (build here)
# ├── seven-knights-guild-tracker/   ← OLD (reference)
# └── gvg-7k-search/                ← OLD (reference)

cd ..
git clone --branch mvp-enhancements https://github.com/jj-nilbodee/seven-knights-guild-tracker.git
git clone --branch initial-dev https://github.com/jj-nilbodee/gvg-7k-search.git
```

### 3. Create Supabase project

**Option A (recommended): Vercel Supabase Integration**
Install the Supabase integration in your Vercel project — it auto-provisions:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the new `sb_publishable_` format)
- `SUPABASE_SERVICE_ROLE_KEY`

Run `vercel env pull` to get them locally.

**Option B: Manual**
Go to https://supabase.com → New Project → pick Singapore region.
Get from Dashboard → Settings → API:
- Project URL
- Publishable key (`sb_publishable_...`)
- Service role key (secret)

Get from Settings → Database → Connection string:
- URI (Transaction pooler mode)

### 4. Create Next.js app

```bash
cd seven-knights-platform
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src=false \
  --import-alias "@/*"
```

### 5. Install dependencies

```bash
# Supabase
npm install @supabase/ssr @supabase/supabase-js

# Database
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Validation
npm install zod

# AI
npm install @google-cloud/vertexai

# UI
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-label \
  @radix-ui/react-checkbox @radix-ui/react-progress @radix-ui/react-dropdown-menu \
  @radix-ui/react-slot
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install recharts date-fns sonner

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

### 6. Drop in the docs + commit

```bash
# Copy CLAUDE.md and INTEGRATION_PLAN.md into the repo root
# Create .env.local from the template in INTEGRATION_PLAN.md

# Enable React Compiler in next.config.ts:
# const nextConfig = { reactCompiler: true };

git add -A
git commit -m "initial scaffold with CLAUDE.md"
```

---

## Building with Claude Code — Phase by Phase

```bash
cd seven-knights-platform
claude
```

### Phase 1: Foundation

**Prompt 1 — Database + Auth:**
```
Build Phase 1 as described in CLAUDE.md.

1. Drizzle ORM setup:
   - lib/db/schema.ts with ALL tables from INTEGRATION_PLAN.md
   - lib/db/index.ts with postgres client + drizzle instance
   - drizzle.config.ts

2. Generate and apply the initial migration:
   - Run drizzle-kit generate
   - Note: GIN indexes, triggers, and extensions need a custom SQL migration
     (see section 4.3 of INTEGRATION_PLAN.md). Create drizzle/0001_custom.sql
     with all the trigger functions and extension setup.

3. Supabase clients:
   - lib/supabase/client.ts (browser, uses NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
   - lib/supabase/server.ts (server components, uses NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
   - lib/supabase/admin.ts (service role, for user management)

4. Auth:
   - middleware.ts (session refresh + route protection)
   - lib/auth.ts (getCurrentUser, requireUser, requireOfficer, requireAdmin)
   - lib/supabase/client.ts and server.ts

5. Auth UI:
   - app/login/page.tsx
   - app/register/page.tsx
   - Auth context for client components (lib/auth-context.tsx)

6. Protected layout:
   - app/(auth)/layout.tsx that checks auth and renders sidebar

Reference INTEGRATION_PLAN.md for all code patterns.
```

**Prompt 2 — Apply the schema:**
After Claude Code generates the schema, apply it:
```bash
npx drizzle-kit push    # Push Drizzle schema to Supabase

# Then run the custom SQL in Supabase SQL Editor:
# Copy contents of drizzle/0001_custom.sql
# (extensions, GIN indexes, triggers)
```

### Phase 2: Core Entities

**Prompt 3 — Heroes:**
```
Build the Heroes module.

1. Zod validation: lib/validations/hero.ts
   - heroCreateSchema, heroUpdateSchema
   - Include all fields: name, heroType, rarity, skills, classification

2. Query functions: lib/db/queries/heroes.ts
   - listHeroes(filters) — use pg_trgm for Thai search via sql`name % ${search}`
   - getHeroById(id)
   - createHero(data), updateHero(id, data), deleteHero(id)

3. Server Actions: actions/heroes.ts
   - createHero, updateHero, deleteHero (all require admin)

4. Pages:
   - Public hero list is used by other pages (shared query)
   - app/(auth)/admin/heroes/page.tsx — admin hero management

Port the hero management UI from ../seven-knights-guild-tracker/frontend/app/(auth)/admin/heroes/page.tsx
Adapt to use Server Components + Server Actions instead of API calls.
```

**Prompt 4 — Guilds, Members, Users, Access:**
```
Build guild management modules.

1. Zod validations for each entity
2. Query functions in lib/db/queries/ for each
3. Server Actions in actions/ for each
4. Pages:
   - app/(auth)/admin/guilds/page.tsx
   - app/(auth)/roster/page.tsx
   - app/(auth)/access-requests/page.tsx
   - app/(auth)/layout.tsx — add sidebar navigation

Port UI from ../seven-knights-guild-tracker/frontend/
Use Server Components for data display, Server Actions for mutations.
```

### Phase 3: Guild War

**Prompt 5:**
```
Build the Guild War battle tracking module.

1. Zod validations: lib/validations/battle.ts
   - teamCompositionSchema, battleCreateSchema, battleUpdateSchema
   - Validate date is SAT/MON/WED

2. Queries: lib/db/queries/battles.ts
   - listBattles(guildId, filters), getBattleById, createBattle, updateBattle, deleteBattle

3. Server Actions: actions/battles.ts
   - createBattle (officer+), updateBattle, deleteBattle

4. Note: battle_hero_pairs are auto-populated by the DB trigger we
   created in Phase 1. No application code needed for this.

5. Pages:
   - app/(auth)/guild-war/page.tsx — Server Component, lists battles
   - app/(auth)/guild-war/submit/page.tsx — Client Component with form
   - app/(auth)/guild-war/detail/page.tsx

Port the battle form components from ../seven-knights-guild-tracker/frontend/components/guild-war/
(formation-selector, hero-selector, skill-sequence-selector, team-composition)
Remove any useMemo/useCallback — React Compiler handles this.
```

### Phase 4: Analytics

**Prompt 6:**
```
Build the analytics module. This is where Next.js shines — Server Components
fetching directly from the DB, no API layer needed.

1. Query functions: lib/db/queries/analytics.ts
   ALL analytics as Drizzle/SQL queries:
   - getDashboardKPIs(guildId, days)
   - getHeroMatchups(guildId, days, minBattles)
   - getSkillOrderImpact(guildId, days)
   - getFormationStats(guildId, days)
   - getSpeedAnalysis(guildId, days)
   - getEnemyCompositions(guildId, days)
   - getCounterRecommendations(guildId, enemyHeroIds, enemyFormation)
   - getEnemyGuilds(guildId, days)
   - getMemberPerformance(guildId, days)
   - getWinRateTrend(guildId, days)
   - getHeroUsage(guildId, days)

   Use the battle_hero_pairs table for matchup queries (simple GROUP BY).
   Reference ../seven-knights-guild-tracker/backend/app/api/routes/analytics.py
   for the BUSINESS LOGIC of each endpoint, but write it all as SQL.

2. Pages (all Server Components):
   - app/(auth)/dashboard/page.tsx — KPIs + top combos + recent battles
   - app/(auth)/guild-war/analytics/layout.tsx — tab navigation
   - app/(auth)/guild-war/analytics/page.tsx — overview
   - app/(auth)/guild-war/analytics/matchups/page.tsx
   - app/(auth)/guild-war/analytics/formations/page.tsx
   - app/(auth)/guild-war/analytics/skills/page.tsx
   - app/(auth)/guild-war/analytics/speed/page.tsx
   - app/(auth)/guild-war/analytics/counter/page.tsx
   - app/(auth)/guild-war/analytics/members/page.tsx
   - app/(auth)/guild-war/analytics/enemy-guilds/page.tsx

3. Chart components (Client Components with "use client"):
   Port from ../seven-knights-guild-tracker/frontend/components/analytics/
   Remove manual memoization.
```

### Phase 5: GVG Guides

**Prompt 7:**
```
Build the GVG Guide module — ported from ../gvg-7k-search/

1. Zod validations: lib/validations/guide.ts
2. Queries: lib/db/queries/gvg-guides.ts
   - searchGuides(defenseHeroes, status) — use PostgreSQL array containment:
     sql`defense_heroes @> ARRAY[${heroes}]`
   - getGuideById, createGuide, updateGuide, deleteGuide
   - getGuideVersions(guideId)
   - Note: version auto-snapshot is handled by DB trigger

3. Server Actions: actions/gvg-guides.ts

4. Public pages (Server Components, no auth):
   - app/(public)/gvg-guides/page.tsx — hero search + guide cards
   - app/(public)/gvg-guides/[id]/page.tsx — guide detail

5. Admin pages:
   - app/(auth)/admin/gvg-guides/page.tsx — list
   - app/(auth)/admin/gvg-guides/new/page.tsx — create
   - app/(auth)/admin/gvg-guides/[id]/edit/page.tsx — edit

6. Components:
   - components/gvg-guide/hero-search.tsx — Thai autocomplete
   - components/gvg-guide/guide-card.tsx — result card with skill chain
   - components/gvg-guide/guide-detail.tsx — full guide view
   - components/gvg-guide/skill-chain.tsx — skill order visualization

Port from ../gvg-7k-search/gvg-7k-search/app/
PRESERVE the visual style — dark gaming theme, hero portraits, skill chain arrows.
```

### Phase 6-8: Remaining Modules

Same pattern — one prompt per module:

**Advent Expedition:**
```
Build Advent Expedition.
1. Port the optimizer algorithm from ../seven-knights-guild-tracker/backend/app/services/advent_optimizer.py
   to lib/ai/advent-optimizer.ts (TypeScript)
2. Port the Vertex AI screenshot extractor to lib/ai/screenshot-extractor.ts
   using @google-cloud/vertexai JS SDK
3. Route handler for AI: app/api/ai/extract-screenshot/route.ts
4. Pages: advent main, cycles, plan, public submission

Reference ../seven-knights-guild-tracker/backend/app/api/routes/advent.py for business logic.
Reference ../seven-knights-guild-tracker/frontend/app/(auth)/advent-expedition/ for UI.
```

---

## Tips for Working with Claude Code

### 1. Keep it focused
One module per prompt. Don't ask for "build everything."

### 2. Let it read the old repos
Claude Code can read files in `../seven-knights-guild-tracker/` and `../gvg-7k-search/`. Point it at specific files.

### 3. Test as you go
```
Run the dev server and check if the heroes page works. Fix any errors.
```
```
The guide search returns no results. Debug the array containment query.
```

### 4. Git branches
```bash
git checkout -b phase-1-foundation
# ... let Claude Code build ...
git add -A && git commit -m "phase 1: foundation"
git checkout main && git merge phase-1-foundation
```

### 5. Apply schema to Supabase
After Phase 1:
```bash
# Push Drizzle schema
npx drizzle-kit push

# Then paste drizzle/0001_custom.sql into Supabase SQL Editor
# (extensions, GIN indexes, triggers)
```

### 6. Create first admin user
After auth is working:
1. Register via the app
2. Go to Supabase Dashboard → Authentication → Users
3. Click the user → Edit → Raw app_metadata:
```json
{ "role": "admin" }
```

Or ask Claude Code:
```
Write a script that uses the Supabase admin client to set a user as admin.
```

---

## Checkpoint Checklist

### Phase 1 ✓
- [ ] `npm run dev` starts without errors
- [ ] Drizzle schema pushed to Supabase (tables visible in dashboard)
- [ ] Custom SQL applied (triggers, GIN indexes)
- [ ] Can register a user
- [ ] Can login, session persists on refresh
- [ ] Protected routes redirect to login when unauthenticated
- [ ] Admin user created with app_metadata

### Phase 2 ✓
- [ ] Can create/list heroes via admin page
- [ ] Thai hero name search works (partial match)
- [ ] Can create a guild
- [ ] Can add members to roster
- [ ] Member access request/approve flow works

### Phase 3 ✓
- [ ] Can submit a battle with full team composition
- [ ] Validation works (correct days, hero limits, skill sequence length)
- [ ] battle_hero_pairs populated automatically (check in Supabase)
- [ ] Battle list page shows data
- [ ] Battle detail page works

### Phase 4 ✓
- [ ] Dashboard shows KPIs
- [ ] Hero matchup heatmap renders with data
- [ ] Formation matrix works
- [ ] Counter recommendation returns results
- [ ] All 7 analytics sub-pages render

### Phase 5 ✓
- [ ] Public guide search works WITHOUT login
- [ ] Defense hero autocomplete works in Thai
- [ ] Array containment returns correct guides
- [ ] Guide cards show skill chain visualization
- [ ] Admin can create/edit/archive guides
- [ ] Version history shows previous versions (auto-snapshot)

### Phase 6-8 ✓
- [ ] Advent expedition cycle flow works
- [ ] Vertex AI screenshot extraction works
- [ ] Castle Rush score submission works
- [ ] Attack guidelines CRUD works
- [ ] All pages mobile-responsive
- [ ] Thai language throughout
