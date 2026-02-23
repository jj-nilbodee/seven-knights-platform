import { requireAdmin } from "@/lib/auth";
import { listGuilds } from "@/lib/db/queries/guilds";
import { fetchUnassignedUsers } from "@/actions/guilds";
import { GuildsAdmin } from "./guilds-admin";

export default async function AdminGuildsPage() {
  await requireAdmin();
  const [guilds, unassignedUsers] = await Promise.all([
    listGuilds(),
    fetchUnassignedUsers(),
  ]);

  return (
    <GuildsAdmin initialGuilds={guilds} unassignedUsers={unassignedUsers} />
  );
}
