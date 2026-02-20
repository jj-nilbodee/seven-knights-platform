import { requireAdmin } from "@/lib/auth";
import { searchGuides } from "@/lib/db/queries/gvg-guides";
import { GvgGuidesAdmin } from "./gvg-guides-admin";

export default async function AdminGvgGuidesPage() {
  await requireAdmin();
  const guides = await searchGuides();

  return <GvgGuidesAdmin initialGuides={guides} />;
}
