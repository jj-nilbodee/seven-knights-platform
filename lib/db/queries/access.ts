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
    .select({ status: memberAccess.status })
    .from(memberAccess)
    .where(eq(memberAccess.guildId, guildId));

  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
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

