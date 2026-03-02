import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { battles, battleHeroPairs, members, heroes } from "@/lib/db/schema";
import { eq, and, gte, desc, sql, inArray } from "drizzle-orm";

// ============================================
// Types
// ============================================

export interface DashboardKPIs {
  winRate: number;
  totalBattles: number;
  wins: number;
  losses: number;
  activeMembers: number;
  mostRecentDate: string | null;
  winRateTrend: number; // percentage point change vs previous period
}

export interface HeroCombo {
  heroIds: string[];
  heroNames: string[];
  wins: number;
  total: number;
  winRate: number;
}

export interface RecentBattle {
  id: string;
  date: string;
  result: string;
  enemyGuildName: string | null;
  memberIgn: string | null;
}

export interface DailyWinRate {
  date: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export interface HeroUsageStat {
  heroId: string;
  heroName: string;
  count: number;
  percentage: number;
}

export interface HeroMatchup {
  alliedHeroId: string;
  alliedHeroName: string;
  enemyHeroId: string;
  enemyHeroName: string;
  wins: number;
  total: number;
  winRate: number;
}

export interface PositionStats {
  wins: number;
  total: number;
  winRate: number;
}

export interface SkillOrderImpact {
  skillId: string;
  heroId: string;
  heroName: string;
  skillLabel: string;
  position1: PositionStats;
  position2: PositionStats;
  position3: PositionStats;
  bestPosition: number;
  totalUses: number;
}

export interface SpeedBracket {
  minSpeed: number;
  maxSpeed: number;
  wins: number;
  total: number;
  winRate: number;
}

export interface FirstTurnAnalysis {
  alliedFirstWins: number;
  alliedFirstTotal: number;
  alliedFirstWinRate: number;
  enemyFirstWins: number;
  enemyFirstTotal: number;
  enemyFirstWinRate: number;
  advantageDelta: number;
}

export interface SpeedDataPoint {
  alliedSpeed: number;
  enemySpeed: number;
  result: string;
  speedDiff: number;
}

export interface SpeedAnalysisData {
  speedBrackets: SpeedBracket[];
  firstTurnAnalysis: FirstTurnAnalysis;
  speedVsResult: SpeedDataPoint[];
}

export interface EnemyGuildSummary {
  guildName: string;
  totalBattles: number;
  wins: number;
  losses: number;
  winRate: number;
  lastEncountered: string;
}

export interface MemberPerformance {
  memberId: string;
  ign: string;
  totalBattles: number;
  wins: number;
  losses: number;
  winRate: number | null;
  attackBattles: number;
  attackWinRate: number | null;
  defenseBattles: number;
  defenseWinRate: number | null;
  eligibleWarDays: number;
  participationRate: number | null;
  recentTrend: "improving" | "stable" | "declining";
}

export interface CounterComposition {
  heroIds: string[];
  heroNames: string[];
  wins: number;
  total: number;
  winRate: number;
}

export interface EnemyComposition {
  compositionId: string;
  heroIds: string[];
  heroNames: string[];
  seenCount: number;
  winAgainst: number;
  lossAgainst: number;
  winRate: number;
  topCounters: CounterComposition[];
}

export interface CounterRecommendationResult {
  exactMatch: EnemyComposition | null;
  similarCompositions: EnemyComposition[];
  recommendedCounters: CounterComposition[];
}

export interface HeroUsageWithWinRate {
  heroId: string;
  heroName: string;
  count: number;
  percentage: number; // relative to most-picked hero (for bar width)
  wins: number;
  total: number;
  winRate: number;
}

export interface MemberWarPerformance {
  memberId: string;
  ign: string;
  totalBattles: number;
  wins: number;
  losses: number;
  winRate: number | null;
  /** Per-date breakdown: { "2026-03-01": { wins: 2, losses: 1 }, ... } */
  perDate: Record<string, { wins: number; losses: number }>;
}

export interface DashboardKPIsFromWars {
  winRate: number;
  totalBattles: number;
  wins: number;
  losses: number;
  activeMembers: number;
  /** Win rate change: latest GW win rate minus previous GW win rate */
  latestVsPrevTrend: number;
  latestWarDate: string | null;
}

// ============================================
// Helpers
// ============================================

function calcWinRate(wins: number, total: number): number {
  return total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
}

function calcWinRateNullable(wins: number, total: number): number | null {
  return total > 0 ? Math.round((wins / total) * 1000) / 10 : null;
}

function getDateCutoff(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function compositionId(heroIds: string[]): string {
  return [...heroIds].sort().join("|");
}

const getHeroNameRecord = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const rows = await db
      .select({ id: heroes.id, name: heroes.name })
      .from(heroes);
    return Object.fromEntries(rows.map((r) => [r.id, r.name]));
  },
  ["hero-name-map"],
  { revalidate: 600, tags: ["heroes"] },
);

async function getHeroNameMap(): Promise<Map<string, string>> {
  const obj = await getHeroNameRecord();
  return new Map(Object.entries(obj));
}

const getSkillLabelRecord = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const rows = await db
      .select({ skill1Id: heroes.skill1Id, skill2Id: heroes.skill2Id })
      .from(heroes);
    const map: Record<string, string> = {};
    for (const h of rows) {
      if (h.skill1Id) map[h.skill1Id] = "Skill 1 ล่าง";
      if (h.skill2Id) map[h.skill2Id] = "Skill 2 บน";
    }
    return map;
  },
  ["skill-label-map"],
  { revalidate: 600, tags: ["heroes"] },
);

async function getSkillLabelMap(): Promise<Map<string, string>> {
  const obj = await getSkillLabelRecord();
  return new Map(Object.entries(obj));
}

// ============================================
// 1. Dashboard KPIs
// ============================================

export async function getDashboardKPIs(
  guildId: string,
  days: number = 30,
): Promise<DashboardKPIs> {
  const cutoff = getDateCutoff(days);
  const prevCutoff = getDateCutoff(days * 2);

  // Run all three queries in parallel
  const [currentArr, previousArr, memberCountArr] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        wins: sql<number>`count(*) filter (where ${battles.result} = 'win')::int`,
        maxDate: sql<string>`max(${battles.date})`,
      })
      .from(battles)
      .where(and(eq(battles.guildId, guildId), gte(battles.date, cutoff))),
    db
      .select({
        total: sql<number>`count(*)::int`,
        wins: sql<number>`count(*) filter (where ${battles.result} = 'win')::int`,
      })
      .from(battles)
      .where(
        and(
          eq(battles.guildId, guildId),
          gte(battles.date, prevCutoff),
          sql`${battles.date} < ${cutoff}`,
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .where(and(eq(members.guildId, guildId), eq(members.isActive, true))),
  ]);

  const [current] = currentArr;
  const [previous] = previousArr;
  const [memberCount] = memberCountArr;

  const currentWinRate = calcWinRate(
    current?.wins ?? 0,
    current?.total ?? 0,
  );
  const prevWinRate = calcWinRate(
    previous?.wins ?? 0,
    previous?.total ?? 0,
  );

  return {
    winRate: currentWinRate,
    totalBattles: current?.total ?? 0,
    wins: current?.wins ?? 0,
    losses: (current?.total ?? 0) - (current?.wins ?? 0),
    activeMembers: memberCount?.count ?? 0,
    mostRecentDate: current?.maxDate ?? null,
    winRateTrend:
      previous?.total && previous.total > 0
        ? Math.round((currentWinRate - prevWinRate) * 10) / 10
        : 0,
  };
}

// ============================================
// 2. Top Hero Combos (for dashboard)
// ============================================

export async function getTopHeroCombos(
  guildId: string,
  days: number = 30,
  minBattles: number = 3,
  limit: number = 10,
): Promise<HeroCombo[]> {
  const cutoff = getDateCutoff(days);

  // Aggregate compositions entirely in SQL using sorted hero ID arrays
  const [rows, heroMap] = await Promise.all([
    db.execute<{
      hero_ids: string;
      wins: string;
      total: string;
    }>(sql`
      WITH battle_comps AS (
        SELECT
          b.id,
          b.result,
          (
            SELECT string_agg(hero_id, '|' ORDER BY hero_id)
            FROM (
              SELECT elem->>'heroId' AS hero_id
              FROM jsonb_array_elements(b.allied_team->'heroes') AS elem
            ) sub
          ) AS comp_key,
          (
            SELECT array_agg(hero_id ORDER BY hero_id)
            FROM (
              SELECT elem->>'heroId' AS hero_id
              FROM jsonb_array_elements(b.allied_team->'heroes') AS elem
            ) sub
          ) AS hero_ids
        FROM battles b
        WHERE b.guild_id = ${guildId} AND b.date >= ${cutoff}
      )
      SELECT
        array_to_string(hero_ids, ',') AS hero_ids,
        count(*) filter (where result = 'win')::text AS wins,
        count(*)::text AS total
      FROM battle_comps
      WHERE comp_key IS NOT NULL
      GROUP BY comp_key, hero_ids
      HAVING count(*) >= ${minBattles}
      ORDER BY count(*) filter (where result = 'win')::float / count(*)::float DESC, count(*) DESC
      LIMIT ${limit}
    `),
    getHeroNameMap(),
  ]);

  return rows.map((r) => {
    const heroIds = r.hero_ids.split(",");
    const wins = Number(r.wins);
    const total = Number(r.total);
    return {
      heroIds,
      heroNames: heroIds.map((id) => heroMap.get(id) ?? id.slice(0, 8)),
      wins,
      total,
      winRate: calcWinRate(wins, total),
    };
  });
}

// ============================================
// 3. Recent Battles (for dashboard)
// ============================================

export async function getRecentBattles(
  guildId: string,
  limit: number = 10,
): Promise<RecentBattle[]> {
  const rows = await db
    .select({
      id: battles.id,
      date: battles.date,
      result: battles.result,
      enemyGuildName: battles.enemyGuildName,
      memberIgn: members.ign,
    })
    .from(battles)
    .leftJoin(members, eq(battles.memberId, members.id))
    .where(eq(battles.guildId, guildId))
    .orderBy(desc(battles.date), desc(battles.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    result: r.result,
    enemyGuildName: r.enemyGuildName,
    memberIgn: r.memberIgn,
  }));
}

// ============================================
// 4. Win Rate Trend
// ============================================

export async function getWinRateTrend(
  guildId: string,
  days: number = 30,
): Promise<DailyWinRate[]> {
  const cutoff = getDateCutoff(days);

  const rows = await db
    .select({
      date: battles.date,
      total: sql<number>`count(*)::int`,
      wins: sql<number>`count(*) filter (where ${battles.result} = 'win')::int`,
    })
    .from(battles)
    .where(and(eq(battles.guildId, guildId), gte(battles.date, cutoff)))
    .groupBy(battles.date)
    .orderBy(battles.date);

  return rows.map((r) => ({
    date: r.date,
    wins: r.wins,
    losses: r.total - r.wins,
    total: r.total,
    winRate: calcWinRate(r.wins, r.total),
  }));
}

// ============================================
// 5. Hero Usage
// ============================================

export async function getHeroUsage(
  guildId: string,
  days: number = 30,
  limit: number = 10,
): Promise<HeroUsageStat[]> {
  const cutoff = getDateCutoff(days);

  const rows = await db.execute<{ hero_id: string; pick_count: string }>(sql`
    SELECT elem->>'heroId' AS hero_id, count(*)::text AS pick_count
    FROM ${battles}, jsonb_array_elements(${battles.alliedTeam}->'heroes') AS elem
    WHERE ${battles.guildId} = ${guildId} AND ${battles.date} >= ${cutoff}
    GROUP BY hero_id
    ORDER BY count(*) DESC
    LIMIT ${limit}
  `);

  const heroMap = await getHeroNameMap();
  const totalPicks = rows.reduce((sum, r) => sum + Number(r.pick_count), 0);

  return rows.map((r) => ({
    heroId: r.hero_id,
    heroName: heroMap.get(r.hero_id) ?? r.hero_id.slice(0, 8),
    count: Number(r.pick_count),
    percentage:
      totalPicks > 0
        ? Math.round((Number(r.pick_count) / totalPicks) * 1000) / 10
        : 0,
  }));
}

// ============================================
// 6. Hero Matchups
// ============================================

export async function getHeroMatchups(
  guildId: string,
  days: number = 30,
  minBattles: number = 3,
): Promise<HeroMatchup[]> {
  const cutoff = getDateCutoff(days);

  const rows = await db
    .select({
      alliedHeroId: battleHeroPairs.alliedHeroId,
      enemyHeroId: battleHeroPairs.enemyHeroId,
      total: sql<number>`count(*)::int`,
      wins: sql<number>`count(*) filter (where ${battleHeroPairs.result} = 'win')::int`,
    })
    .from(battleHeroPairs)
    .where(
      and(
        eq(battleHeroPairs.guildId, guildId),
        gte(battleHeroPairs.date, cutoff),
      ),
    )
    .groupBy(battleHeroPairs.alliedHeroId, battleHeroPairs.enemyHeroId)
    .having(sql`count(*) >= ${minBattles}`)
    .orderBy(sql`count(*) filter (where ${battleHeroPairs.result} = 'win')::float / count(*)::float desc`);

  const heroMap = await getHeroNameMap();

  return rows.map((r) => ({
    alliedHeroId: r.alliedHeroId,
    alliedHeroName: heroMap.get(r.alliedHeroId) ?? r.alliedHeroId.slice(0, 8),
    enemyHeroId: r.enemyHeroId,
    enemyHeroName: heroMap.get(r.enemyHeroId) ?? r.enemyHeroId.slice(0, 8),
    wins: r.wins,
    total: r.total,
    winRate: calcWinRate(r.wins, r.total),
  }));
}

// ============================================
// 7. Skill Order Impact
// ============================================

export async function getSkillOrderImpact(
  guildId: string,
  days: number = 30,
): Promise<SkillOrderImpact[]> {
  const cutoff = getDateCutoff(days);

  const rows = await db.execute<{
    skill_id: string;
    hero_id: string;
    skill_order: string;
    result: string;
    cnt: string;
  }>(sql`
    SELECT
      elem->>'skillId' AS skill_id,
      elem->>'heroId' AS hero_id,
      (elem->>'order')::int AS skill_order,
      ${battles.result} AS result,
      count(*)::text AS cnt
    FROM ${battles}, jsonb_array_elements(${battles.alliedTeam}->'skillSequence') AS elem
    WHERE ${battles.guildId} = ${guildId} AND ${battles.date} >= ${cutoff}
    GROUP BY skill_id, hero_id, skill_order, ${battles.result}
  `);

  // Aggregate per skill
  const skillMap = new Map<
    string,
    {
      skillId: string;
      heroId: string;
      positions: Record<number, { wins: number; total: number }>;
    }
  >();

  for (const row of rows) {
    const key = row.skill_id;
    if (!skillMap.has(key)) {
      skillMap.set(key, {
        skillId: row.skill_id,
        heroId: row.hero_id,
        positions: { 1: { wins: 0, total: 0 }, 2: { wins: 0, total: 0 }, 3: { wins: 0, total: 0 } },
      });
    }
    const entry = skillMap.get(key)!;
    const pos = Number(row.skill_order);
    if (pos >= 1 && pos <= 3) {
      const cnt = Number(row.cnt);
      entry.positions[pos].total += cnt;
      if (row.result === "win") entry.positions[pos].wins += cnt;
    }
  }

  // Resolve hero names and skill ID → label mapping
  const [heroMap, skillLabelMap] = await Promise.all([
    getHeroNameMap(),
    getSkillLabelMap(),
  ]);

  return Array.from(skillMap.values())
    .map((entry) => {
      const p1 = entry.positions[1];
      const p2 = entry.positions[2];
      const p3 = entry.positions[3];
      const totalUses = p1.total + p2.total + p3.total;

      const rates = [
        { pos: 1, rate: calcWinRate(p1.wins, p1.total) },
        { pos: 2, rate: calcWinRate(p2.wins, p2.total) },
        { pos: 3, rate: calcWinRate(p3.wins, p3.total) },
      ];
      const bestPosition = rates.reduce((best, r) =>
        r.rate > best.rate ? r : best,
      ).pos;

      return {
        skillId: entry.skillId,
        heroId: entry.heroId,
        heroName: heroMap.get(entry.heroId) ?? entry.heroId.slice(0, 8),
        skillLabel: skillLabelMap.get(entry.skillId) ?? "Skill",
        position1: { wins: p1.wins, total: p1.total, winRate: calcWinRate(p1.wins, p1.total) },
        position2: { wins: p2.wins, total: p2.total, winRate: calcWinRate(p2.wins, p2.total) },
        position3: { wins: p3.wins, total: p3.total, winRate: calcWinRate(p3.wins, p3.total) },
        bestPosition,
        totalUses,
      };
    })
    .filter((s) => s.totalUses >= 3)
    .sort((a, b) => b.totalUses - a.totalUses);
}

// ============================================
// 9. Speed Analysis
// ============================================

export async function getSpeedAnalysis(
  guildId: string,
  days: number = 30,
): Promise<SpeedAnalysisData> {
  const cutoff = getDateCutoff(days);

  // Run all three queries in parallel
  const [bracketRows, firstTurnRows, scatterRows] = await Promise.all([
    // Speed brackets aggregated in SQL
    db.execute<{
      bracket: string;
      wins: string;
      total: string;
    }>(sql`
      SELECT
        (floor((${battles.alliedTeam}->>'speed')::int / 50) * 50)::int::text AS bracket,
        count(*) filter (where ${battles.result} = 'win')::text AS wins,
        count(*)::text AS total
      FROM ${battles}
      WHERE ${battles.guildId} = ${guildId}
        AND ${battles.date} >= ${cutoff}
        AND (${battles.alliedTeam}->>'speed')::int > 0
      GROUP BY floor((${battles.alliedTeam}->>'speed')::int / 50) * 50
      ORDER BY bracket::int
    `),
    // First-turn analysis aggregated in SQL
    db.execute<{
      allied_first_wins: string;
      allied_first_total: string;
      enemy_first_wins: string;
      enemy_first_total: string;
    }>(sql`
      SELECT
        count(*) filter (where ${battles.firstTurn} = true AND ${battles.result} = 'win')::text AS allied_first_wins,
        count(*) filter (where ${battles.firstTurn} = true)::text AS allied_first_total,
        count(*) filter (where ${battles.firstTurn} = false AND ${battles.result} = 'win')::text AS enemy_first_wins,
        count(*) filter (where ${battles.firstTurn} = false)::text AS enemy_first_total
      FROM ${battles}
      WHERE ${battles.guildId} = ${guildId}
        AND ${battles.date} >= ${cutoff}
        AND ${battles.firstTurn} IS NOT NULL
    `),
    // Scatter data — raw points needed for chart (limit 200)
    db.execute<{
      allied_speed: string;
      enemy_speed: string;
      result: string;
    }>(sql`
      SELECT
        (${battles.alliedTeam}->>'speed')::int::text AS allied_speed,
        (${battles.enemyTeam}->>'speed')::int::text AS enemy_speed,
        ${battles.result} AS result
      FROM ${battles}
      WHERE ${battles.guildId} = ${guildId}
        AND ${battles.date} >= ${cutoff}
        AND (${battles.alliedTeam}->>'speed')::int > 0
        AND (${battles.enemyTeam}->>'speed')::int > 0
      LIMIT 200
    `),
  ]);

  const speedBrackets = bracketRows.map((r) => {
    const min = Number(r.bracket);
    const wins = Number(r.wins);
    const total = Number(r.total);
    return {
      minSpeed: min,
      maxSpeed: min + 49,
      wins,
      total,
      winRate: calcWinRate(wins, total),
    };
  });

  const ft = firstTurnRows[0];
  const alliedFirstWins = Number(ft?.allied_first_wins ?? 0);
  const alliedFirstTotal = Number(ft?.allied_first_total ?? 0);
  const enemyFirstWins = Number(ft?.enemy_first_wins ?? 0);
  const enemyFirstTotal = Number(ft?.enemy_first_total ?? 0);
  const alliedFirstWinRate = calcWinRate(alliedFirstWins, alliedFirstTotal);
  const enemyFirstWinRate = calcWinRate(enemyFirstWins, enemyFirstTotal);

  const speedVsResult: SpeedDataPoint[] = scatterRows.map((r) => {
    const alliedSpeed = Number(r.allied_speed);
    const enemySpeed = Number(r.enemy_speed);
    return {
      alliedSpeed,
      enemySpeed,
      result: r.result,
      speedDiff: alliedSpeed - enemySpeed,
    };
  });

  return {
    speedBrackets,
    firstTurnAnalysis: {
      alliedFirstWins,
      alliedFirstTotal,
      alliedFirstWinRate,
      enemyFirstWins,
      enemyFirstTotal,
      enemyFirstWinRate,
      advantageDelta:
        Math.round((alliedFirstWinRate - enemyFirstWinRate) * 10) / 10,
    },
    speedVsResult,
  };
}

// ============================================
// 10. Enemy Guilds
// ============================================

export async function getEnemyGuilds(
  guildId: string,
  days: number = 30,
): Promise<EnemyGuildSummary[]> {
  const cutoff = getDateCutoff(days);

  const rows = await db
    .select({
      guildName: battles.enemyGuildName,
      total: sql<number>`count(*)::int`,
      wins: sql<number>`count(*) filter (where ${battles.result} = 'win')::int`,
      lastEncountered: sql<string>`max(${battles.date})`,
    })
    .from(battles)
    .where(
      and(
        eq(battles.guildId, guildId),
        gte(battles.date, cutoff),
        sql`${battles.enemyGuildName} IS NOT NULL AND ${battles.enemyGuildName} != ''`,
      ),
    )
    .groupBy(battles.enemyGuildName)
    .orderBy(sql`count(*) desc`);

  return rows.map((r) => ({
    guildName: r.guildName ?? "",
    totalBattles: r.total,
    wins: r.wins,
    losses: r.total - r.wins,
    winRate: calcWinRate(r.wins, r.total),
    lastEncountered: r.lastEncountered,
  }));
}

// ============================================
// 11. Member Performance
// ============================================

export async function getMemberPerformance(
  guildId: string,
  days: number = 30,
): Promise<MemberPerformance[]> {
  const cutoff = getDateCutoff(days);
  const prevCutoff = getDateCutoff(days * 2);

  // Run current + previous period queries in parallel
  const [currentRows, prevRows] = await Promise.all([
    db.execute<{
      member_id: string;
      member_ign: string;
      total: string;
      wins: string;
      attack_total: string;
      attack_wins: string;
      defense_total: string;
      defense_wins: string;
      eligible_war_days: string;
    }>(sql`
      WITH war_days AS (
        SELECT count(DISTINCT date)::text AS cnt, min(date) AS min_date
        FROM battles
        WHERE guild_id = ${guildId} AND date >= ${cutoff}
      )
      SELECT
        m.id AS member_id,
        m.ign AS member_ign,
        count(b.id)::text AS total,
        count(b.id) filter (where b.result = 'win')::text AS wins,
        count(b.id) filter (where b.battle_type = 'attack')::text AS attack_total,
        count(b.id) filter (where b.battle_type = 'attack' AND b.result = 'win')::text AS attack_wins,
        count(b.id) filter (where b.battle_type = 'defense')::text AS defense_total,
        count(b.id) filter (where b.battle_type = 'defense' AND b.result = 'win')::text AS defense_wins,
        (
          SELECT count(DISTINCT wd2.date)
          FROM battles wd2
          WHERE wd2.guild_id = ${guildId}
            AND wd2.date >= ${cutoff}
            AND wd2.date >= m.joined_at::date
        )::text AS eligible_war_days
      FROM members m
      LEFT JOIN battles b ON b.member_id = m.id AND b.guild_id = ${guildId}
        AND b.date >= ${cutoff}
        AND b.date >= m.joined_at::date
      WHERE m.guild_id = ${guildId} AND m.is_active = true
      GROUP BY m.id, m.ign, m.joined_at
      ORDER BY count(b.id) DESC
    `),
    db.execute<{
      member_id: string;
      total: string;
      wins: string;
    }>(sql`
      SELECT
        m.id AS member_id,
        count(b.id)::text AS total,
        count(b.id) filter (where b.result = 'win')::text AS wins
      FROM members m
      LEFT JOIN battles b ON b.member_id = m.id AND b.guild_id = ${guildId}
        AND b.date >= ${prevCutoff} AND b.date < ${cutoff}
        AND b.date >= m.joined_at::date
      WHERE m.guild_id = ${guildId} AND m.is_active = true
      GROUP BY m.id
    `),
  ]);

  const prevMap = new Map(
    prevRows.map((r) => [
      r.member_id,
      calcWinRateNullable(Number(r.wins), Number(r.total)),
    ]),
  );

  return currentRows.map((r) => {
    const total = Number(r.total);
    const wins = Number(r.wins);
    const currentWR = calcWinRateNullable(wins, total);
    const prevWR = prevMap.get(r.member_id);

    let trend: "improving" | "stable" | "declining" = "stable";
    if (currentWR !== null && prevWR != null) {
      if (currentWR > prevWR + 5) trend = "improving";
      else if (currentWR < prevWR - 5) trend = "declining";
    }

    const attackTotal = Number(r.attack_total);
    const attackWins = Number(r.attack_wins);
    const defenseTotal = Number(r.defense_total);
    const defenseWins = Number(r.defense_wins);
    const eligibleWarDays = Number(r.eligible_war_days);

    return {
      memberId: r.member_id,
      ign: r.member_ign,
      totalBattles: total,
      wins,
      losses: total - wins,
      winRate: currentWR,
      attackBattles: attackTotal,
      attackWinRate: calcWinRateNullable(attackWins, attackTotal),
      defenseBattles: defenseTotal,
      defenseWinRate: calcWinRateNullable(defenseWins, defenseTotal),
      eligibleWarDays,
      participationRate: eligibleWarDays > 0
        ? Math.round((total / (eligibleWarDays * 5)) * 1000) / 10
        : null,
      recentTrend: trend,
    };
  });
}

// ============================================
// 12. Counter Recommendations
// ============================================

export async function getCounterRecommendations(
  guildId: string,
  enemyHeroIds: string[],
  days: number = 90,
): Promise<CounterRecommendationResult> {
  const cutoff = getDateCutoff(days);
  const sortedTargetIds = [...enemyHeroIds].sort();
  const targetKey = sortedTargetIds.join("|");

  // Run DB queries and hero name resolution in parallel
  const [matchRows, heroMap] = await Promise.all([
    db.execute<{
      enemy_comp_key: string;
      enemy_hero_ids: string;
      allied_comp_key: string;
      allied_hero_ids: string;
      result: string;
      overlap: string;
    }>(sql`
      WITH battle_data AS (
        SELECT
          b.id,
          b.result,
          (
            SELECT string_agg(hero_id, '|' ORDER BY hero_id)
            FROM (SELECT elem->>'heroId' AS hero_id FROM jsonb_array_elements(b.enemy_team->'heroes') AS elem) sub
          ) AS enemy_comp_key,
          (
            SELECT array_agg(hero_id ORDER BY hero_id)
            FROM (SELECT elem->>'heroId' AS hero_id FROM jsonb_array_elements(b.enemy_team->'heroes') AS elem) sub
          ) AS enemy_hero_ids,
          (
            SELECT string_agg(hero_id, '|' ORDER BY hero_id)
            FROM (SELECT elem->>'heroId' AS hero_id FROM jsonb_array_elements(b.allied_team->'heroes') AS elem) sub
          ) AS allied_comp_key,
          (
            SELECT array_agg(hero_id ORDER BY hero_id)
            FROM (SELECT elem->>'heroId' AS hero_id FROM jsonb_array_elements(b.allied_team->'heroes') AS elem) sub
          ) AS allied_hero_ids,
          (
            SELECT count(*)
            FROM (SELECT elem->>'heroId' AS hero_id FROM jsonb_array_elements(b.enemy_team->'heroes') AS elem) sub
            WHERE sub.hero_id = ANY(${sortedTargetIds}::text[])
          ) AS overlap
        FROM battles b
        WHERE b.guild_id = ${guildId} AND b.date >= ${cutoff}
      )
      SELECT
        enemy_comp_key,
        array_to_string(enemy_hero_ids, ',') AS enemy_hero_ids,
        allied_comp_key,
        array_to_string(allied_hero_ids, ',') AS allied_hero_ids,
        result,
        overlap::text
      FROM battle_data
      WHERE overlap >= 3
    `),
    getHeroNameMap(),
  ]);

  // Process results in JS (now working with a much smaller filtered dataset)
  let exactMatch: EnemyComposition | null = null;
  const similarMap = new Map<string, {
    heroIds: string[];
    wins: number;
    losses: number;
    overlap: number;
  }>();
  const counterMap = new Map<string, {
    heroIds: string[];
    wins: number;
    total: number;
  }>();

  for (const row of matchRows) {
    const eKey = row.enemy_comp_key;
    const eHeroIds = row.enemy_hero_ids.split(",");
    const isExact = eKey === targetKey;
    const overlap = Number(row.overlap);
    const isWin = row.result === "win";

    if (isExact) {
      if (!exactMatch) {
        exactMatch = {
          compositionId: eKey,
          heroIds: eHeroIds,
          heroNames: [],
          seenCount: 0,
          winAgainst: 0,
          lossAgainst: 0,
          winRate: 0,
          topCounters: [],
        };
      }
      exactMatch.seenCount++;
      if (isWin) exactMatch.winAgainst++;
      else exactMatch.lossAgainst++;
    } else if (overlap >= 3) {
      if (!similarMap.has(eKey)) {
        similarMap.set(eKey, { heroIds: eHeroIds, wins: 0, losses: 0, overlap });
      }
      const sim = similarMap.get(eKey)!;
      if (isWin) sim.wins++;
      else sim.losses++;
    }

    // Track winning allied teams as counters
    if (isWin && row.allied_hero_ids) {
      const aHeroIds = row.allied_hero_ids.split(",");
      const counterKey = row.allied_comp_key;
      if (!counterMap.has(counterKey)) {
        counterMap.set(counterKey, { heroIds: aHeroIds, wins: 0, total: 0 });
      }
      counterMap.get(counterKey)!.wins++;
      counterMap.get(counterKey)!.total++;
    }
  }

  // Finalize exact match
  if (exactMatch) {
    exactMatch.heroNames = exactMatch.heroIds.map((id) => heroMap.get(id) ?? id.slice(0, 8));
    exactMatch.winRate = calcWinRate(exactMatch.winAgainst, exactMatch.seenCount);
  }

  // Build similar compositions
  const similarCompositions: EnemyComposition[] = Array.from(similarMap.values())
    .sort((a, b) => b.overlap - a.overlap || (b.wins + b.losses) - (a.wins + a.losses))
    .slice(0, 10)
    .map((s) => ({
      compositionId: compositionId(s.heroIds),
      heroIds: s.heroIds,
      heroNames: s.heroIds.map((id) => heroMap.get(id) ?? id.slice(0, 8)),
      seenCount: s.wins + s.losses,
      winAgainst: s.wins,
      lossAgainst: s.losses,
      winRate: calcWinRate(s.wins, s.wins + s.losses),
      topCounters: [],
    }));

  // Build recommended counters
  const recommendedCounters: CounterComposition[] = Array.from(counterMap.values())
    .filter((c) => c.total >= 2)
    .sort((a, b) => calcWinRate(b.wins, b.total) - calcWinRate(a.wins, a.total) || b.total - a.total)
    .slice(0, 10)
    .map((c) => ({
      heroIds: c.heroIds,
      heroNames: c.heroIds.map((id) => heroMap.get(id) ?? id.slice(0, 8)),
      wins: c.wins,
      total: c.total,
      winRate: calcWinRate(c.wins, c.total),
    }));

  return { exactMatch, similarCompositions, recommendedCounters };
}

// ============================================
// Dashboard (war-date scoped) queries
// ============================================

export async function getLastNWarDates(
  guildId: string,
  n: number,
): Promise<string[]> {
  const rows = await db
    .select({ date: battles.date })
    .from(battles)
    .where(eq(battles.guildId, guildId))
    .groupBy(battles.date)
    .orderBy(desc(battles.date))
    .limit(n);

  return rows.map((r) => r.date);
}

export async function getDashboardKPIsFromWars(
  guildId: string,
  warDates: string[],
): Promise<DashboardKPIsFromWars> {
  if (warDates.length === 0) {
    const [memberCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .where(and(eq(members.guildId, guildId), eq(members.isActive, true)));
    return {
      winRate: 0,
      totalBattles: 0,
      wins: 0,
      losses: 0,
      activeMembers: memberCount?.count ?? 0,
      latestVsPrevTrend: 0,
      latestWarDate: null,
    };
  }

  const latestDate = warDates[0];
  const prevDate = warDates.length > 1 ? warDates[1] : null;

  const [overallArr, latestArr, prevArr, memberCountArr] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        wins: sql<number>`count(*) filter (where ${battles.result} = 'win')::int`,
      })
      .from(battles)
      .where(
        and(
          eq(battles.guildId, guildId),
          inArray(battles.date, warDates),
        ),
      ),
    db
      .select({
        total: sql<number>`count(*)::int`,
        wins: sql<number>`count(*) filter (where ${battles.result} = 'win')::int`,
      })
      .from(battles)
      .where(
        and(eq(battles.guildId, guildId), eq(battles.date, latestDate)),
      ),
    prevDate
      ? db
          .select({
            total: sql<number>`count(*)::int`,
            wins: sql<number>`count(*) filter (where ${battles.result} = 'win')::int`,
          })
          .from(battles)
          .where(
            and(eq(battles.guildId, guildId), eq(battles.date, prevDate)),
          )
      : Promise.resolve([{ total: 0, wins: 0 }]),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .where(and(eq(members.guildId, guildId), eq(members.isActive, true))),
  ]);

  const [overall] = overallArr;
  const [latest] = latestArr;
  const [prev] = prevArr;
  const [memberCount] = memberCountArr;

  const overallWinRate = calcWinRate(overall?.wins ?? 0, overall?.total ?? 0);
  const latestWinRate = calcWinRate(latest?.wins ?? 0, latest?.total ?? 0);
  const prevWinRate = calcWinRate(prev?.wins ?? 0, prev?.total ?? 0);

  return {
    winRate: overallWinRate,
    totalBattles: overall?.total ?? 0,
    wins: overall?.wins ?? 0,
    losses: (overall?.total ?? 0) - (overall?.wins ?? 0),
    activeMembers: memberCount?.count ?? 0,
    latestVsPrevTrend:
      prev?.total && prev.total > 0
        ? Math.round((latestWinRate - prevWinRate) * 10) / 10
        : 0,
    latestWarDate: latestDate,
  };
}

export async function getHeroUsageWithWinRate(
  guildId: string,
  warDates: string[],
  limit: number = 6,
): Promise<HeroUsageWithWinRate[]> {
  if (warDates.length === 0) return [];

  const rows = await db.execute<{
    hero_id: string;
    pick_count: string;
    wins: string;
  }>(sql`
    SELECT
      elem->>'heroId' AS hero_id,
      count(*)::text AS pick_count,
      count(*) FILTER (WHERE b.result = 'win')::text AS wins
    FROM ${battles} b, jsonb_array_elements(b.allied_team->'heroes') AS elem
    WHERE b.guild_id = ${guildId} AND b.date IN (${sql.join(warDates.map(d => sql`${d}`), sql`, `)})
    GROUP BY hero_id
    ORDER BY count(*) DESC
    LIMIT ${limit}
  `);

  const heroMap = await getHeroNameMap();
  const maxPicks = rows.length > 0 ? Number(rows[0].pick_count) : 1;

  return rows.map((r) => {
    const count = Number(r.pick_count);
    const wins = Number(r.wins);
    return {
      heroId: r.hero_id,
      heroName: heroMap.get(r.hero_id) ?? r.hero_id.slice(0, 8),
      count,
      percentage: Math.round((count / maxPicks) * 100),
      wins,
      total: count,
      winRate: calcWinRate(wins, count),
    };
  });
}

export async function getFirstTurnAdvantage(
  guildId: string,
  warDates: string[],
): Promise<FirstTurnAnalysis> {
  const empty: FirstTurnAnalysis = {
    alliedFirstWins: 0,
    alliedFirstTotal: 0,
    alliedFirstWinRate: 0,
    enemyFirstWins: 0,
    enemyFirstTotal: 0,
    enemyFirstWinRate: 0,
    advantageDelta: 0,
  };
  if (warDates.length === 0) return empty;

  const [ft] = await db.execute<{
    allied_first_wins: string;
    allied_first_total: string;
    enemy_first_wins: string;
    enemy_first_total: string;
  }>(sql`
    SELECT
      count(*) filter (where ${battles.firstTurn} = true AND ${battles.result} = 'win')::text AS allied_first_wins,
      count(*) filter (where ${battles.firstTurn} = true)::text AS allied_first_total,
      count(*) filter (where ${battles.firstTurn} = false AND ${battles.result} = 'win')::text AS enemy_first_wins,
      count(*) filter (where ${battles.firstTurn} = false)::text AS enemy_first_total
    FROM ${battles}
    WHERE ${battles.guildId} = ${guildId}
      AND ${battles.date} IN (${sql.join(warDates.map(d => sql`${d}`), sql`, `)})
      AND ${battles.firstTurn} IS NOT NULL
  `);

  if (!ft) return empty;

  const alliedFirstWins = Number(ft.allied_first_wins);
  const alliedFirstTotal = Number(ft.allied_first_total);
  const enemyFirstWins = Number(ft.enemy_first_wins);
  const enemyFirstTotal = Number(ft.enemy_first_total);
  const alliedFirstWinRate = calcWinRate(alliedFirstWins, alliedFirstTotal);
  const enemyFirstWinRate = calcWinRate(enemyFirstWins, enemyFirstTotal);

  return {
    alliedFirstWins,
    alliedFirstTotal,
    alliedFirstWinRate,
    enemyFirstWins,
    enemyFirstTotal,
    enemyFirstWinRate,
    advantageDelta:
      Math.round((alliedFirstWinRate - enemyFirstWinRate) * 10) / 10,
  };
}

export async function getMemberWarPerformance(
  guildId: string,
  warDates: string[],
): Promise<MemberWarPerformance[]> {
  if (warDates.length === 0) return [];

  const rows = await db.execute<{
    member_id: string;
    member_ign: string;
    battle_date: string;
    wins: string;
    losses: string;
  }>(sql`
    SELECT
      m.id AS member_id,
      m.ign AS member_ign,
      b.date AS battle_date,
      count(*) FILTER (WHERE b.result = 'win')::text AS wins,
      count(*) FILTER (WHERE b.result = 'loss')::text AS losses
    FROM members m
    LEFT JOIN battles b ON b.member_id = m.id
      AND b.guild_id = ${guildId}
      AND b.date IN (${sql.join(warDates.map(d => sql`${d}`), sql`, `)})
    WHERE m.guild_id = ${guildId} AND m.is_active = true
    GROUP BY m.id, m.ign, b.date
    ORDER BY m.ign
  `);

  // Aggregate per member
  const memberMap = new Map<
    string,
    {
      memberId: string;
      ign: string;
      totalWins: number;
      totalLosses: number;
      perDate: Record<string, { wins: number; losses: number }>;
    }
  >();

  for (const row of rows) {
    if (!memberMap.has(row.member_id)) {
      memberMap.set(row.member_id, {
        memberId: row.member_id,
        ign: row.member_ign,
        totalWins: 0,
        totalLosses: 0,
        perDate: {},
      });
    }
    const entry = memberMap.get(row.member_id)!;
    const wins = Number(row.wins);
    const losses = Number(row.losses);
    if (row.battle_date) {
      entry.perDate[row.battle_date] = { wins, losses };
      entry.totalWins += wins;
      entry.totalLosses += losses;
    }
  }

  return Array.from(memberMap.values())
    .map((m) => {
      const total = m.totalWins + m.totalLosses;
      return {
        memberId: m.memberId,
        ign: m.ign,
        totalBattles: total,
        wins: m.totalWins,
        losses: m.totalLosses,
        winRate: calcWinRateNullable(m.totalWins, total),
        perDate: m.perDate,
      };
    })
    .sort((a, b) => b.totalBattles - a.totalBattles);
}

export async function getHardestEnemyComps(
  guildId: string,
  warDates: string[],
  minBattles: number = 2,
  limit: number = 5,
): Promise<HeroCombo[]> {
  if (warDates.length === 0) return [];

  const [rows, heroMap] = await Promise.all([
    db.execute<{
      hero_ids: string;
      wins: string;
      total: string;
    }>(sql`
      WITH battle_comps AS (
        SELECT
          b.id,
          b.result,
          (
            SELECT string_agg(hero_id, '|' ORDER BY hero_id)
            FROM (
              SELECT elem->>'heroId' AS hero_id
              FROM jsonb_array_elements(b.enemy_team->'heroes') AS elem
            ) sub
          ) AS comp_key,
          (
            SELECT array_agg(hero_id ORDER BY hero_id)
            FROM (
              SELECT elem->>'heroId' AS hero_id
              FROM jsonb_array_elements(b.enemy_team->'heroes') AS elem
            ) sub
          ) AS hero_ids
        FROM battles b
        WHERE b.guild_id = ${guildId} AND b.date IN (${sql.join(warDates.map(d => sql`${d}`), sql`, `)})
      )
      SELECT
        array_to_string(hero_ids, ',') AS hero_ids,
        count(*) filter (where result = 'win')::text AS wins,
        count(*)::text AS total
      FROM battle_comps
      WHERE comp_key IS NOT NULL
      GROUP BY comp_key, hero_ids
      HAVING count(*) >= ${minBattles}
      ORDER BY count(*) filter (where result = 'win')::float / count(*)::float ASC, count(*) DESC
      LIMIT ${limit}
    `),
    getHeroNameMap(),
  ]);

  return rows.map((r) => {
    const heroIds = r.hero_ids.split(",");
    const wins = Number(r.wins);
    const total = Number(r.total);
    return {
      heroIds,
      heroNames: heroIds.map((id) => heroMap.get(id) ?? id.slice(0, 8)),
      wins,
      total,
      winRate: calcWinRate(wins, total),
    };
  });
}

export async function getEnemyGuildsFromWars(
  guildId: string,
  warDates: string[],
): Promise<EnemyGuildSummary[]> {
  if (warDates.length === 0) return [];

  const rows = await db
    .select({
      guildName: battles.enemyGuildName,
      total: sql<number>`count(*)::int`,
      wins: sql<number>`count(*) filter (where ${battles.result} = 'win')::int`,
      lastEncountered: sql<string>`max(${battles.date})`,
    })
    .from(battles)
    .where(
      and(
        eq(battles.guildId, guildId),
        inArray(battles.date, warDates),
        sql`${battles.enemyGuildName} IS NOT NULL AND ${battles.enemyGuildName} != ''`,
      ),
    )
    .groupBy(battles.enemyGuildName)
    .orderBy(sql`max(${battles.date}) desc`);

  return rows.map((r) => ({
    guildName: r.guildName ?? "",
    totalBattles: r.total,
    wins: r.wins,
    losses: r.total - r.wins,
    winRate: calcWinRate(r.wins, r.total),
    lastEncountered: r.lastEncountered,
  }));
}

export async function getTopHeroCombosFromWars(
  guildId: string,
  warDates: string[],
  minBattles: number = 2,
  limit: number = 5,
): Promise<HeroCombo[]> {
  if (warDates.length === 0) return [];

  const [rows, heroMap] = await Promise.all([
    db.execute<{
      hero_ids: string;
      wins: string;
      total: string;
    }>(sql`
      WITH battle_comps AS (
        SELECT
          b.id,
          b.result,
          (
            SELECT string_agg(hero_id, '|' ORDER BY hero_id)
            FROM (
              SELECT elem->>'heroId' AS hero_id
              FROM jsonb_array_elements(b.allied_team->'heroes') AS elem
            ) sub
          ) AS comp_key,
          (
            SELECT array_agg(hero_id ORDER BY hero_id)
            FROM (
              SELECT elem->>'heroId' AS hero_id
              FROM jsonb_array_elements(b.allied_team->'heroes') AS elem
            ) sub
          ) AS hero_ids
        FROM battles b
        WHERE b.guild_id = ${guildId} AND b.date IN (${sql.join(warDates.map(d => sql`${d}`), sql`, `)})
      )
      SELECT
        array_to_string(hero_ids, ',') AS hero_ids,
        count(*) filter (where result = 'win')::text AS wins,
        count(*)::text AS total
      FROM battle_comps
      WHERE comp_key IS NOT NULL
      GROUP BY comp_key, hero_ids
      HAVING count(*) >= ${minBattles}
      ORDER BY count(*) filter (where result = 'win')::float / count(*)::float DESC, count(*) DESC
      LIMIT ${limit}
    `),
    getHeroNameMap(),
  ]);

  return rows.map((r) => {
    const heroIds = r.hero_ids.split(",");
    const wins = Number(r.wins);
    const total = Number(r.total);
    return {
      heroIds,
      heroNames: heroIds.map((id) => heroMap.get(id) ?? id.slice(0, 8)),
      wins,
      total,
      winRate: calcWinRate(wins, total),
    };
  });
}

// ============================================
// Cached variants for page-level use
// ============================================

export const getWinRateTrendCached = (guildId: string, days: number) =>
  unstable_cache(
    () => getWinRateTrend(guildId, days),
    ["win-rate-trend", guildId, String(days)],
    { revalidate: 120, tags: [`battles-${guildId}`] },
  )();

export const getHeroUsageCached = (guildId: string, days: number, limit: number) =>
  unstable_cache(
    () => getHeroUsage(guildId, days, limit),
    ["hero-usage", guildId, String(days), String(limit)],
    { revalidate: 120, tags: [`battles-${guildId}`] },
  )();

export const getHeroMatchupsCached = (guildId: string, days: number, minBattles: number) =>
  unstable_cache(
    () => getHeroMatchups(guildId, days, minBattles),
    ["hero-matchups", guildId, String(days), String(minBattles)],
    { revalidate: 120, tags: [`battles-${guildId}`] },
  )();

export const getSkillOrderImpactCached = (guildId: string, days: number) =>
  unstable_cache(
    () => getSkillOrderImpact(guildId, days),
    ["skill-order", guildId, String(days)],
    { revalidate: 120, tags: [`battles-${guildId}`] },
  )();

export const getSpeedAnalysisCached = (guildId: string, days: number) =>
  unstable_cache(
    () => getSpeedAnalysis(guildId, days),
    ["speed-analysis", guildId, String(days)],
    { revalidate: 120, tags: [`battles-${guildId}`] },
  )();

export const getMemberPerformanceCached = (guildId: string, days: number) =>
  unstable_cache(
    () => getMemberPerformance(guildId, days),
    ["member-performance", guildId, String(days)],
    { revalidate: 120, tags: [`battles-${guildId}`] },
  )();

export const getEnemyGuildsCached = (guildId: string, days: number) =>
  unstable_cache(
    () => getEnemyGuilds(guildId, days),
    ["enemy-guilds", guildId, String(days)],
    { revalidate: 120, tags: [`battles-${guildId}`] },
  )();
