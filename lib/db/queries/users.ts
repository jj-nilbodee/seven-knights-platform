import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";

export async function getUserFromDb(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

export async function listGuildMembers(guildId: string) {
  return db
    .select({
      userId: users.id,
      email: users.email,
    })
    .from(users)
    .where(and(eq(users.guildId, guildId), eq(users.role, "member")));
}

export async function listGuildOfficers(guildId: string) {
  return db
    .select({
      userId: users.id,
      email: users.email,
    })
    .from(users)
    .where(and(eq(users.guildId, guildId), eq(users.role, "officer")));
}

export async function listAllUsersFromDb() {
  return db
    .select({
      userId: users.id,
      email: users.email,
      role: users.role,
      guildId: users.guildId,
      displayName: users.displayName,
      createdAt: users.createdAt,
    })
    .from(users);
}

export async function listUnassignedUsers() {
  return db
    .select({
      userId: users.id,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(isNull(users.guildId), ne(users.role, "admin")));
}

export async function updateUserFields(
  id: string,
  fields: {
    role?: string;
    guildId?: string | null;
    accessStatus?: string | null;
  },
) {
  const [updated] = await db
    .update(users)
    .set(fields)
    .where(eq(users.id, id))
    .returning();
  return updated ?? null;
}
