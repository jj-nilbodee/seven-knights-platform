"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STORAGE_KEY = "admin-last-guild";

interface Guild {
  id: string;
  name: string;
}

interface GuildSelectorProps {
  guilds: Guild[];
}

export function GuildSelector({ guilds }: GuildSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fallbackGuildId = guilds[0]?.id ?? "";

  // Resolve default: prefer localStorage, then first guild
  function getDefaultGuildId() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && guilds.some((g) => g.id === stored)) return stored;
    } catch {}
    return fallbackGuildId;
  }

  const urlGuildId = searchParams.get("guildId");
  const defaultGuildId = getDefaultGuildId();
  const currentGuildId = urlGuildId ?? defaultGuildId;

  // On mount, if no ?guildId in URL but localStorage has a non-first guild, redirect to it
  useEffect(() => {
    if (!urlGuildId && defaultGuildId && defaultGuildId !== fallbackGuildId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("guildId", defaultGuildId);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(value: string) {
    // Persist selection
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}

    const params = new URLSearchParams(searchParams.toString());
    if (value === fallbackGuildId) {
      params.delete("guildId");
    } else {
      params.set("guildId", value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  if (guilds.length === 0) return null;

  return (
    <div className="px-3 pb-2">
      <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
        ดูกิลด์
      </p>
      <Select value={currentGuildId} onValueChange={handleChange}>
        <SelectTrigger className="h-8 text-xs" aria-label="เลือกกิลด์">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {guilds.map((g) => (
            <SelectItem key={g.id} value={g.id}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
