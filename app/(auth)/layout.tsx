import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AuthProvider initialUser={user}>
      <div className="flex h-screen overflow-hidden bg-bg-void">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
