import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { listHeroes } from "@/lib/db/queries/heroes";
import { getGuideById } from "@/lib/db/queries/gvg-guides";
import { GuideForm } from "../../guide-form";

export default async function EditGuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const guide = await getGuideById(id);

  if (!guide) notFound();

  const heroes = await listHeroes({ isActive: true });

  const heroData = heroes.map((h) => ({
    id: h.id,
    name: h.name,
    imageUrl: h.imageUrl,
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          แก้ไขคู่มือ
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          อัปเดต {guide.title}
        </p>
      </div>
      <GuideForm heroes={heroData} guide={guide} />
    </div>
  );
}
