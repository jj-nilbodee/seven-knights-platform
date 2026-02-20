import { requireAdmin } from "@/lib/auth";
import { listHeroes } from "@/lib/db/queries/heroes";
import { GuideForm } from "../guide-form";

export default async function NewGuidePage() {
  await requireAdmin();
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
          สร้างคู่มือใหม่
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          เพิ่มคู่มือทีมโจมตีสำหรับ GVG
        </p>
      </div>
      <GuideForm heroes={heroData} />
    </div>
  );
}
