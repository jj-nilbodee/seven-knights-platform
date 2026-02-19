"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Swords,
  BarChart3,
  Users,
  BookOpen,
  Mountain,
  Castle,
  Shield,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { logout } from "@/actions/auth";

const navItems = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/guild-war", label: "สงครามกิลด์", icon: Swords },
  { href: "/guild-war/analytics", label: "วิเคราะห์", icon: BarChart3 },
  { href: "/roster", label: "สมาชิก", icon: Users },
  { href: "/advent-expedition", label: "Advent", icon: Mountain },
  { href: "/castle-rush", label: "Castle Rush", icon: Castle },
];

const publicNavItems = [
  { href: "/gvg-guides", label: "คู่มือ GVG", icon: BookOpen },
  { href: "/guidelines", label: "แนวทางโจมตี", icon: Shield },
];

const adminItems = [
  { href: "/admin/heroes", label: "จัดการฮีโร่", icon: Settings },
  { href: "/admin/guilds", label: "จัดการกิลด์", icon: Settings },
  { href: "/admin/gvg-guides", label: "จัดการคู่มือ", icon: Settings },
  { href: "/access-requests", label: "คำขอเข้าถึง", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isOfficer = user?.role === "officer" || isAdmin;

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border-dim bg-bg-surface">
      <div className="flex h-14 items-center border-b border-border-dim px-4">
        <Link href="/dashboard" className="font-display text-lg font-bold text-text-primary tracking-tight">
          7K Platform
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <div className="px-2 py-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            กิลด์
          </span>
        </div>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="px-2 pt-4 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            สาธารณะ
          </span>
        </div>
        {publicNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {isOfficer && (
          <>
            <div className="px-2 pt-4 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                ผู้ดูแล
              </span>
            </div>
            {adminItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-border-dim p-3">
        <div className="flex items-center gap-3 px-2 pb-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              {user?.email}
            </p>
            <p className="text-xs text-text-muted capitalize">{user?.role}</p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            ออกจากระบบ
          </button>
        </form>
      </div>
    </aside>
  );
}
