import { db } from "@/lib/db";
import { memberAccess, users } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function listAccessRequests(
  guildId: string,
  status?: string,
) {
  const conditions = [eq(memberAccess.guildId, guildId)];
  if (status && status !== "all") {
    conditions.push(eq(memberAccess.status, status));
  }

  return db
    .select({
      id: memberAccess.id,
      userId: memberAccess.userId,
      guildId: memberAccess.guildId,
      status: memberAccess.status,
      requestedAt: memberAccess.requestedAt,
      reviewedAt: memberAccess.reviewedAt,
      reviewedBy: memberAccess.reviewedBy,
      email: users.email,
      username: users.username,
    })
    .from(memberAccess)
    .innerJoin(users, eq(memberAccess.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(memberAccess.requestedAt));
}

export async function getAccessStats(guildId: string) {
  const rows = await db
    .select({
      status: memberAccess.status,
      count: sql<number>`count(*)::int`,
    })
    .from(memberAccess)
    .where(eq(memberAccess.guildId, guildId))
    .groupBy(memberAccess.status);

  const counts = Object.fromEntries(rows.map((r) => [r.status, r.count]));
  return {
    total: (counts.pending ?? 0) + (counts.approved ?? 0) + (counts.rejected ?? 0),
    pending: counts.pending ?? 0,
    approved: counts.approved ?? 0,
    rejected: counts.rejected ?? 0,
  };
}

export async function createAccessRequest(userId: string, guildId: string) {
  const [row] = await db
    .insert(memberAccess)
    .values({ userId, guildId })
    .returning();
  return row;
}

export async function getAccessRequestById(id: string) {
  const [row] = await db
    .select()
    .from(memberAccess)
    .where(eq(memberAccess.id, id));
  return row ?? null;
}

export async function updateAccessStatus(
  id: string,
  status: "approved" | "rejected",
  reviewedBy: string,
) {
  const [row] = await db
    .update(memberAccess)
    .set({ status, reviewedAt: new Date(), reviewedBy })
    .where(eq(memberAccess.id, id))
    .returning();
  return row ?? null;
}

