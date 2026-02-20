import { requireAdmin } from "@/lib/auth";
import { listHeroes } from "@/lib/db/queries/heroes";
import { HeroesAdmin } from "./heroes-admin";

export default async function AdminHeroesPage() {
  await requireAdmin();
  const heroes = await listHeroes();

  return <HeroesAdmin initialHeroes={heroes} />;
}
