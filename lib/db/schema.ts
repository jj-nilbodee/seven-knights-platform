import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  bigint,
  date,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============================================
// Heroes
// ============================================
export const heroes = pgTable(
  "heroes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    heroType: text("hero_type").notNull(), // MAGIC, PHYSICAL, UNIVERSAL, TANK, SUPPORT
    rarity: text("rarity").notNull(), // RARE, LEGEND
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
  },
  (table) => [
    index("idx_hero_active_name").on(table.isActive, table.name),
    // GIN index for Thai trigram search — created via custom SQL migration
  ],
);

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
  id: uuid("id").primaryKey(), // Same as auth.users.id
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  displayName: text("display_name").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// Member Access
// ============================================
export const memberAccess = pgTable(
  "member_access",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    guildId: uuid("guild_id")
      .notNull()
      .references(() => guilds.id),
    status: text("status").default("pending"), // pending, approved, rejected
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
  },
  (table) => [
    uniqueIndex("member_access_unique").on(table.userId, table.guildId),
    index("idx_access_guild_status").on(table.guildId, table.status),
  ],
);

// ============================================
// Members (guild roster)
// ============================================
export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guildId: uuid("guild_id")
      .notNull()
      .references(() => guilds.id),
    ign: text("ign").notNull(),
    nickname: text("nickname").notNull(),
    isActive: boolean("is_active").default(true),
    status: text("status").default("active"), // active, warning, inactive
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
    lastBattleAt: timestamp("last_battle_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("member_guild_ign").on(table.guildId, table.ign),
    index("idx_member_guild").on(table.guildId, table.isActive, table.status),
  ],
);

// ============================================
// Battles
// ============================================
export const battles = pgTable(
  "battles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guildId: uuid("guild_id")
      .notNull()
      .references(() => guilds.id),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id),
    date: date("date").notNull(),
    weekday: text("weekday").notNull(), // SAT, MON, WED
    battleNumber: integer("battle_number").notNull(),
    battleType: text("battle_type").default("attack"),
    result: text("result").notNull(), // win, loss
    enemyGuildName: text("enemy_guild_name").default(""),
    enemyPlayerName: text("enemy_player_name"),

    alliedTeam: jsonb("allied_team").notNull(),
    enemyTeam: jsonb("enemy_team").notNull(),

    firstTurn: boolean("first_turn"),
    videoUrl: text("video_url"),
    submittedByUserId: uuid("submitted_by_user_id")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("battle_unique").on(
      table.guildId,
      table.memberId,
      table.date,
      table.battleNumber,
    ),
    index("idx_battle_guild_date").on(table.guildId, table.date),
    index("idx_battle_guild_member").on(table.guildId, table.memberId),
  ],
);

// ============================================
// Battle Hero Pairs (denormalized for analytics)
// Populated via DB trigger on battle insert/update
// ============================================
export const battleHeroPairs = pgTable(
  "battle_hero_pairs",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    battleId: uuid("battle_id")
      .notNull()
      .references(() => battles.id, { onDelete: "cascade" }),
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
  },
  (table) => [
    index("idx_bhp_guild_date").on(table.guildId, table.date),
    index("idx_bhp_matchup").on(table.alliedHeroId, table.enemyHeroId),
  ],
);

// ============================================
// GVG Attack Guides
// ============================================
export const gvgGuides = pgTable(
  "gvg_guides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    defenseHeroes: text("defense_heroes").array().notNull(),
    attackHeroes: text("attack_heroes").array().notNull(),
    attackPriority: integer("attack_priority").notNull().default(1),
    attackSkillOrder: jsonb("attack_skill_order").notNull(),
    defenseSkillOrder: jsonb("defense_skill_order"),
    strategyNotes: text("strategy_notes").default(""),
    mediaUrls: text("media_urls")
      .array()
      .default(sql`ARRAY[]::TEXT[]`),
    patchVersion: text("patch_version").notNull(),
    version: integer("version").default(1),
    status: text("status").default("draft"), // draft, published, archived
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_guide_status").on(table.status)],
);

// ============================================
// GVG Guide Versions (auto-snapshot via DB trigger)
// ============================================
export const gvgGuideVersions = pgTable(
  "gvg_guide_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guideId: uuid("guide_id")
      .notNull()
      .references(() => gvgGuides.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    title: text("title").notNull(),
    defenseHeroes: text("defense_heroes").array().notNull(),
    attackHeroes: text("attack_heroes").array().notNull(),
    attackPriority: integer("attack_priority").notNull(),
    attackSkillOrder: jsonb("attack_skill_order").notNull(),
    defenseSkillOrder: jsonb("defense_skill_order"),
    strategyNotes: text("strategy_notes").default(""),
    mediaUrls: text("media_urls")
      .array()
      .default(sql`ARRAY[]::TEXT[]`),
    patchVersion: text("patch_version").notNull(),
    status: text("status").notNull(),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_guide_ver").on(table.guideId, table.version)],
);

// ============================================
// Attack Guidelines (defense team -> counter strategies)
// ============================================
export const attackGuidelines = pgTable("attack_guidelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  defenseTeam: jsonb("defense_team").notNull(),
  counterStrategies: jsonb("counter_strategies").notNull(),
  isActive: boolean("is_active").default(true),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// Advent Expedition
// ============================================
export const adventCycles = pgTable(
  "advent_cycles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guildId: uuid("guild_id")
      .notNull()
      .references(() => guilds.id),
    name: text("name").notNull().default(""),
    status: text("status").default("collecting"), // collecting, planning, active, completed
    startDate: date("start_date"),
    endDate: date("end_date"),
    targetDay: integer("target_day").default(9),
    autoRegenerate: boolean("auto_regenerate").default(true),
    bossHp: jsonb("boss_hp").default({
      teo: 100000000,
      yeonhee: 100000000,
      kyle: 100000000,
      karma: 100000000,
    }),
    plan: jsonb("plan"), // GeneratedPlan JSON
    memberAvailability: jsonb("member_availability"), // { memberId: "YYYY-MM-DD" }[]
    estimatedDays: integer("estimated_days"),
    actualDays: integer("actual_days"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_advent_guild").on(table.guildId, table.createdAt)],
);

export const adventProfiles = pgTable(
  "advent_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guildId: uuid("guild_id")
      .notNull()
      .references(() => guilds.id),
    memberId: uuid("member_id").references(() => members.id),
    memberIgn: text("member_ign").notNull(),
    scores: jsonb("scores").notNull().default({}), // { teo: number, yeonhee: number, kyle: number, karma: number }
    cycleId: uuid("cycle_id").references(() => adventCycles.id, {
      onDelete: "cascade",
    }),
    imageUrl: text("image_url"),
    extractionConfidence: integer("extraction_confidence"), // 0-100
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("advent_profile_unique").on(
      table.guildId,
      table.memberIgn,
      table.cycleId,
    ),
    index("idx_advent_profile_cycle").on(table.cycleId),
  ],
);

// ============================================
// Castle Rush
// ============================================
export const castleRushScores = pgTable(
  "castle_rush_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guildId: uuid("guild_id")
      .notNull()
      .references(() => guilds.id),
    memberId: uuid("member_id").references(() => members.id),
    memberIgn: text("member_ign"),
    boss: text("boss").notNull(),
    score: bigint("score", { mode: "number" }).notNull(),
    date: date("date").notNull(),
    extractionMethod: text("extraction_method").default("manual"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_cr_guild_date").on(table.guildId, table.date),
    index("idx_cr_boss").on(table.guildId, table.boss, table.date),
  ],
);
