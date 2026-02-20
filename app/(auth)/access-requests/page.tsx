import { requireOfficer, resolveGuildId } from "@/lib/auth";
import { listAccessRequests, getAccessStats } from "@/lib/db/queries/access";
import { AccessRequestsClient } from "./access-client";

export default async function AccessRequestsPage({
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

  const [requests, stats] = await Promise.all([
    listAccessRequests(guildId),
    getAccessStats(guildId),
  ]);

  return <AccessRequestsClient initialRequests={requests} stats={stats} />;
}
