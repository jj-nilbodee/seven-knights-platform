import { requireOfficer } from "@/lib/auth";
import { listMembers, getMemberStats } from "@/lib/db/queries/members";
import { RosterClient } from "./roster-client";

export default async function RosterPage() {
  const user = await requireOfficer();

  if (!user.guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

  const [members, stats] = await Promise.all([
    listMembers(user.guildId, true),
    getMemberStats(user.guildId),
  ]);

  return <RosterClient initialMembers={members} stats={stats} />;
}
