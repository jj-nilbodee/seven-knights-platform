import { requireOfficer, resolveGuildId } from "@/lib/auth";
import { listMembers, getMemberStats } from "@/lib/db/queries/members";
import { RosterClient } from "./roster-client";

export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ guildId?: string }>;
}) {
  const user = await requireOfficer();
  const params = await searchParams;
  const guildId = resolveGuildId(user, params);

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

  const [members, stats] = await Promise.all([
    listMembers(guildId, true),
    getMemberStats(guildId),
  ]);

  return <RosterClient initialMembers={members} stats={stats} guildId={guildId} />;
}
