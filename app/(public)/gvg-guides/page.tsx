import { listHeroes } from "@/lib/db/queries/heroes";
import { searchGuides } from "@/lib/db/queries/gvg-guides";
import { GvgGuidesClient } from "./gvg-guides-client";

export const metadata = {
  title: "GVG Attack Guide — Seven Knights Re:Birth",
  description: "ค้นหาทีมป้องกันที่เจอ เพื่อดูคู่มือทีมโจมตีแนะนำพร้อมลำดับสกิล",
};

export default async function GvgGuidesPage() {
  const [heroes, guides] = await Promise.all([
    listHeroes({ isActive: true }),
    searchGuides({ status: "published" }),
  ]);

  // Simplify hero data for the client
  const heroData = heroes.map((h) => ({
    id: h.id,
    name: h.name,
    imageUrl: h.imageUrl,
    skill1ImageUrl: h.skill1ImageUrl,
    skill2ImageUrl: h.skill2ImageUrl,
  }));

  return <GvgGuidesClient heroes={heroData} allGuides={guides} />;
}
