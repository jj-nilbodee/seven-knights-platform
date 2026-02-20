"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Users,
  Grid3X3,
  Zap,
  Timer,
  Shield,
  Swords,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/guild-war/analytics", label: "ภาพรวม", icon: BarChart3, exact: true },
  { href: "/guild-war/analytics/matchups", label: "แมตช์อัพ", icon: Users },
  { href: "/guild-war/analytics/formations", label: "จัดทัพ", icon: Grid3X3 },
  { href: "/guild-war/analytics/skills", label: "ลำดับสกิล", icon: Zap },
  { href: "/guild-war/analytics/speed", label: "ความเร็ว", icon: Timer },
  { href: "/guild-war/analytics/counter", label: "เคาน์เตอร์", icon: Shield },
  { href: "/guild-war/analytics/enemy-guilds", label: "กิลด์ศัตรู", icon: Swords },
  { href: "/guild-war/analytics/members", label: "สมาชิก", icon: Trophy },
];

export function AnalyticsNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-3">
      <Link
        href="/guild-war"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        สงครามกิลด์
      </Link>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm transition-colors shrink-0",
                isActive
                  ? "border-accent/40 bg-accent/10 text-accent font-medium"
                  : "border-border-default text-text-secondary hover:border-border-bright hover:text-text-primary",
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
