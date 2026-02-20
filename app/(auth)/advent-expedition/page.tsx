import { requireUser, resolveGuildId } from "@/lib/auth";
import {
  listCycles,
  listProfiles,
  getActiveCycle,
  getAdventStats,
} from "@/lib/db/queries/advent";
import { listMembers } from "@/lib/db/queries/members";
import { AdventDashboardClient } from "./advent-dashboard-client";

export default async function AdventExpeditionPage({
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

  const activeCycle = await getActiveCycle(guildId);

  const [cycles, profiles, stats, members] = await Promise.all([
    listCycles(guildId, 5),
    listProfiles(guildId, activeCycle?.id),
    getAdventStats(guildId, activeCycle?.id),
    listMembers(guildId),
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
