"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAllGuilds } from "@/actions/guilds";

interface Guild {
  id: string;
  name: string;
}

export function GuildSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [guilds, setGuilds] = useState<Guild[]>([]);

  const currentGuildId = searchParams.get("guildId") ?? "own";

  useEffect(() => {
    fetchAllGuilds().then(setGuilds).catch(() => {});
  }, []);

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "own") {
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
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="กิลด์ของฉัน" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="own">กิลด์ของฉัน</SelectItem>
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
