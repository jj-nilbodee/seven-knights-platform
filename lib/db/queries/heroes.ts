import { db } from "@/lib/db";
import { heroes } from "@/lib/db/schema";
import { eq, and, sql, asc } from "drizzle-orm";
import type { HeroCreate, HeroUpdate } from "@/lib/validations/hero";

export interface HeroFilters {
  search?: string;
  heroType?: string;
  rarity?: string;
  isActive?: boolean;
}

export async function listHeroes(filters: HeroFilters = {}) {
  const conditions = [];

  if (filters.isActive !== undefined) {
    conditions.push(eq(heroes.isActive, filters.isActive));
  }
  if (filters.heroType) {
    conditions.push(eq(heroes.heroType, filters.heroType));
  }
  if (filters.rarity) {
    conditions.push(eq(heroes.rarity, filters.rarity));
  }
  if (filters.search) {
    // pg_trgm similarity search for Thai names
    conditions.push(sql`${heroes.name} % ${filters.search}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(heroes)
    .where(where)
    .orderBy(asc(heroes.name));

  return rows;
}

export async function getHeroById(id: string) {
  const [hero] = await db.select().from(heroes).where(eq(heroes.id, id));
  return hero ?? null;
}

export async function createHero(data: HeroCreate) {
  const [hero] = await db.insert(heroes).values(data).returning();
  return hero;
}

export async function updateHero(id: string, data: HeroUpdate) {
  const [hero] = await db
    .update(heroes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(heroes.id, id))
    .returning();
  return hero ?? null;
}

export async function deleteHero(id: string) {
  const [hero] = await db
    .delete(heroes)
    .where(eq(heroes.id, id))
    .returning({ id: heroes.id });
  return hero ?? null;
}

export async function bulkCreateHeroes(names: string[]) {
  // Deduplicate
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];

  if (unique.length === 0) return { added: 0, skipped: 0 };

  // Check existing names
  const existing = await db
    .select({ name: heroes.name })
    .from(heroes)
    .where(
      sql`${heroes.name} = ANY(${unique})`,
    );

  const existingNames = new Set(existing.map((r) => r.name));
  const newNames = unique.filter((n) => !existingNames.has(n));

  if (newNames.length === 0) {
    return { added: 0, skipped: unique.length };
  }

  const rows = newNames.map((name) => ({ name }));

  await db.insert(heroes).values(rows);

  return { added: newNames.length, skipped: unique.length - newNames.length };
}
