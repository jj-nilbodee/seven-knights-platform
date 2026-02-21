import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { listAccessRequests, getAccessStats } from "@/lib/db/queries/access";
import { AccessRequestsClient } from "./access-client";

export default async function AccessRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ guildId?: string }>;
}) {
  const result = await requireGuild(await searchParams);
  if (!result) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        {NO_GUILD_MESSAGE}
      </div>
    );
  }
  const { guildId } = result;

  const [requests, stats] = await Promise.all([
    listAccessRequests(guildId),
    getAccessStats(guildId),
  ]);

  return <AccessRequestsClient initialRequests={requests} stats={stats} />;
}
