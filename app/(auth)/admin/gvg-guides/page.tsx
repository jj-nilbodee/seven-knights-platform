import { requireAdmin } from "@/lib/auth";
import { searchGuides, countGuides } from "@/lib/db/queries/gvg-guides";
import { listHeroes } from "@/lib/db/queries/heroes";
import { GvgGuidesAdmin } from "./gvg-guides-admin";

const PAGE_SIZE = 50;

export default async function AdminGvgGuidesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const status = params.status && params.status !== "all" ? params.status : undefined;
  const search = params.search?.trim() || undefined;

  const filters = { status, search };

  const [guides, totalCount, allHeroes] = await Promise.all([
    searchGuides({
      ...filters,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    countGuides(filters),
    listHeroes({ isActive: true }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const heroes = allHeroes.map((h) => ({
    id: h.id,
    name: h.name,
    imageUrl: h.imageUrl,
  }));

  return (
    <GvgGuidesAdmin
      initialGuides={guides}
      heroes={heroes}
      pagination={{ page, totalPages, totalCount }}
    />
  );
}
