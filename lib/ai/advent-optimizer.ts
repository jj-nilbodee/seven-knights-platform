/**
 * Advent Expedition Boss Assignment Optimizer.
 *
 * Greedy algorithm to determine optimal boss assignments for guild members
 * to minimize the number of days required to defeat all 4 bosses (100M HP each).
 *
 * Ported from Python: seven-knights-guild-tracker/backend/app/services/advent_optimizer.py
 */

export const BOSS_MAX_HP = 100_000_000; // 100M HP per boss
export const BOSSES = ["teo", "yeonhee", "kyle", "karma"] as const;
export type BossId = (typeof BOSSES)[number];

// ── Types ──────────────────────────────────────

export interface MemberDamage {
  memberId: string;
  memberIgn: string;
  memberNickname: string;
  scores: Record<string, number>; // bossId -> damage
}

export interface DailyMemberAssignment {
  memberId: string;
  memberIgn: string;
  memberNickname: string;
  boss: string;
}

export interface DateDayPlan {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  assignments: DailyMemberAssignment[];
  bossHpAfter: Record<string, number>;
  bossesKilledToday: string[];
}

export interface DailyPlanResult {
  estimatedDays: number;
  targetDay: number;
  targetMet: boolean;
  warningMessage: string | null;
  dailyPlans: DateDayPlan[];
  summary: Record<string, number>; // boss -> day number when killed
  totalEntriesPerBoss: Record<string, number>;
  totalMembers: number;
  membersWithScores: number;
  membersWithoutScores: { memberId: string; memberIgn: string }[];
  generatedAt: string;
}

// ── Helpers ────────────────────────────────────

function getDamage(member: MemberDamage, boss: string): number {
  return member.scores[boss] ?? 0;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateLte(a: string, b: string): boolean {
  return a <= b;
}

// ── Main Optimizer ─────────────────────────────

export function optimizeDailyPlan(opts: {
  members: MemberDamage[];
  startDate?: string; // YYYY-MM-DD, defaults to today
  endDate?: string; // YYYY-MM-DD, defaults to startDate + 13
  targetDay?: number; // goal to finish by this day, default 9
  memberAvailability?: Record<string, string>; // memberId -> available-from date
  initialHp?: Record<string, number>; // boss -> HP
}): DailyPlanResult {
  const {
    members,
    targetDay = 9,
    memberAvailability: avail,
    initialHp,
  } = opts;

  const today = new Date().toISOString().slice(0, 10);
  const startDate = opts.startDate ?? today;
  const endDate = opts.endDate ?? addDays(startDate, 13);

  // Initialize boss HP
  const bossHp: Record<string, number> = {};
  for (const boss of BOSSES) {
    bossHp[boss] = initialHp?.[boss] ?? BOSS_MAX_HP;
  }

  // Default availability: all members from start date
  const memberAvailability: Record<string, string> = {};
  for (const m of members) {
    memberAvailability[m.memberId] = avail?.[m.memberId] ?? startDate;
  }

  const dailyPlans: DateDayPlan[] = [];
  const summary: Record<string, number> = {}; // boss -> day killed
  const totalEntriesPerBoss: Record<string, number> = {};
  for (const boss of BOSSES) {
    totalEntriesPerBoss[boss] = 0;
  }

  // Track members without scores
  const membersWithScores = members.filter((m) =>
    BOSSES.some((b) => getDamage(m, b) > 0),
  );
  const membersWithoutScores = members
    .filter((m) => !BOSSES.some((b) => getDamage(m, b) > 0))
    .map((m) => ({ memberId: m.memberId, memberIgn: m.memberIgn }));

  let currentDate = startDate;
  let dayNumber = 0;

  while (dateLte(currentDate, endDate)) {
    dayNumber++;

    // Get alive bosses
    const aliveBosses = BOSSES.filter((boss) => bossHp[boss] > 0);
    if (aliveBosses.length === 0) break;

    // Get available members for this date
    const availableMembers = members.filter(
      (m) =>
        dateLte(memberAvailability[m.memberId] ?? startDate, currentDate) &&
        BOSSES.some((b) => getDamage(m, b) > 0),
    );

    if (availableMembers.length === 0) {
      dailyPlans.push({
        date: currentDate,
        dayNumber,
        assignments: [],
        bossHpAfter: { ...bossHp },
        bossesKilledToday: [],
      });
      currentDate = addDays(currentDate, 1);
      continue;
    }

    // Track damage dealt today
    const damageToday: Record<string, number> = {};
    for (const boss of BOSSES) {
      damageToday[boss] = 0;
    }
    const dayAssignments: DailyMemberAssignment[] = [];

    // Assign each available member to their best alive boss
    for (const member of availableMembers) {
      let bestBoss: string | null = null;
      let bestDamage = 0;

      for (const boss of aliveBosses) {
        // Skip if boss will already be dead after today's assignments
        if (bossHp[boss] - damageToday[boss] <= 0) continue;

        const damage = getDamage(member, boss);
        if (damage > bestDamage) {
          bestDamage = damage;
          bestBoss = boss;
        }
      }

      // Fallback: assign to any alive boss where member can do damage
      if (bestBoss === null) {
        for (const boss of aliveBosses) {
          if (getDamage(member, boss) > 0) {
            bestBoss = boss;
            break;
          }
        }
      }

      if (bestBoss) {
        const damage = getDamage(member, bestBoss);
        damageToday[bestBoss] += damage;
        totalEntriesPerBoss[bestBoss]++;

        dayAssignments.push({
          memberId: member.memberId,
          memberIgn: member.memberIgn,
          memberNickname: member.memberNickname,
          boss: bestBoss,
        });
      }
    }

    // Apply damage and check for kills
    const bossesKilledToday: string[] = [];
    for (const boss of aliveBosses) {
      bossHp[boss] -= damageToday[boss];
      if (bossHp[boss] <= 0 && !(boss in summary)) {
        bossesKilledToday.push(boss);
        summary[boss] = dayNumber;
      }
    }

    dailyPlans.push({
      date: currentDate,
      dayNumber,
      assignments: dayAssignments,
      bossHpAfter: { ...bossHp },
      bossesKilledToday,
    });

    currentDate = addDays(currentDate, 1);
  }

  // Determine estimated completion day
  let estimatedDays: number;
  const allDead = Object.values(bossHp).every((hp) => hp <= 0);

  if (allDead) {
    estimatedDays =
      Object.keys(summary).length > 0
        ? Math.max(...Object.values(summary))
        : dayNumber;
  } else {
    // Estimate based on remaining HP and average daily damage
    const remainingHp = Object.values(bossHp).reduce(
      (sum, hp) => sum + Math.max(0, hp),
      0,
    );

    if (dailyPlans.length > 0) {
      let totalDamageAllDays = 0;
      for (const plan of dailyPlans) {
        for (const assignment of plan.assignments) {
          const member = members.find(
            (m) => m.memberId === assignment.memberId,
          );
          if (member) {
            totalDamageAllDays += getDamage(member, assignment.boss);
          }
        }
      }
      const avgDailyDamage = totalDamageAllDays / dailyPlans.length;
      if (avgDailyDamage > 0) {
        estimatedDays =
          dayNumber + Math.ceil(remainingHp / avgDailyDamage);
      } else {
        estimatedDays = 30;
      }
    } else {
      estimatedDays = 30;
    }
  }

  // Check target
  const targetMet = estimatedDays <= targetDay;
  let warningMessage: string | null = null;

  if (!targetMet) {
    warningMessage =
      `ไม่สามารถจบภายในวันที่ ${targetDay} ได้ ` +
      `คาดว่าจะจบในวันที่ ${estimatedDays} ` +
      `ดาเมจรวมต่อวันไม่เพียงพอ`;
  }

  return {
    estimatedDays,
    targetDay,
    targetMet,
    warningMessage,
    dailyPlans,
    summary,
    totalEntriesPerBoss,
    totalMembers: members.length,
    membersWithScores: membersWithScores.length,
    membersWithoutScores,
    generatedAt: new Date().toISOString(),
  };
}
