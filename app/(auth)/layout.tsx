import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { listGuilds } from "@/lib/db/queries/guilds";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const guilds = user.role === "admin" ? await listGuilds() : [];

  return (
    <div className="flex h-screen overflow-hidden bg-bg-void">
      <Sidebar user={user} guilds={guilds} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
