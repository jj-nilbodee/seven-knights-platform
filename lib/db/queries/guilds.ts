import { db } from "@/lib/db";
import { guilds } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
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
