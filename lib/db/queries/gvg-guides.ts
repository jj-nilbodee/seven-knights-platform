import { cache } from "react";
import { db } from "@/lib/db";
import { gvgGuides, gvgGuideVersions } from "@/lib/db/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import type { GuideCreate, GuideUpdate } from "@/lib/validations/guide";

export interface GuideSearchFilters {
  defenseHeroes?: string[];
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

function buildWhereConditions(filters: GuideSearchFilters) {
  const conditions = [];

  if (filters.status) {
    conditions.push(eq(gvgGuides.status, filters.status));
  }

  if (filters.defenseHeroes && filters.defenseHeroes.length > 0) {
    conditions.push(
      sql`${gvgGuides.defenseHeroes} @> ARRAY[${sql.join(
        filters.defenseHeroes.map((h) => sql`${h}`),
        sql`,`,
      )}]::TEXT[]`,
    );
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      sql`(
        ${gvgGuides.title} ILIKE ${term}
        OR EXISTS (SELECT 1 FROM unnest(${gvgGuides.defenseHeroes}) h WHERE h ILIKE ${term})
        OR EXISTS (SELECT 1 FROM unnest(${gvgGuides.attackHeroes}) h WHERE h ILIKE ${term})
      )`,
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function searchGuides(filters: GuideSearchFilters = {}) {
  const where = buildWhereConditions(filters);
  const limit = filters.limit ?? 500;
  const offset = filters.offset ?? 0;

  return db
    .select()
    .from(gvgGuides)
    .where(where)
    .orderBy(asc(gvgGuides.attackPriority), desc(gvgGuides.updatedAt))
    .limit(limit)
    .offset(offset);
}

export async function countGuides(filters: GuideSearchFilters = {}) {
  const where = buildWhereConditions(filters);

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gvgGuides)
    .where(where);

  return row?.count ?? 0;
}

export const getGuideById = cache(async (id: string) => {
  const [guide] = await db
    .select()
    .from(gvgGuides)
    .where(eq(gvgGuides.id, id));
  return guide ?? null;
});

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
