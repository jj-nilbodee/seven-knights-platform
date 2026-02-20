import { db } from "@/lib/db";
import { adventCycles, adventProfiles, members } from "@/lib/db/schema";
import { eq, and, desc, sql, ne } from "drizzle-orm";
import type { CycleCreate, CycleUpdate } from "@/lib/validations/advent";

// ── Cycles ─────────────────────────────────────

export async function listCycles(guildId: string, limit = 20) {
  return db
    .select()
    .from(adventCycles)
    .where(eq(adventCycles.guildId, guildId))
    .orderBy(desc(adventCycles.createdAt))
    .limit(limit);
}

export async function getCycleById(id: string) {
  const [row] = await db
    .select()
    .from(adventCycles)
    .where(eq(adventCycles.id, id));
  return row ?? null;
}

export async function getActiveCycle(guildId: string) {
  const [row] = await db
    .select()
    .from(adventCycles)
    .where(
      and(
        eq(adventCycles.guildId, guildId),
        ne(adventCycles.status, "completed"),
      ),
    )
    .orderBy(desc(adventCycles.createdAt))
    .limit(1);
  return row ?? null;
}

export async function createCycle(
  guildId: string,
  userId: string,
  data: CycleCreate,
) {
  const [cycle] = await db
    .insert(adventCycles)
    .values({
      guildId,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      targetDay: data.targetDay,
      autoRegenerate: data.autoRegenerate,
      createdByUserId: userId,
    })
    .returning();
  return cycle;
}

export async function updateCycle(id: string, data: CycleUpdate) {
  const values: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name !== undefined) values.name = data.name;
  if (data.status !== undefined) values.status = data.status;
  if (data.startDate !== undefined) values.startDate = data.startDate;
  if (data.endDate !== undefined) values.endDate = data.endDate;
  if (data.targetDay !== undefined) values.targetDay = data.targetDay;
  if (data.autoRegenerate !== undefined)
    values.autoRegenerate = data.autoRegenerate;
  if (data.actualDays !== undefined) values.actualDays = data.actualDays;

  const [cycle] = await db
    .update(adventCycles)
    .set(values)
    .where(eq(adventCycles.id, id))
    .returning();
  return cycle ?? null;
}

export async function saveCyclePlan(
  id: string,
  plan: unknown,
  estimatedDays: number,
) {
  const [cycle] = await db
    .update(adventCycles)
    .set({
      plan,
      estimatedDays,
      status: "planning",
      updatedAt: new Date(),
    })
    .where(eq(adventCycles.id, id))
    .returning();
  return cycle ?? null;
}

export async function deleteCycle(id: string) {
  const [cycle] = await db
    .delete(adventCycles)
    .where(eq(adventCycles.id, id))
    .returning({ id: adventCycles.id });
  return cycle ?? null;
}

// ── Profiles ───────────────────────────────────

export async function listProfiles(guildId: string, cycleId?: string) {
  const conditions = [eq(adventProfiles.guildId, guildId)];
  if (cycleId) {
    conditions.push(eq(adventProfiles.cycleId, cycleId));
  }

  return db
    .select({
      id: adventProfiles.id,
      guildId: adventProfiles.guildId,
      memberId: adventProfiles.memberId,
      memberIgn: adventProfiles.memberIgn,
      scores: adventProfiles.scores,
      cycleId: adventProfiles.cycleId,
      imageUrl: adventProfiles.imageUrl,
      extractionConfidence: adventProfiles.extractionConfidence,
      createdAt: adventProfiles.createdAt,
      updatedAt: adventProfiles.updatedAt,
    })
    .from(adventProfiles)
    .where(and(...conditions))
    .orderBy(adventProfiles.memberIgn);
}

export async function getProfileByIgn(
  guildId: string,
  memberIgn: string,
  cycleId?: string,
) {
  const conditions = [
    eq(adventProfiles.guildId, guildId),
    eq(adventProfiles.memberIgn, memberIgn),
  ];
  if (cycleId) {
    conditions.push(eq(adventProfiles.cycleId, cycleId));
  }

  const [row] = await db
    .select()
    .from(adventProfiles)
    .where(and(...conditions));
  return row ?? null;
}

export async function upsertProfile(data: {
  guildId: string;
  memberId?: string;
  memberIgn: string;
  scores: unknown;
  cycleId?: string;
  imageUrl?: string;
  extractionConfidence?: number;
}) {
  // Try update first
  const existing = await getProfileByIgn(
    data.guildId,
    data.memberIgn,
    data.cycleId,
  );

  if (existing) {
    const [profile] = await db
      .update(adventProfiles)
      .set({
        scores: data.scores,
        memberId: data.memberId ?? existing.memberId,
        imageUrl: data.imageUrl ?? existing.imageUrl,
        extractionConfidence:
          data.extractionConfidence ?? existing.extractionConfidence,
        updatedAt: new Date(),
      })
      .where(eq(adventProfiles.id, existing.id))
      .returning();
    return profile;
  }

  const [profile] = await db
    .insert(adventProfiles)
    .values({
      guildId: data.guildId,
      memberId: data.memberId,
      memberIgn: data.memberIgn,
      scores: data.scores,
      cycleId: data.cycleId,
      imageUrl: data.imageUrl,
      extractionConfidence: data.extractionConfidence,
    })
    .returning();
  return profile;
}

export async function updateProfileScores(
  id: string,
  scores: unknown,
) {
  const [profile] = await db
    .update(adventProfiles)
    .set({ scores, updatedAt: new Date() })
    .where(eq(adventProfiles.id, id))
    .returning();
  return profile ?? null;
}

// ── Stats ──────────────────────────────────────

export async function getAdventStats(guildId: string, cycleId?: string) {
  // Get total active members
  const allMembers = await db
    .select({ id: members.id, ign: members.ign })
    .from(members)
    .where(and(eq(members.guildId, guildId), eq(members.isActive, true)));

  // Get profiles for this cycle (or latest)
  const profiles = await listProfiles(guildId, cycleId);

  // Calculate per-boss totals
  const bossTotals = { teo: 0, yeonhee: 0, kyle: 0, karma: 0 };
  for (const p of profiles) {
    const scores = p.scores as Record<string, number>;
    bossTotals.teo += scores.teo ?? 0;
    bossTotals.yeonhee += scores.yeonhee ?? 0;
    bossTotals.kyle += scores.kyle ?? 0;
    bossTotals.karma += scores.karma ?? 0;
  }

  const totalDamage = Object.values(bossTotals).reduce((a, b) => a + b, 0);

  return {
    totalMembers: allMembers.length,
    membersWithProfiles: profiles.length,
    membersMissing: Math.max(0, allMembers.length - profiles.length),
    totalDamageCapacity: totalDamage,
    averageDamage: profiles.length > 0 ? Math.round(totalDamage / profiles.length) : 0,
    bossTotals,
  };
}

// ── Public access queries ──────────────────────

export async function getPublicMembers(guildId: string) {
  return db
    .select({ id: members.id, ign: members.ign })
    .from(members)
    .where(and(eq(members.guildId, guildId), eq(members.isActive, true)))
    .orderBy(members.ign);
}

export async function submitPublicScore(data: {
  guildId: string;
  memberId?: string;
  memberIgn: string;
  boss: string;
  score: number;
  cycleId?: string;
}) {
  // Get or create profile, then update the specific boss score
  const existing = await getProfileByIgn(
    data.guildId,
    data.memberIgn,
    data.cycleId,
  );

  const currentScores = (existing?.scores as Record<string, number>) ?? {
    teo: 0,
    yeonhee: 0,
    kyle: 0,
    karma: 0,
  };

  const updatedScores = { ...currentScores, [data.boss]: data.score };

  return upsertProfile({
    guildId: data.guildId,
    memberId: data.memberId,
    memberIgn: data.memberIgn,
    scores: updatedScores,
    cycleId: data.cycleId,
  });
}
