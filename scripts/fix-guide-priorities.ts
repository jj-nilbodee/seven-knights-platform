/**
 * Fix attackPriority values in gvg_guides.
 *
 * The import script set attackPriority to the Excel row number (e.g. 39, 46)
 * instead of a sequential number within each defense group.
 *
 * This script re-numbers them 1, 2, 3... within each defense-hero group,
 * preserving the existing relative order.
 *
 * Usage:
 *   npx tsx scripts/fix-guide-priorities.ts
 *   npx tsx scripts/fix-guide-priorities.ts --dry-run
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { asc, eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const allGuides = await db
    .select({
      id: schema.gvgGuides.id,
      defenseHeroes: schema.gvgGuides.defenseHeroes,
      attackPriority: schema.gvgGuides.attackPriority,
      title: schema.gvgGuides.title,
    })
    .from(schema.gvgGuides)
    .orderBy(asc(schema.gvgGuides.attackPriority));

  // Group by sorted defense heroes
  const groups = new Map<string, typeof allGuides>();
  for (const guide of allGuides) {
    const key = [...guide.defenseHeroes].sort().join(",");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(guide);
  }

  let updated = 0;
  for (const [defKey, guides] of groups) {
    console.log(`\nGroup: ${defKey} (${guides.length} guides)`);

    for (let i = 0; i < guides.length; i++) {
      const guide = guides[i];
      const newPriority = i + 1;

      if (guide.attackPriority === newPriority) {
        console.log(`  ${newPriority}. "${guide.title}" — already correct`);
        continue;
      }

      console.log(
        `  ${guide.attackPriority} → ${newPriority}: "${guide.title}"`,
      );

      if (!dryRun) {
        await db
          .update(schema.gvgGuides)
          .set({ attackPriority: newPriority })
          .where(eq(schema.gvgGuides.id, guide.id));
        updated++;
      }
    }
  }

  console.log(
    `\n${dryRun ? "[DRY RUN] " : ""}Updated ${updated} guides across ${groups.size} groups.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
