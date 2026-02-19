# Integration Plan: Seven Knights Re:Birth — Unified Platform
## Full Next.js Architecture

---

## 1. Architecture Overview

```
┌───────────────────────────────────────────────────────────────┐
│                   Next.js 16 (Vercel)                          │
│           React 19 + React Compiler + Tailwind 4               │
│                                                               │
│  ┌─ Server Components ─────────────────────────────────────┐  │
│  │ Data fetching via Drizzle ORM (direct DB queries)        │  │
│  │ No API round-trips, no CORS, fully typed                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─ Server Actions ────────────────────────────────────────┐  │
│  │ Mutations: create/update/delete battles, guides, etc.    │  │
│  │ Zod validation, auth checks, revalidatePath              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─ Route Handlers (minimal) ──────────────────────────────┐  │
│  │ POST /api/upload          (file uploads)                 │  │
│  │ POST /api/ai/extract      (Vertex AI screenshot OCR)     │  │
│  │ POST /api/ai/optimize     (Advent AI optimization)       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─ Client Components ─────────────────────────────────────┐  │
│  │ Interactive UI: forms, charts, selectors, search         │  │
│  │ Call server actions directly, no API client needed        │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────┬────────────────────────────────────────┘
                       │ Direct connection (Drizzle + pg driver)
┌──────────────────────▼────────────────────────────────────────┐
│                    Supabase                                     │
│                                                               │
│  ┌─ Auth ──────────────────────────────────────────────────┐  │
│  │ Email/password authentication                            │  │
│  │ app_metadata: { role, guildId, accessStatus }            │  │
│  │ @supabase/ssr cookie-based sessions                      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─ PostgreSQL 15+ ────────────────────────────────────────┐  │
│  │ Drizzle ORM schema + drizzle-kit migrations              │  │
│  │ Extensions: pg_trgm, uuid-ossp                           │  │
│  │ GIN indexes: hero name trigram, defense_heroes array     │  │
│  │ Triggers: updated_at, guide versioning, battle hero pairs│  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─ Storage ───────────────────────────────────────────────┐  │
│  │ hero-images/    (public bucket)                          │  │
│  │ battle-media/   (private bucket, signed URLs)            │  │
│  │ guide-media/    (public bucket)                          │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘

External (AI only):
┌──────────────────────┐
│ GCP Vertex AI         │  ← Screenshot OCR + Advent optimization
│ @google-cloud/vertexai│     The ONLY external dependency
└──────────────────────┘
```

---

## 2. Why Full Next.js (No Python)

The previous plan had FastAPI + Next.js. Here's what changed:

| Concern | FastAPI approach | Next.js-only approach | Winner |
|---------|-----------------|----------------------|--------|
| Analytics queries | SQLAlchemy → SQL | Drizzle → SQL | **Same** (both just run SQL) |
| CRUD operations | FastAPI routes + Pydantic | Server Actions + Zod | **Same** complexity |
| Auth | Verify JWT in middleware | Supabase SSR cookies | **Next.js** (native, no CORS) |
| Type safety | Python types + TS types (2 systems) | TypeScript end-to-end | **Next.js** (one type system) |
| Data fetching | Frontend → API call → FastAPI → DB | Server Component → DB | **Next.js** (no round-trip) |
| Deployment | Vercel + Cloud Run (2 platforms) | Vercel only | **Next.js** (one platform) |
| AI services | Python Vertex AI SDK | JS Vertex AI SDK | **Same** |
| Maintenance | 2 languages, 2 test suites | 1 language, 1 test suite | **Next.js** |

Nothing in this project actually requires Python. The "complexity" was Firestore workarounds, not inherent business logic.

---

## 3. Auth System — Supabase Auth

### 3.1 Role Model

Three-tier roles in `app_metadata`:

```json
{ "role": "admin", "guildId": null }
{ "role": "officer", "guildId": "uuid-of-guild" }
{ "role": "member", "guildId": "uuid-of-guild", "accessStatus": "approved" }
{ "role": "member", "guildId": "uuid-of-guild", "accessStatus": "pending" }
```

### 3.2 Middleware — Session Refresh

```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  // Protect auth routes
  const isAuthRoute = request.nextUrl.pathname.startsWith("/(auth)") ||
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/guild-war") ||
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/roster") ||
    request.nextUrl.pathname.startsWith("/advent") ||
    request.nextUrl.pathname.startsWith("/castle-rush");

  if (isAuthRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

### 3.3 Supabase Clients

```typescript
// lib/supabase/client.ts (browser — client components)
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

// lib/supabase/server.ts (server components + server actions)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

// lib/supabase/admin.ts (service role — user management, storage admin)
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

### 3.4 Auth Helpers

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

### 3.5 Role Management — Admin Operations

```typescript
// actions/auth.ts
"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export async function approveAccess(userId: string, guildId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "member", guildId, accessStatus: "approved" },
  });
}

export async function promoteToOfficer(userId: string, guildId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "officer", guildId },
  });
}
```

---

## 4. Database — Drizzle Schema

```typescript
// lib/db/schema.ts
import {
  pgTable, uuid, text, boolean, integer, bigint, date, timestamp, jsonb,
  index, uniqueIndex, check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============================================
// Heroes
// ============================================
export const heroes = pgTable("heroes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  heroType: text("hero_type").notNull(),    // MAGIC, PHYSICAL, UNIVERSAL, TANK, SUPPORT
  rarity: text("rarity").notNull(),          // RARE, LEGEND
  imageUrl: text("image_url").default(""),
  isActive: boolean("is_active").default(true),

  // Skills (3 per hero)
  skill1Id: uuid("skill_1_id").defaultRandom(),
  skill1Name: text("skill_1_name").notNull().default("Skill 1"),
  skill1Type: text("skill_1_type").notNull().default("ACTIVE"),
  skill1ImageUrl: text("skill_1_image_url").default(""),

  skill2Id: uuid("skill_2_id").defaultRandom(),
  skill2Name: text("skill_2_name").notNull().default("Skill 2"),
  skill2Type: text("skill_2_type").notNull().default("ACTIVE"),
  skill2ImageUrl: text("skill_2_image_url").default(""),

  skill3Id: uuid("skill_3_id").defaultRandom(),
  skill3Name: text("skill_3_name").notNull().default("Passive"),
  skill3Type: text("skill_3_type").notNull().default("PASSIVE"),
  skill3ImageUrl: text("skill_3_image_url").default(""),

  // Classification metadata
  archetype: text("archetype"),
  attackType: text("attack_type"),
  targetType: text("target_type"),
  ccAbilities: jsonb("cc_abilities").default({}),
  buffs: jsonb("buffs").default({}),
  debuffs: jsonb("debuffs").default({}),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_hero_active_name").on(table.isActive, table.name),
  // GIN index for Thai trigram search — create via raw SQL migration
]);

// ============================================
// Guilds
// ============================================
export const guilds = pgTable("guilds", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// Users (maps to Supabase Auth users)
// ============================================
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),               // Same as auth.users.id
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  displayName: text("display_name").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// Officers
// ============================================
export const officers = pgTable("officers", {
  userId: uuid("user_id").notNull().references(() => users.id),
  guildId: uuid("guild_id").notNull().references(() => guilds.id),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  // Composite primary key
  uniqueIndex("officers_pk").on(table.userId, table.guildId),
]);

// ============================================
// Member Access
// ============================================
export const memberAccess = pgTable("member_access", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  guildId: uuid("guild_id").notNull().references(() => guilds.id),
  status: text("status").default("pending"),  // pending, approved, rejected
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
}, (table) => [
  uniqueIndex("member_access_unique").on(table.userId, table.guildId),
  index("idx_access_guild_status").on(table.guildId, table.status),
]);

// ============================================
// Members (guild roster)
// ============================================
export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  guildId: uuid("guild_id").notNull().references(() => guilds.id),
  ign: text("ign").notNull(),
  nickname: text("nickname").notNull(),
  isActive: boolean("is_active").default(true),
  status: text("status").default("active"),   // active, warning, inactive
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  lastBattleAt: timestamp("last_battle_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("member_guild_ign").on(table.guildId, table.ign),
  index("idx_member_guild").on(table.guildId, table.isActive, table.status),
]);

// ============================================
// Battles
// ============================================
export const battles = pgTable("battles", {
  id: uuid("id").primaryKey().defaultRandom(),
  guildId: uuid("guild_id").notNull().references(() => guilds.id),
  memberId: uuid("member_id").notNull().references(() => members.id),
  date: date("date").notNull(),
  weekday: text("weekday").notNull(),          // SAT, MON, WED
  battleNumber: integer("battle_number").notNull(),
  battleType: text("battle_type").default("attack"),
  result: text("result").notNull(),            // win, loss
  enemyGuildName: text("enemy_guild_name").default(""),
  enemyPlayerName: text("enemy_player_name"),

  alliedTeam: jsonb("allied_team").notNull(),
  enemyTeam: jsonb("enemy_team").notNull(),

  firstTurn: boolean("first_turn"),
  videoUrl: text("video_url"),
  submittedByUserId: uuid("submitted_by_user_id").notNull().references(() => users.id),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("battle_unique").on(table.guildId, table.memberId, table.date, table.battleNumber),
  index("idx_battle_guild_date").on(table.guildId, table.date),
  index("idx_battle_guild_member").on(table.guildId, table.memberId),
]);

// ============================================
// Battle Hero Pairs (denormalized for analytics)
// Populated via DB trigger on battle insert/update
// ============================================
export const battleHeroPairs = pgTable("battle_hero_pairs", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  battleId: uuid("battle_id").notNull().references(() => battles.id, { onDelete: "cascade" }),
  guildId: uuid("guild_id").notNull(),
  date: date("date").notNull(),
  result: text("result").notNull(),
  alliedHeroId: text("allied_hero_id").notNull(),
  enemyHeroId: text("enemy_hero_id").notNull(),
  alliedFormation: text("allied_formation"),
  enemyFormation: text("enemy_formation"),
  alliedSpeed: integer("allied_speed"),
  enemySpeed: integer("enemy_speed"),
  firstTurn: boolean("first_turn"),
}, (table) => [
  index("idx_bhp_guild_date").on(table.guildId, table.date),
  index("idx_bhp_matchup").on(table.alliedHeroId, table.enemyHeroId),
]);

// ============================================
// GVG Attack Guides
// ============================================
export const gvgGuides = pgTable("gvg_guides", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  defenseHeroes: text("defense_heroes").array().notNull(),
  attackHeroes: text("attack_heroes").array().notNull(),
  attackPriority: integer("attack_priority").notNull().default(1),
  attackSkillOrder: jsonb("attack_skill_order").notNull(),
  defenseSkillOrder: jsonb("defense_skill_order"),
  strategyNotes: text("strategy_notes").default(""),
  mediaUrls: text("media_urls").array().default(sql`ARRAY[]::TEXT[]`),
  patchVersion: text("patch_version").notNull(),
  version: integer("version").default(1),
  status: text("status").default("draft"),     // draft, published, archived
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_guide_status").on(table.status),
]);

// ============================================
// GVG Guide Versions (auto-snapshot via DB trigger)
// ============================================
export const gvgGuideVersions = pgTable("gvg_guide_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  guideId: uuid("guide_id").notNull().references(() => gvgGuides.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  title: text("title").notNull(),
  defenseHeroes: text("defense_heroes").array().notNull(),
  attackHeroes: text("attack_heroes").array().notNull(),
  attackPriority: integer("attack_priority").notNull(),
  attackSkillOrder: jsonb("attack_skill_order").notNull(),
  defenseSkillOrder: jsonb("defense_skill_order"),
  strategyNotes: text("strategy_notes").default(""),
  mediaUrls: text("media_urls").array().default(sql`ARRAY[]::TEXT[]`),
  patchVersion: text("patch_version").notNull(),
  status: text("status").notNull(),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_guide_ver").on(table.guideId, table.version),
]);

// ============================================
// Attack Guidelines (defense team → counter strategies)
// ============================================
export const attackGuidelines = pgTable("attack_guidelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  defenseTeam: jsonb("defense_team").notNull(),
  counterStrategies: jsonb("counter_strategies").notNull(),
  isActive: boolean("is_active").default(true),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// Advent Expedition
// ============================================
export const adventCycles = pgTable("advent_cycles", {
  id: uuid("id").primaryKey().defaultRandom(),
  guildId: uuid("guild_id").notNull().references(() => guilds.id),
  status: text("status").default("collecting"),
  bossHp: jsonb("boss_hp").default({ teo: 100000000, yeonhee: 100000000, kyle: 100000000, karma: 100000000 }),
  plan: jsonb("plan"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_advent_guild").on(table.guildId, table.createdAt),
]);

export const adventProfiles = pgTable("advent_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  guildId: uuid("guild_id").notNull().references(() => guilds.id),
  memberIgn: text("member_ign").notNull(),
  scores: jsonb("scores").notNull().default({}),
  cycleId: uuid("cycle_id").references(() => adventCycles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("advent_profile_unique").on(table.guildId, table.memberIgn, table.cycleId),
]);

// ============================================
// Castle Rush
// ============================================
export const castleRushScores = pgTable("castle_rush_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  guildId: uuid("guild_id").notNull().references(() => guilds.id),
  memberId: uuid("member_id").references(() => members.id),
  memberIgn: text("member_ign"),
  boss: text("boss").notNull(),
  score: bigint("score", { mode: "number" }).notNull(),
  date: date("date").notNull(),
  extractionMethod: text("extraction_method").default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_cr_guild_date").on(table.guildId, table.date),
  index("idx_cr_boss").on(table.guildId, table.boss, table.date),
]);
```

### 4.1 Drizzle Client

```typescript
// lib/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Use connection pooling for serverless (Vercel)
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
```

### 4.2 Drizzle Config

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 4.3 Custom SQL Migration (pg_trgm, triggers)

Drizzle handles table creation, but some features need raw SQL. Create a custom migration:

```sql
-- drizzle/0001_custom.sql (run manually via Supabase SQL Editor)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- GIN index for Thai hero name search
CREATE INDEX IF NOT EXISTS idx_hero_name_trgm ON heroes USING GIN (name gin_trgm_ops);

-- GIN index for guide defense hero array search
CREATE INDEX IF NOT EXISTS idx_guide_defense_heroes ON gvg_guides USING GIN (defense_heroes);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_heroes BEFORE UPDATE ON heroes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_battles BEFORE UPDATE ON battles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_guides BEFORE UPDATE ON gvg_guides FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_guilds BEFORE UPDATE ON guilds FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_guidelines BEFORE UPDATE ON attack_guidelines FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_advent BEFORE UPDATE ON advent_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_advent_profiles BEFORE UPDATE ON advent_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-populate battle_hero_pairs on battle insert/update
CREATE OR REPLACE FUNCTION populate_battle_hero_pairs()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM battle_hero_pairs WHERE battle_id = NEW.id;
    END IF;

    INSERT INTO battle_hero_pairs (
        battle_id, guild_id, date, result,
        allied_hero_id, enemy_hero_id,
        allied_formation, enemy_formation,
        allied_speed, enemy_speed, first_turn
    )
    SELECT
        NEW.id, NEW.guild_id, NEW.date, NEW.result,
        a->>'heroId', e->>'heroId',
        NEW.allied_team->>'formation', NEW.enemy_team->>'formation',
        (NEW.allied_team->>'speed')::int, (NEW.enemy_team->>'speed')::int,
        NEW.first_turn
    FROM jsonb_array_elements(NEW.allied_team->'heroes') AS a,
         jsonb_array_elements(NEW.enemy_team->'heroes') AS e;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_battle_hero_pairs
    AFTER INSERT OR UPDATE ON battles
    FOR EACH ROW EXECUTE FUNCTION populate_battle_hero_pairs();

-- Auto-snapshot guide version before update
CREATE OR REPLACE FUNCTION snapshot_guide_version()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO gvg_guide_versions (
        guide_id, version, title, defense_heroes, attack_heroes,
        attack_priority, attack_skill_order, defense_skill_order,
        strategy_notes, media_urls, patch_version, status, created_by
    ) VALUES (
        OLD.id, OLD.version, OLD.title, OLD.defense_heroes, OLD.attack_heroes,
        OLD.attack_priority, OLD.attack_skill_order, OLD.defense_skill_order,
        OLD.strategy_notes, OLD.media_urls, OLD.patch_version, OLD.status, OLD.created_by
    );
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guide_version
    BEFORE UPDATE ON gvg_guides
    FOR EACH ROW EXECUTE FUNCTION snapshot_guide_version();
```

---

## 5. AI Services — Vertex AI in TypeScript

```typescript
// lib/ai/vertex-client.ts
import { VertexAI } from "@google-cloud/vertexai";

let vertexClient: VertexAI | null = null;

function getVertex() {
  if (!vertexClient) {
    vertexClient = new VertexAI({
      project: process.env.GCP_PROJECT_ID!,
      location: process.env.VERTEX_AI_LOCATION ?? "us-central1",
    });
  }
  return vertexClient;
}

export function getGenerativeModel(modelName = "gemini-2.0-flash") {
  return getVertex().getGenerativeModel({ model: modelName });
}

// lib/ai/screenshot-extractor.ts
import { getGenerativeModel } from "./vertex-client";

export async function extractCastleRushScore(imageBuffer: Buffer) {
  const model = getGenerativeModel();
  const response = await model.generateContent([
    { inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/png" } },
    { text: `Extract Castle Rush scores from this screenshot.
Return JSON: { "boss": "...", "scores": [{ "memberIgn": "...", "score": number }] }
Only return valid JSON, no markdown.` },
  ]);
  const text = response.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// lib/ai/advent-optimizer.ts
// Port the greedy assignment algorithm from Python to TypeScript
// Reference: ../seven-knights-guild-tracker/backend/app/services/advent_optimizer.py

const BOSS_MAX_HP = 100_000_000;
const BOSSES = ["teo", "yeonhee", "kyle", "karma"] as const;

interface MemberDamage {
  memberId: string;
  memberIgn: string;
  scores: Record<string, number>;
}

interface DayAssignment {
  day: number;
  assignments: Record<string, string[]>;  // boss → memberIds
  damageDealt: Record<string, number>;
  bossesKilled: string[];
}

export function optimizeAdventAssignments(
  memberDamages: MemberDamage[],
  currentHp: Record<string, number>,
  maxDays: number = 14,
): DayAssignment[] {
  // Port the greedy algorithm from the Python version
  // ... (Claude Code will implement this referencing the old repo)
  return [];
}
```

---

## 6. Environment Variables

```bash
# .env.local

# Supabase (auto-provisioned by Vercel Supabase Integration)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (Supabase connection pooler — Transaction mode)
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# GCP (Vertex AI only)
GCP_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

---

## 7. Dependencies

```json
{
  "dependencies": {
    "next": "^16.1.6",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "tailwindcss": "^4",

    "@supabase/ssr": "^0.8.0",
    "@supabase/supabase-js": "^2.95.0",

    "drizzle-orm": "^0.44.0",
    "postgres": "^3.4.0",

    "zod": "^3.24.0",

    "@google-cloud/vertexai": "^1.9.0",

    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-slot": "^1.2.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0",
    "lucide-react": "^0.553.0",
    "recharts": "^3.6.0",
    "date-fns": "^4.1.0",
    "sonner": "^2.0.7"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.0",
    "typescript": "^5.9.3",
    "vitest": "^4.0.15",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@playwright/test": "^1.48.0",
    "jsdom": "^25.0.0"
  }
}
```

---

## 8. Summary

```
FINAL STACK
├── Next.js 16 + React 19 + React Compiler  → Vercel
├── Drizzle ORM + drizzle-kit                → Type-safe DB access + migrations
├── Supabase PostgreSQL                      → Database
├── Supabase Auth                            → Authentication
├── Supabase Storage                         → File storage
├── Zod                                      → Validation (shared)
├── @google-cloud/vertexai                   → AI (screenshot OCR, optimization)
└── Vitest + Playwright                      → Testing

ONE LANGUAGE. ONE DEPLOYMENT. TWO PLATFORMS:
  1. Vercel    (Next.js)
  2. Supabase  (Auth + DB + Storage)
  + GCP Vertex AI (AI only, via service account key)
```
