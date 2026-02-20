import { requireUser } from "@/lib/auth";
import { getActiveCycle } from "@/lib/db/queries/advent";
import { PlanClient } from "./plan-client";

export default async function AdventPlanPage() {
  const user = await requireUser();

  if (!user.guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

  const cycle = await getActiveCycle(user.guildId);

  return <PlanClient cycle={cycle} userRole={user.role} />;
}
