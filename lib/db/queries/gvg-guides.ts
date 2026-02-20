import { db } from "@/lib/db";
import { gvgGuides, gvgGuideVersions } from "@/lib/db/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import type { GuideCreate, GuideUpdate } from "@/lib/validations/guide";

export interface GuideSearchFilters {
  defenseHeroes?: string[];
  status?: string;
}

export async function searchGuides(filters: GuideSearchFilters = {}) {
  const conditions = [];

  if (filters.status) {
    conditions.push(eq(gvgGuides.status, filters.status));
  }

  if (filters.defenseHeroes && filters.defenseHeroes.length > 0) {
    // PostgreSQL array containment: defense_heroes @> ARRAY[...]
    conditions.push(
      sql`${gvgGuides.defenseHeroes} @> ARRAY[${sql.join(
        filters.defenseHeroes.map((h) => sql`${h}`),
        sql`,`,
      )}]::TEXT[]`,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(gvgGuides)
    .where(where)
    .orderBy(asc(gvgGuides.attackPriority), desc(gvgGuides.updatedAt));
}

export async function getGuideById(id: string) {
  const [guide] = await db
    .select()
    .from(gvgGuides)
    .where(eq(gvgGuides.id, id));
  return guide ?? null;
}

export async function createGuide(
  data: GuideCreate & { createdBy: string },
) {
  const [guide] = await db
    .insert(gvgGuides)
    .values({
      title: data.title,
      defenseHeroes: data.defenseHeroes,
      attackHeroes: data.attackHeroes,
      attackPriority: data.attackPriority,
      attackSkillOrder: data.attackSkillOrder,
      defenseSkillOrder: data.defenseSkillOrder,
      strategyNotes: data.strategyNotes,
      mediaUrls: data.mediaUrls,
      patchVersion: data.patchVersion,
      status: data.status,
      createdBy: data.createdBy,
    })
    .returning();

  return guide;
}

export async function updateGuide(id: string, data: GuideUpdate) {
  const values: Record<string, unknown> = { updatedAt: new Date() };

  if (data.title !== undefined) values.title = data.title;
  if (data.defenseHeroes !== undefined)
    values.defenseHeroes = data.defenseHeroes;
  if (data.attackHeroes !== undefined) values.attackHeroes = data.attackHeroes;
  if (data.attackPriority !== undefined)
    values.attackPriority = data.attackPriority;
  if (data.attackSkillOrder !== undefined)
    values.attackSkillOrder = data.attackSkillOrder;
  if (data.defenseSkillOrder !== undefined)
    values.defenseSkillOrder = data.defenseSkillOrder;
  if (data.strategyNotes !== undefined)
    values.strategyNotes = data.strategyNotes;
  if (data.mediaUrls !== undefined) values.mediaUrls = data.mediaUrls;
  if (data.patchVersion !== undefined) values.patchVersion = data.patchVersion;
  if (data.status !== undefined) values.status = data.status;

  const [guide] = await db
    .update(gvgGuides)
    .set(values)
    .where(eq(gvgGuides.id, id))
    .returning();

  return guide ?? null;
}

export async function deleteGuide(id: string) {
  const [guide] = await db
    .delete(gvgGuides)
    .where(eq(gvgGuides.id, id))
    .returning({ id: gvgGuides.id });

  return guide ?? null;
}

export async function getGuideVersions(guideId: string) {
  return db
    .select()
    .from(gvgGuideVersions)
    .where(eq(gvgGuideVersions.guideId, guideId))
    .orderBy(desc(gvgGuideVersions.version));
}
