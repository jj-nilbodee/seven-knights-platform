import { requireUser, resolveGuildId } from "@/lib/auth";
import { getActiveCycle } from "@/lib/db/queries/advent";
import { PlanClient } from "./plan-client";

export default async function AdventPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ guildId?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const guildId = resolveGuildId(user, params);

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

  const cycle = await getActiveCycle(guildId);

  return <PlanClient cycle={cycle} userRole={user.role} />;
}
