import { requireAdmin } from "@/lib/auth";
import { listGuilds } from "@/lib/db/queries/guilds";
import { GuildsAdmin } from "./guilds-admin";

export default async function AdminGuildsPage() {
  await requireAdmin();
  const guilds = await listGuilds();

  return <GuildsAdmin initialGuilds={guilds} />;
}
