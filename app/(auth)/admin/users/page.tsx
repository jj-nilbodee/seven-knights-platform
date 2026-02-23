import { requireAdmin } from "@/lib/auth";
import { listGuilds } from "@/lib/db/queries/guilds";
import { fetchAllUsers } from "@/actions/guilds";
import { UsersAdmin } from "./users-admin";

export default async function AdminUsersPage() {
  await requireAdmin();
  const [users, guilds] = await Promise.all([fetchAllUsers(), listGuilds()]);

  return <UsersAdmin users={users} guilds={guilds} />;
}
