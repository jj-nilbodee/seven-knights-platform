import { db } from "@/lib/db";
import { guilds, officers, users } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import type { GuildCreate, GuildUpdate } from "@/lib/validations/guild";

export async function listGuilds() {
  return db.select().from(guilds).orderBy(asc(guilds.name));
}

export async function getGuildById(id: string) {
  const [guild] = await db.select().from(guilds).where(eq(guilds.id, id));
  return guild ?? null;
}

export async function createGuild(data: GuildCreate) {
  const [guild] = await db.insert(guilds).values(data).returning();
  return guild;
}

export async function updateGuild(id: string, data: GuildUpdate) {
  const [guild] = await db
    .update(guilds)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(guilds.id, id))
    .returning();
  return guild ?? null;
}

export async function deleteGuild(id: string) {
  const [guild] = await db
    .delete(guilds)
    .where(eq(guilds.id, id))
    .returning({ id: guilds.id });
  return guild ?? null;
}

export async function getGuildOfficers(guildId: string) {
  return db
    .select({
      userId: officers.userId,
      email: users.email,
      username: users.username,
      addedAt: officers.addedAt,
    })
    .from(officers)
    .innerJoin(users, eq(officers.userId, users.id))
    .where(eq(officers.guildId, guildId));
}

export async function addOfficer(guildId: string, userId: string) {
  const [row] = await db
    .insert(officers)
    .values({ guildId, userId })
    .returning();
  return row;
}

export async function removeOfficer(guildId: string, userId: string) {
  const [deleted] = await db
    .delete(officers)
    .where(and(eq(officers.guildId, guildId), eq(officers.userId, userId)))
    .returning({ userId: officers.userId });
  return deleted ?? null;
}
