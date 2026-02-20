export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { listHeroes } from "@/lib/db/queries/heroes";
import {
  getGuideById,
  getGuideVersions,
} from "@/lib/db/queries/gvg-guides";
import { GuideDetailView } from "@/components/gvg-guide/guide-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const guide = await getGuideById(id);
  if (!guide) return { title: "ไม่พบคู่มือ" };
  return {
    title: `${guide.title} — GVG Guide`,
    description: guide.strategyNotes?.slice(0, 160) || "GVG Attack Guide",
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const guide = await getGuideById(id);

  if (!guide || guide.status !== "published") {
    notFound();
  }

  const [heroes, versions] = await Promise.all([
    listHeroes({ isActive: true }),
    getGuideVersions(id),
  ]);

  const heroData = heroes.map((h) => ({
    id: h.id,
    name: h.name,
    imageUrl: h.imageUrl,
    skill1ImageUrl: h.skill1ImageUrl,
    skill2ImageUrl: h.skill2ImageUrl,
  }));

  const versionData = versions.map((v) => ({
    id: v.id,
    version: v.version,
    title: v.title,
    createdAt: v.createdAt,
  }));

  return (
    <GuideDetailView
      guide={guide}
      heroes={heroData}
      versions={versionData}
    />
  );
}
