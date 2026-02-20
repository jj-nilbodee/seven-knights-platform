"use server";

import { z } from "zod";
import { requireOfficer } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  cycleCreateSchema,
  cycleUpdateSchema,
  profileUpdateSchema,
  publicSubmissionSchema,
} from "@/lib/validations/advent";
import {
  createCycle as dbCreateCycle,
  updateCycle as dbUpdateCycle,
  deleteCycle as dbDeleteCycle,
  getCycleById,
  getActiveCycle,
  saveCyclePlan,
  updateCycleMemberAvailability,
  listProfiles,
  updateProfileScores,
  upsertProfile,
  submitPublicScore as dbSubmitPublicScore,
} from "@/lib/db/queries/advent";
import { listMembers } from "@/lib/db/queries/members";
import { optimizeDailyPlan, type MemberDamage } from "@/lib/ai/advent-optimizer";

const uuidSchema = z.string().uuid();
const revalidate = () => revalidatePath("/advent-expedition");

// ── Cycles ─────────────────────────────────────

export async function createAdventCycle(data: {
  name: string;
  startDate: string;
  endDate: string;
  targetDay: number;
  autoRegenerate: boolean;
  guildId?: string;
}) {
  const user = await requireOfficer();
  const effectiveGuildId = (user.role === "admin" && data.guildId) ? data.guildId : user.guildId;
  if (!effectiveGuildId) return { error: "คุณยังไม่ได้อยู่ในกิลด์" };

  const parsed = cycleCreateSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Check for existing active cycle
  const existing = await getActiveCycle(effectiveGuildId);
  if (existing) return { error: "มีรอบที่ยังไม่เสร็จอยู่แล้ว กรุณาจบรอบก่อนหน้าก่อน" };

  try {
    const cycle = await dbCreateCycle(effectiveGuildId, user.id, parsed.data);
    revalidate();
    return { success: true, cycleId: cycle.id };
  } catch {
    return { error: "ไม่สามารถสร้างรอบใหม่ได้" };
  }
}

export async function updateAdventCycle(
  id: string,
  data: {
    name?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    targetDay?: number;
    autoRegenerate?: boolean;
    actualDays?: number;
  },
) {
  const user = await requireOfficer();
  if (!uuidSchema.safeParse(id).success) return { error: "ID ไม่ถูกต้อง" };

  const cycle = await getCycleById(id);
  if (!cycle) return { error: "ไม่พบรอบ" };
  if (user.role !== "admin" && cycle.guildId !== user.guildId) return { error: "ไม่มีสิทธิ์" };

  const parsed = cycleUpdateSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await dbUpdateCycle(id, parsed.data);
    revalidate();
    return { success: true };
  } catch {
    return { error: "ไม่สามารถอัปเดตรอบได้" };
  }
}

export async function deleteAdventCycle(id: string) {
  const user = await requireOfficer();
  if (!uuidSchema.safeParse(id).success) return { error: "ID ไม่ถูกต้อง" };

  const cycle = await getCycleById(id);
  if (!cycle) return { error: "ไม่พบรอบ" };
  if (user.role !== "admin" && cycle.guildId !== user.guildId) return { error: "ไม่มีสิทธิ์" };
  if (cycle.status === "active") return { error: "ไม่สามารถลบรอบที่กำลังดำเนินอยู่ได้" };

  try {
    await dbDeleteCycle(id);
    revalidate();
    return { success: true };
  } catch {
    return { error: "ไม่สามารถลบรอบได้" };
  }
}

// ── Plan Generation ────────────────────────────

export async function generatePlan(
  cycleId: string,
  memberAvailability?: Record<string, string>,
) {
  const user = await requireOfficer();

  const cycle = await getCycleById(cycleId);
  if (!cycle) return { error: "ไม่พบรอบ" };
  if (user.role !== "admin" && cycle.guildId !== user.guildId) return { error: "ไม่มีสิทธิ์" };

  // Use the cycle's guildId so admin can generate plans for any guild
  const guildMembers = await listMembers(cycle.guildId);
  const profiles = await listProfiles(cycle.guildId, cycleId);

  // Build MemberDamage array
  const memberDamages: MemberDamage[] = [];
  for (const member of guildMembers) {
    const profile = profiles.find((p) => p.memberIgn === member.ign);
    const scores = (profile?.scores as Record<string, number>) ?? {};

    memberDamages.push({
      memberId: member.id,
      memberIgn: member.ign,
      scores: {
        teo: scores.teo ?? 0,
        yeonhee: scores.yeonhee ?? 0,
        kyle: scores.kyle ?? 0,
        karma: scores.karma ?? 0,
      },
    });
  }

  const bossHp = cycle.bossHp as Record<string, number> | null;

  const result = optimizeDailyPlan({
    members: memberDamages,
    startDate: cycle.startDate ?? undefined,
    endDate: cycle.endDate ?? undefined,
    targetDay: cycle.targetDay ?? 9,
    memberAvailability,
    initialHp: bossHp ?? undefined,
  });

  // Save plan to cycle
  try {
    await saveCyclePlan(cycleId, result, result.estimatedDays);

    // Save member availability if provided
    if (memberAvailability) {
      await updateCycleMemberAvailability(cycleId, memberAvailability);
    }

    revalidate();
    return { success: true, plan: result };
  } catch {
    return { error: "ไม่สามารถสร้างแผนได้" };
  }
}

// ── Profile Management ─────────────────────────

export async function updateMemberProfile(
  profileId: string,
  data: { scores: { teo: number; yeonhee: number; kyle: number; karma: number } },
) {
  await requireOfficer();
  if (!uuidSchema.safeParse(profileId).success) return { error: "ID ไม่ถูกต้อง" };

  const parsed = profileUpdateSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await updateProfileScores(profileId, parsed.data.scores);
    revalidate();
    return { success: true };
  } catch {
    return { error: "ไม่สามารถอัปเดตโปรไฟล์ได้" };
  }
}

export async function createOrUpdateProfile(data: {
  memberIgn: string;
  scores: { teo: number; yeonhee: number; kyle: number; karma: number };
  cycleId?: string;
  guildId?: string;
}) {
  const user = await requireOfficer();
  const effectiveGuildId = (user.role === "admin" && data.guildId) ? data.guildId : user.guildId;
  if (!effectiveGuildId) return { error: "คุณยังไม่ได้อยู่ในกิลด์" };

  try {
    const profile = await upsertProfile({
      guildId: effectiveGuildId,
      memberIgn: data.memberIgn,
      scores: data.scores,
      cycleId: data.cycleId,
    });
    revalidate();
    return { success: true, profileId: profile.id };
  } catch {
    return { error: "ไม่สามารถบันทึกโปรไฟล์ได้" };
  }
}

// ── Public Submission ──────────────────────────

export async function submitAdventScore(data: {
  guildId: string;
  memberIgn: string;
  boss: string;
  score: number;
  cycleId?: string;
}) {
  const parsed = publicSubmissionSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await dbSubmitPublicScore({
      guildId: parsed.data.guildId,
      memberIgn: parsed.data.memberIgn,
      boss: parsed.data.boss,
      score: parsed.data.score,
      cycleId: parsed.data.cycleId,
    });
    return { success: true };
  } catch {
    return { error: "ไม่สามารถบันทึกคะแนนได้" };
  }
}
