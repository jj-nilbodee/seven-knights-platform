import { requireOfficer } from "@/lib/auth";
import { listAccessRequests, getAccessStats } from "@/lib/db/queries/access";
import { AccessRequestsClient } from "./access-client";

export default async function AccessRequestsPage() {
  const user = await requireOfficer();

  if (!user.guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

  const [requests, stats] = await Promise.all([
    listAccessRequests(user.guildId),
    getAccessStats(user.guildId),
  ]);

  return <AccessRequestsClient initialRequests={requests} stats={stats} />;
}
