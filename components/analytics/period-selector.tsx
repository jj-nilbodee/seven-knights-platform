"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const periods = [
  { label: "7 วัน", value: 7 },
  { label: "14 วัน", value: 14 },
  { label: "30 วัน", value: 30 },
  { label: "60 วัน", value: 60 },
  { label: "90 วัน", value: 90 },
];

export function PeriodSelector({ currentDays = 30 }: { currentDays?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelect(days: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (days === 30) {
      params.delete("days");
    } else {
      params.set("days", String(days));
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex gap-1.5">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => handleSelect(p.value)}
          className={cn(
            "rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs transition-colors cursor-pointer",
            currentDays === p.value
              ? "border-accent/40 bg-accent/10 text-accent font-medium"
              : "border-border-default text-text-secondary hover:border-border-bright hover:text-text-primary",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
