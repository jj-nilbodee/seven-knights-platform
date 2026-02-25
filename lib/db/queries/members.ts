import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
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
  entries: { ign: string }[],
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
  }));

  await db.insert(members).values(rows);

  return { added: newEntries.length, skipped: entries.length - newEntries.length };
}

export async function getMemberStats(guildId: string) {
  const rows = await db
    .select({
      status: members.status,
      count: sql<number>`count(*)::int`,
    })
    .from(members)
    .where(eq(members.guildId, guildId))
    .groupBy(members.status);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    if (row.status) counts[row.status] = row.count;
    total += row.count;
  }

  return {
    total,
    active: counts["active"] ?? 0,
    warning: counts["warning"] ?? 0,
    inactive: counts["inactive"] ?? 0,
  };
}
