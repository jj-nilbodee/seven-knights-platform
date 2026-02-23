"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const defaultGuildId = guilds[0]?.id ?? "";
  const currentGuildId = searchParams.get("guildId") ?? defaultGuildId;

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultGuildId) {
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
