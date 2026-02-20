import { db } from "@/lib/db";
import { battles, battleHeroPairs, members, heroes } from "@/lib/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";

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
  battleNumber: number;
  result: string;
  enemyGuildName: string | null;
  memberIgn: string | null;
  alliedFormation: string | null;
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
  skillName: string;
  position1: PositionStats;
  position2: PositionStats;
  position3: PositionStats;
  bestPosition: number;
  totalUses: number;
}

export interface FormationMatchup {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export interface FormationStat {
  formation: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  vsEnemyFormations: Record<string, FormationMatchup>;
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
  winRate: number;
  attackBattles: number;
  attackWinRate: number;
  defenseBattles: number;
  defenseWinRate: number;
  favoriteFormation: string | null;
  recentTrend: "improving" | "stable" | "declining";
}

export interface CounterComposition {
  heroIds: string[];
  heroNames: string[];
  formation: string | null;
  wins: number;
  total: number;
  winRate: number;
}

export interface EnemyComposition {
  compositionId: string;
  heroIds: string[];
  heroNames: string[];
  formation: string | null;
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

// ============================================
// Helpers
// ============================================

function calcWinRate(wins: number, total: number): number {
  return total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
}

function getDateCutoff(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function compositionId(heroIds: string[]): string {
  return [...heroIds].sort().join("|");
}

async function getHeroNameMap(): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: heroes.id, name: heroes.name })
    .from(heroes);
  return new Map(rows.map((r) => [r.id, r.name]));
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

  // Current period stats
  const [current] = await db
    .select({
      total: sql<number>`count(*)::int`,
      wins: sql<number>`count(*) filter (where ${battles.result} = 'win')::int`,
      maxDate: sql<string>`max(${battles.date})`,
    })
    .from(battles)
    .where(and(eq(battles.guildId, guildId), gte(battles.date, cutoff)));

  // Previous period stats for trend
  const [previous] = await db
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
    );

  // Active members
  const [memberCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(members)
    .where(and(eq(members.guildId, guildId), eq(members.isActive, true)));

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

  const rows = await db
    .select({
      alliedTeam: battles.alliedTeam,
      result: battles.result,
    })
    .from(battles)
    .where(and(eq(battles.guildId, guildId), gte(battles.date, cutoff)));

  // Aggregate by sorted hero composition
  const comboMap = new Map<
    string,
    { heroIds: string[]; wins: number; total: number }
  >();

  for (const row of rows) {
    const team = row.alliedTeam as { heroes?: { heroId: string }[] };
    const heroIds = (team.heroes ?? []).map((h) => h.heroId);
    if (heroIds.length === 0) continue;

    const key = compositionId(heroIds);
    const entry = comboMap.get(key) ?? { heroIds: [...heroIds].sort(), wins: 0, total: 0 };
    entry.total++;
    if (row.result === "win") entry.wins++;
    comboMap.set(key, entry);
  }

  const heroMap = await getHeroNameMap();

  return Array.from(comboMap.values())
    .filter((c) => c.total >= minBattles)
    .sort((a, b) => calcWinRate(b.wins, b.total) - calcWinRate(a.wins, a.total) || b.total - a.total)
    .slice(0, limit)
    .map((c) => ({
      heroIds: c.heroIds,
      heroNames: c.heroIds.map((id) => heroMap.get(id) ?? id.slice(0, 8)),
      wins: c.wins,
      total: c.total,
      winRate: calcWinRate(c.wins, c.total),
    }));
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
      battleNumber: battles.battleNumber,
      result: battles.result,
      enemyGuildName: battles.enemyGuildName,
      memberIgn: members.ign,
      alliedTeam: battles.alliedTeam,
    })
    .from(battles)
    .leftJoin(members, eq(battles.memberId, members.id))
    .where(eq(battles.guildId, guildId))
    .orderBy(desc(battles.date), desc(battles.createdAt))
    .limit(limit);

  return rows.map((r) => {
    const team = r.alliedTeam as { formation?: string } | null;
    return {
      id: r.id,
      date: r.date,
      battleNumber: r.battleNumber,
      result: r.result,
      enemyGuildName: r.enemyGuildName,
      memberIgn: r.memberIgn,
      alliedFormation: team?.formation ?? null,
    };
  });
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
// 7. Formation Stats
// ============================================

export async function getFormationStats(
  guildId: string,
  days: number = 30,
): Promise<FormationStat[]> {
  const cutoff = getDateCutoff(days);

  const rows = await db.execute<{
    allied_formation: string | null;
    enemy_formation: string | null;
    result: string;
    cnt: string;
  }>(sql`
    SELECT
      ${battles.alliedTeam}->>'formation' AS allied_formation,
      ${battles.enemyTeam}->>'formation' AS enemy_formation,
      ${battles.result} AS result,
      count(*)::text AS cnt
    FROM ${battles}
    WHERE ${battles.guildId} = ${guildId} AND ${battles.date} >= ${cutoff}
    GROUP BY allied_formation, enemy_formation, ${battles.result}
  `);

  const formations = ["4-1", "3-2", "1-4", "2-3"];
  const statMap = new Map<string, FormationStat>();

  for (const f of formations) {
    statMap.set(f, {
      formation: f,
      wins: 0,
      losses: 0,
      total: 0,
      winRate: 0,
      vsEnemyFormations: {},
    });
  }

  for (const row of rows) {
    const af = row.allied_formation;
    if (!af || !formations.includes(af)) continue;

    const stat = statMap.get(af)!;
    const cnt = Number(row.cnt);

    if (row.result === "win") stat.wins += cnt;
    else stat.losses += cnt;
    stat.total += cnt;

    const ef = row.enemy_formation;
    if (ef && formations.includes(ef)) {
      if (!stat.vsEnemyFormations[ef]) {
        stat.vsEnemyFormations[ef] = { wins: 0, losses: 0, total: 0, winRate: 0 };
      }
      const vs = stat.vsEnemyFormations[ef];
      if (row.result === "win") vs.wins += cnt;
      else vs.losses += cnt;
      vs.total += cnt;
    }
  }

  // Calculate win rates
  for (const stat of statMap.values()) {
    stat.winRate = calcWinRate(stat.wins, stat.total);
    for (const vs of Object.values(stat.vsEnemyFormations)) {
      vs.winRate = calcWinRate(vs.wins, vs.total);
    }
  }

  return Array.from(statMap.values());
}

// ============================================
// 8. Skill Order Impact
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

  // Resolve hero/skill names
  const heroMap = await getHeroNameMap();
  const heroRows = await db
    .select({
      id: heroes.id,
      skill1Id: heroes.skill1Id,
      skill1Name: heroes.skill1Name,
      skill2Id: heroes.skill2Id,
      skill2Name: heroes.skill2Name,
      skill3Id: heroes.skill3Id,
      skill3Name: heroes.skill3Name,
    })
    .from(heroes);

  const skillNameMap = new Map<string, string>();
  for (const h of heroRows) {
    if (h.skill1Id) skillNameMap.set(h.skill1Id, h.skill1Name);
    if (h.skill2Id) skillNameMap.set(h.skill2Id, h.skill2Name);
    if (h.skill3Id) skillNameMap.set(h.skill3Id, h.skill3Name);
  }

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
        skillName: skillNameMap.get(entry.skillId) ?? entry.skillId.slice(0, 8),
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

  // Fetch raw battle data for speed
  const rows = await db.execute<{
    allied_speed: string | null;
    enemy_speed: string | null;
    first_turn: boolean | null;
    result: string;
  }>(sql`
    SELECT
      (${battles.alliedTeam}->>'speed')::int AS allied_speed,
      (${battles.enemyTeam}->>'speed')::int AS enemy_speed,
      ${battles.firstTurn} AS first_turn,
      ${battles.result} AS result
    FROM ${battles}
    WHERE ${battles.guildId} = ${guildId} AND ${battles.date} >= ${cutoff}
  `);

  // Speed brackets (50-point intervals)
  const bracketMap = new Map<number, { wins: number; total: number }>();
  const scatterData: SpeedDataPoint[] = [];

  let alliedFirstWins = 0,
    alliedFirstTotal = 0,
    enemyFirstWins = 0,
    enemyFirstTotal = 0;

  for (const row of rows) {
    const alliedSpeed = row.allied_speed != null ? Number(row.allied_speed) : null;
    const enemySpeed = row.enemy_speed != null ? Number(row.enemy_speed) : null;
    const isWin = row.result === "win";

    // Speed brackets
    if (alliedSpeed != null && alliedSpeed > 0) {
      const bracket = Math.floor(alliedSpeed / 50) * 50;
      const entry = bracketMap.get(bracket) ?? { wins: 0, total: 0 };
      entry.total++;
      if (isWin) entry.wins++;
      bracketMap.set(bracket, entry);
    }

    // Scatter data
    if (alliedSpeed != null && enemySpeed != null && alliedSpeed > 0 && enemySpeed > 0) {
      scatterData.push({
        alliedSpeed,
        enemySpeed,
        result: row.result,
        speedDiff: alliedSpeed - enemySpeed,
      });
    }

    // First turn analysis
    if (row.first_turn === true) {
      alliedFirstTotal++;
      if (isWin) alliedFirstWins++;
    } else if (row.first_turn === false) {
      enemyFirstTotal++;
      if (isWin) enemyFirstWins++;
    }
  }

  const speedBrackets = Array.from(bracketMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([min, { wins, total }]) => ({
      minSpeed: min,
      maxSpeed: min + 49,
      wins,
      total,
      winRate: calcWinRate(wins, total),
    }));

  const alliedFirstWinRate = calcWinRate(alliedFirstWins, alliedFirstTotal);
  const enemyFirstWinRate = calcWinRate(enemyFirstWins, enemyFirstTotal);

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
    speedVsResult: scatterData.slice(0, 200),
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

  // Current period
  const currentRows = await db.execute<{
    member_id: string;
    member_ign: string;
    total: string;
    wins: string;
    attack_total: string;
    attack_wins: string;
    defense_total: string;
    defense_wins: string;
    fav_formation: string | null;
  }>(sql`
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
        SELECT b2.allied_team->>'formation'
        FROM battles b2
        WHERE b2.member_id = m.id AND b2.guild_id = ${guildId} AND b2.date >= ${cutoff}
        GROUP BY b2.allied_team->>'formation'
        ORDER BY count(*) DESC
        LIMIT 1
      ) AS fav_formation
    FROM members m
    LEFT JOIN battles b ON b.member_id = m.id AND b.guild_id = ${guildId} AND b.date >= ${cutoff}
    WHERE m.guild_id = ${guildId} AND m.is_active = true
    GROUP BY m.id, m.ign
    ORDER BY count(b.id) DESC
  `);

  // Previous period for trend
  const prevRows = await db.execute<{
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
    WHERE m.guild_id = ${guildId} AND m.is_active = true
    GROUP BY m.id
  `);

  const prevMap = new Map(
    prevRows.map((r) => [
      r.member_id,
      calcWinRate(Number(r.wins), Number(r.total)),
    ]),
  );

  return currentRows.map((r) => {
    const total = Number(r.total);
    const wins = Number(r.wins);
    const currentWR = calcWinRate(wins, total);
    const prevWR = prevMap.get(r.member_id) ?? 0;
    const prevTotal = prevRows.find((p) => p.member_id === r.member_id);

    let trend: "improving" | "stable" | "declining" = "stable";
    if (total > 0 && prevTotal && Number(prevTotal.total) > 0) {
      if (currentWR > prevWR + 5) trend = "improving";
      else if (currentWR < prevWR - 5) trend = "declining";
    }

    const attackTotal = Number(r.attack_total);
    const attackWins = Number(r.attack_wins);
    const defenseTotal = Number(r.defense_total);
    const defenseWins = Number(r.defense_wins);

    return {
      memberId: r.member_id,
      ign: r.member_ign,
      totalBattles: total,
      wins,
      losses: total - wins,
      winRate: currentWR,
      attackBattles: attackTotal,
      attackWinRate: calcWinRate(attackWins, attackTotal),
      defenseBattles: defenseTotal,
      defenseWinRate: calcWinRate(defenseWins, defenseTotal),
      favoriteFormation: r.fav_formation,
      recentTrend: trend,
    };
  });
}

// ============================================
// 12. Enemy Compositions
// ============================================

export async function getEnemyCompositions(
  guildId: string,
  days: number = 30,
): Promise<EnemyComposition[]> {
  const cutoff = getDateCutoff(days);

  const rows = await db
    .select({
      alliedTeam: battles.alliedTeam,
      enemyTeam: battles.enemyTeam,
      result: battles.result,
    })
    .from(battles)
    .where(and(eq(battles.guildId, guildId), gte(battles.date, cutoff)));

  const heroMap = await getHeroNameMap();

  // Group by enemy composition
  const compMap = new Map<
    string,
    {
      heroIds: string[];
      formation: string | null;
      wins: number;
      losses: number;
      counters: Map<string, { heroIds: string[]; formation: string | null; wins: number; total: number }>;
    }
  >();

  for (const row of rows) {
    const enemy = row.enemyTeam as { heroes?: { heroId: string }[]; formation?: string };
    const allied = row.alliedTeam as { heroes?: { heroId: string }[]; formation?: string };
    const enemyHeroIds = (enemy.heroes ?? []).map((h) => h.heroId);
    if (enemyHeroIds.length === 0) continue;

    const key = compositionId(enemyHeroIds);
    if (!compMap.has(key)) {
      compMap.set(key, {
        heroIds: [...enemyHeroIds].sort(),
        formation: enemy.formation ?? null,
        wins: 0,
        losses: 0,
        counters: new Map(),
      });
    }
    const comp = compMap.get(key)!;

    if (row.result === "win") comp.wins++;
    else comp.losses++;

    // Track allied team as counter
    if (row.result === "win") {
      const alliedHeroIds = (allied.heroes ?? []).map((h) => h.heroId);
      if (alliedHeroIds.length > 0) {
        const counterKey = compositionId(alliedHeroIds) + "|" + (allied.formation ?? "");
        if (!comp.counters.has(counterKey)) {
          comp.counters.set(counterKey, {
            heroIds: [...alliedHeroIds].sort(),
            formation: allied.formation ?? null,
            wins: 0,
            total: 0,
          });
        }
        const counter = comp.counters.get(counterKey)!;
        counter.wins++;
        counter.total++;
      }
    }
  }

  return Array.from(compMap.values())
    .map((comp) => {
      const seenCount = comp.wins + comp.losses;
      return {
        compositionId: compositionId(comp.heroIds),
        heroIds: comp.heroIds,
        heroNames: comp.heroIds.map((id) => heroMap.get(id) ?? id.slice(0, 8)),
        formation: comp.formation,
        seenCount,
        winAgainst: comp.wins,
        lossAgainst: comp.losses,
        winRate: calcWinRate(comp.wins, seenCount),
        topCounters: Array.from(comp.counters.values())
          .filter((c) => c.total >= 2)
          .sort((a, b) => calcWinRate(b.wins, b.total) - calcWinRate(a.wins, a.total))
          .slice(0, 5)
          .map((c) => ({
            heroIds: c.heroIds,
            heroNames: c.heroIds.map((id) => heroMap.get(id) ?? id.slice(0, 8)),
            formation: c.formation,
            wins: c.wins,
            total: c.total,
            winRate: calcWinRate(c.wins, c.total),
          })),
      };
    })
    .filter((c) => c.seenCount >= 2)
    .sort((a, b) => b.seenCount - a.seenCount)
    .slice(0, 50);
}

// ============================================
// 13. Counter Recommendations
// ============================================

export async function getCounterRecommendations(
  guildId: string,
  enemyHeroIds: string[],
  enemyFormation: string | null,
  days: number = 90,
): Promise<CounterRecommendationResult> {
  const cutoff = getDateCutoff(days);
  const targetKey = compositionId(enemyHeroIds);
  const targetSet = new Set(enemyHeroIds);

  const rows = await db
    .select({
      alliedTeam: battles.alliedTeam,
      enemyTeam: battles.enemyTeam,
      result: battles.result,
    })
    .from(battles)
    .where(and(eq(battles.guildId, guildId), gte(battles.date, cutoff)));

  const heroMap = await getHeroNameMap();

  let exactMatch: EnemyComposition | null = null;
  const similarMap = new Map<string, {
    heroIds: string[];
    formation: string | null;
    wins: number;
    losses: number;
    overlap: number;
  }>();
  const counterMap = new Map<string, {
    heroIds: string[];
    formation: string | null;
    wins: number;
    total: number;
  }>();

  for (const row of rows) {
    const enemy = row.enemyTeam as { heroes?: { heroId: string }[]; formation?: string };
    const allied = row.alliedTeam as { heroes?: { heroId: string }[]; formation?: string };
    const eHeroIds = (enemy.heroes ?? []).map((h) => h.heroId);
    if (eHeroIds.length === 0) continue;

    const eKey = compositionId(eHeroIds);
    const isExact = eKey === targetKey;
    const overlap = eHeroIds.filter((id) => targetSet.has(id)).length;
    const isWin = row.result === "win";

    if (isExact) {
      if (!exactMatch) {
        exactMatch = {
          compositionId: eKey,
          heroIds: [...eHeroIds].sort(),
          heroNames: [],
          formation: enemy.formation ?? null,
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
        similarMap.set(eKey, {
          heroIds: [...eHeroIds].sort(),
          formation: enemy.formation ?? null,
          wins: 0,
          losses: 0,
          overlap,
        });
      }
      const sim = similarMap.get(eKey)!;
      if (isWin) sim.wins++;
      else sim.losses++;
    }

    // Track winning allied teams as counters (for exact + similar)
    if (isWin && (isExact || overlap >= 3)) {
      const aHeroIds = (allied.heroes ?? []).map((h) => h.heroId);
      if (aHeroIds.length > 0) {
        const counterKey = compositionId(aHeroIds) + "|" + (allied.formation ?? "");
        if (!counterMap.has(counterKey)) {
          counterMap.set(counterKey, {
            heroIds: [...aHeroIds].sort(),
            formation: allied.formation ?? null,
            wins: 0,
            total: 0,
          });
        }
        counterMap.get(counterKey)!.wins++;
        counterMap.get(counterKey)!.total++;
      }
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
      formation: s.formation,
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
      formation: c.formation,
      wins: c.wins,
      total: c.total,
      winRate: calcWinRate(c.wins, c.total),
    }));

  return { exactMatch, similarCompositions, recommendedCounters };
}
