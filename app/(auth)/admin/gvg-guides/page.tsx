import { requireAdmin } from "@/lib/auth";
import { searchGuides } from "@/lib/db/queries/gvg-guides";
import { listHeroes } from "@/lib/db/queries/heroes";
import { GvgGuidesAdmin } from "./gvg-guides-admin";

export default async function AdminGvgGuidesPage() {
  await requireAdmin();
  const [guides, allHeroes] = await Promise.all([
    searchGuides(),
    listHeroes({ isActive: true }),
  ]);

  const heroes = allHeroes.map((h) => ({
    id: h.id,
    name: h.name,
    imageUrl: h.imageUrl,
  }));

  return <GvgGuidesAdmin initialGuides={guides} heroes={heroes} />;
}
