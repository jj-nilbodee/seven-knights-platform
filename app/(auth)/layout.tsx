import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { listGuilds } from "@/lib/db/queries/guilds";

function SidebarSkeleton() {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-border-dim bg-bg-surface">
      <div className="flex h-14 items-center border-b border-border-dim px-4">
        <span className="font-display text-lg font-bold text-text-primary tracking-tight">
          7K Platform
        </span>
      </div>
      <div className="flex-1 px-2 py-3 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-bg-elevated animate-pulse" />
        ))}
      </div>
    </aside>
  );
}

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
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar user={user} guilds={guilds} />
      </Suspense>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
