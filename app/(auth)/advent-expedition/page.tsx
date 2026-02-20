import { requireUser } from "@/lib/auth";
import {
  listCycles,
  listProfiles,
  getActiveCycle,
  getAdventStats,
} from "@/lib/db/queries/advent";
import { listMembers } from "@/lib/db/queries/members";
import { AdventDashboardClient } from "./advent-dashboard-client";

export default async function AdventExpeditionPage() {
  const user = await requireUser();

  if (!user.guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

  const activeCycle = await getActiveCycle(user.guildId);

  const [cycles, profiles, stats, members] = await Promise.all([
    listCycles(user.guildId, 5),
    listProfiles(user.guildId, activeCycle?.id),
    getAdventStats(user.guildId, activeCycle?.id),
    listMembers(user.guildId),
  ]);

  return (
    <AdventDashboardClient
      cycles={cycles}
      activeCycle={activeCycle}
      profiles={profiles}
      stats={stats}
      members={members}
      userRole={user.role}
    />
  );
}
