import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import type { MemberCreate, MemberUpdate } from "@/lib/validations/member";

export async function listMembers(guildId: string, includeInactive = false) {
  const conditions = [eq(members.guildId, guildId)];
  if (!includeInactive) {
    conditions.push(eq(members.isActive, true));
  }

  return db
    .select()
    .from(members)
    .where(and(...conditions))
    .orderBy(asc(members.ign));
}

export async function getMemberById(id: string) {
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, id));
  return member ?? null;
}

export async function createMember(data: MemberCreate) {
  const [member] = await db.insert(members).values(data).returning();
  return member;
}

export async function updateMember(id: string, data: MemberUpdate) {
  const [member] = await db
    .update(members)
    .set(data)
    .where(eq(members.id, id))
    .returning();
  return member ?? null;
}

export async function bulkCreateMembers(
  guildId: string,
  entries: { ign: string; nickname: string }[],
) {
  // Check existing IGNs for this guild
  const existing = await db
    .select({ ign: members.ign })
    .from(members)
    .where(eq(members.guildId, guildId));

  const existingIgns = new Set(existing.map((r) => r.ign));
  const newEntries = entries.filter((e) => !existingIgns.has(e.ign));

  if (newEntries.length === 0) {
    return { added: 0, skipped: entries.length };
  }

  const rows = newEntries.map((e) => ({
    guildId,
    ign: e.ign,
    nickname: e.nickname,
  }));

  await db.insert(members).values(rows);

  return { added: newEntries.length, skipped: entries.length - newEntries.length };
}

export async function getMemberStats(guildId: string) {
  const all = await db
    .select({ status: members.status, isActive: members.isActive })
    .from(members)
    .where(eq(members.guildId, guildId));

  return {
    total: all.length,
    active: all.filter((m) => m.status === "active").length,
    warning: all.filter((m) => m.status === "warning").length,
    inactive: all.filter((m) => m.status === "inactive").length,
  };
}
