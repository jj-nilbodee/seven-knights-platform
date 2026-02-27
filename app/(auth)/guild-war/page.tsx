import Link from "next/link";
import {
  Swords,
  Trophy,
  XCircle as XCircleIcon,
  Percent,
  Camera,
  Plus,
} from "lucide-react";
import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import {
  listBattles,
  getBattleStats,
  countBattles,
} from "@/lib/db/queries/battles";
import { listMembers } from "@/lib/db/queries/members";
import { listHeroes } from "@/lib/db/queries/heroes";
import { Button } from "@/components/ui/button";
import { GuildWarShell } from "./guild-war-client";

const PAGE_SIZE = 20;

export default async function GuildWarPage({
  searchParams,
}: {
  searchParams: Promise<{
    guildId?: string;
    member?: string;
    result?: string;
    date?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const guild = await requireGuild(params);
  if (!guild) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        {NO_GUILD_MESSAGE}
      </div>
    );
  }
  const { guildId } = guild;

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const filters: {
    date?: string;
    memberIds?: string[];
    result?: "win" | "loss";
    limit?: number;
    offset?: number;
  } = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };

  if (params.date && params.date !== "all") {
    filters.date = params.date;
  }
  if (params.member && params.member !== "all") {
    const ids = params.member.split(",").filter(Boolean);
    if (ids.length > 0) {
      filters.memberIds = ids;
    }
  }
  if (params.result === "win" || params.result === "loss") {
    filters.result = params.result;
  }
  const [battles, totalCount, stats, members, heroes] = await Promise.all([
    listBattles(guildId, filters),
    countBattles(guildId, filters),
    getBattleStats(guildId),
    listMembers(guildId),
    listHeroes({ isActive: true }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const statCards = [
    { label: "รวม", value: stats.total, icon: Swords, color: "text-text-primary" },
    { label: "ชนะ", value: stats.wins, icon: Trophy, color: "text-green" },
    { label: "แพ้", value: stats.losses, icon: XCircleIcon, color: "text-accent" },
    { label: "อัตราชนะ", value: `${stats.winRate}%`, icon: Percent, color: "text-gold" },
  ];

  return (
    <div className="space-y-6">
      {/* Header — server-rendered */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            สงครามกิลด์
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            ติดตามและจัดการข้อมูลการต่อสู้
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/guild-war/quick-submit">
            <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
              <Camera className="h-4 w-4 mr-2" />
              บันทึกด่วน
            </Button>
          </Link>
          <Link href="/guild-war/submit">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              บันทึกการต่อสู้
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat cards — server-rendered */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                {card.label}
              </p>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className={`mt-2 font-display text-2xl font-bold ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Interactive filters + table — client boundary */}
      <GuildWarShell
        initialBattles={battles}
        members={members}
        heroes={heroes.map((h) => ({
          id: h.id,
          name: h.name,
          imageUrl: h.imageUrl,
          skill1Id: h.skill1Id,
          skill2Id: h.skill2Id,
        }))}
        filters={{
          member: params.member ?? "all",
          result: params.result ?? "all",
          date: params.date ?? "all",
        }}
        pagination={{
          page,
          totalPages,
          totalCount,
        }}
      />
    </div>
  );
}
