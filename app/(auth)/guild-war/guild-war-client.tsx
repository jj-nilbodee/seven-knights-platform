"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Camera,
  Swords,
  Shield,
  Trophy,
  XCircle as XCircleIcon,
  Percent,
  Loader2,
  Trash2,
  Pencil,
  Filter,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  Zap,
  Gauge,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getResultBadgeClasses } from "@/lib/badge-utils";
import { deleteBattle } from "@/actions/battles";

type Battle = {
  id: string;
  guildId: string;
  memberId: string;
  memberIgn: string | null;
  date: string;
  weekday: string;
  battleType: string | null;
  result: string;
  enemyGuildName: string | null;
  enemyPlayerName: string | null;
  alliedTeam: unknown;
  enemyTeam: unknown;
  firstTurn: boolean | null;
  submittedByUserId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type Stats = {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
};

type Member = {
  id: string;
  guildId: string;
  ign: string;
  isActive: boolean | null;
  status: string | null;
  joinedAt: Date | null;
  lastBattleAt: Date | null;
};


/* ── Member Multi-Select ──────────────────── */

function MemberMultiSelect({
  members,
  selectedIds,
  onChange,
}: {
  members: Member[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedSet = new Set(selectedIds);
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const filtered = members.filter(
    (m) => m.ign.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(id: string) {
    const next = selectedSet.has(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onChange(next);
  }

  function clear() {
    onChange([]);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border-default bg-bg-input text-sm text-text-primary hover:border-border-bright transition-colors cursor-pointer min-w-[180px]"
      >
        {selectedIds.length === 0 ? (
          <span className="text-text-muted">ทุกคน</span>
        ) : (
          <span className="flex items-center gap-1 flex-wrap">
            {selectedIds.slice(0, 2).map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs"
              >
                {memberMap.get(id)?.ign ?? id}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggle(id); }}
                  className="hover:text-accent-bright cursor-pointer"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            {selectedIds.length > 2 && (
              <span className="text-xs text-text-muted">+{selectedIds.length - 2}</span>
            )}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-text-muted ml-auto shrink-0" />
      </button>

      {open && (
        <div className="absolute z-30 w-64 mt-1 rounded-md bg-bg-card border border-border-default shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border-dim">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาสมาชิก..."
                className="w-full h-7 pl-7 pr-2 rounded-[var(--radius-sm)] bg-bg-input border border-border-dim text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                autoFocus
              />
            </div>
          </div>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="w-full px-3 py-1.5 text-xs text-text-muted hover:text-accent hover:bg-bg-card-hover text-left cursor-pointer"
            >
              ล้างตัวกรอง
            </button>
          )}
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((m) => {
              const isSelected = selectedSet.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-accent/10 text-accent"
                      : "text-text-primary hover:bg-bg-card-hover"
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 ${
                    isSelected ? "border-accent bg-accent" : "border-border-default"
                  }`}>
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {m.ign}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-text-muted">ไม่พบสมาชิก</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type HeroInfo = {
  id: string;
  name: string;
  imageUrl: string | null;
  skill1Id: string | null;
  skill2Id: string | null;
};

export function GuildWarClient({
  initialBattles,
  stats,
  members,
  heroes,
  filters,
}: {
  initialBattles: Battle[];
  stats: Stats;
  members: Member[];
  heroes: HeroInfo[];
  filters: { member: string; result: string; date: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingBattle, setDeletingBattle] = useState<Battle | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [isFiltering, startFiltering] = useTransition();

  const heroMap = new Map(heroes.map((h) => [h.id, h]));

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startFiltering(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const selectedMemberIds = filters.member === "all"
    ? []
    : filters.member.split(",").filter(Boolean);

  // Data is already filtered server-side
  const filtered = initialBattles;

  function confirmDelete(battle: Battle) {
    setDeletingBattle(battle);
    setDeleteOpen(true);
  }

  function handleDelete() {
    if (!deletingBattle) return;
    startDelete(async () => {
      const result = await deleteBattle(deletingBattle.id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("ลบการต่อสู้สำเร็จ");
        router.refresh();
      }
      setDeleteOpen(false);
      setDeletingBattle(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "รวม",
            value: stats.total,
            icon: Swords,
            color: "text-text-primary",
          },
          {
            label: "ชนะ",
            value: stats.wins,
            icon: Trophy,
            color: "text-green",
          },
          {
            label: "แพ้",
            value: stats.losses,
            icon: XCircleIcon,
            color: "text-accent",
          },
          {
            label: "อัตราชนะ",
            value: `${stats.winRate}%`,
            icon: Percent,
            color: "text-gold",
          },
        ].map((card) => (
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
            <p
              className={`mt-2 font-display text-2xl font-bold ${card.color}`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-text-muted" />

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={filters.date === "all" ? "" : filters.date}
            onChange={(e) => setFilter("date", e.target.value || "all")}
            className="h-9 px-3 rounded-md border border-border-default bg-bg-input text-sm text-text-primary transition-colors focus-visible:outline-none focus-visible:border-accent"
          />
          {filters.date !== "all" && (
            <button
              type="button"
              onClick={() => setFilter("date", "all")}
              className="p-1 text-text-muted hover:text-accent transition-colors cursor-pointer"
              title="แสดงทุกวัน"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <MemberMultiSelect
          members={members}
          selectedIds={selectedMemberIds}
          onChange={(ids) => setFilter("member", ids.length === 0 ? "all" : ids.join(","))}
        />

        <Select value={filters.result} onValueChange={(v) => setFilter("result", v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="ผลลัพธ์" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกผลลัพธ์</SelectItem>
            <SelectItem value="win">ชนะ</SelectItem>
            <SelectItem value="loss">แพ้</SelectItem>
          </SelectContent>
        </Select>

      </div>

      {/* Battle table */}
      <div className={`rounded-[var(--radius-md)] border border-border-dim bg-bg-card overflow-hidden transition-opacity ${isFiltering ? "opacity-60" : ""}`}>
        <div className="flex items-center justify-between p-4 border-b border-border-dim">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            รายการการต่อสู้
          </h2>
          <span className="text-sm text-text-muted">
            {filtered.length} รายการ
          </span>
        </div>

        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-dim bg-bg-surface">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    วันที่
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    สมาชิก
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    คู่ต่อสู้
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    ผลลัพธ์
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((battle) => (
                  <BattleRow
                    key={battle.id}
                    battle={battle}
                    heroMap={heroMap}
                    onDelete={() => confirmDelete(battle)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-text-muted">
            ยังไม่มีข้อมูลการต่อสู้
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeletingBattle(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              คุณต้องการลบข้อมูลการต่อสู้นี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          {deletingBattle && (
            <div className="py-3 text-sm text-text-secondary">
              <p>
                {deletingBattle.memberIgn} — {deletingBattle.date}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeletingBattle(null);
              }}
              disabled={isDeleting}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-accent hover:bg-accent-bright"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

/* ── Battle Row with Expandable Detail ──────────────────── */

interface TeamData {
  heroes?: Array<{ heroId: string; position: string | null }>;
  skillSequence?: Array<{ heroId: string; skillId: string; order: number }>;
  speed?: number;
}

function InlineTeam({
  team,
  heroMap,
  variant,
  label,
}: {
  team: TeamData;
  heroMap: Map<string, HeroInfo>;
  variant: "allied" | "enemy";
  label: string;
}) {
  const colors =
    variant === "allied"
      ? { border: "border-cyan/30", bg: "bg-cyan/5", text: "text-cyan" }
      : { border: "border-accent/30", bg: "bg-accent/5", text: "text-accent" };

  const heroes = team.heroes ?? [];
  const skillSequence = team.skillSequence ?? [];
  const speed = team.speed ?? 0;

  if (heroes.length === 0 && skillSequence.length === 0) {
    return (
      <div className={`rounded-[var(--radius-sm)] border ${colors.border} ${colors.bg} p-3`}>
        <div className="flex items-center gap-1.5 mb-1">
          {variant === "allied" ? <Shield className={`h-3.5 w-3.5 ${colors.text}`} /> : <Swords className={`h-3.5 w-3.5 ${colors.text}`} />}
          <span className={`text-xs font-medium ${colors.text}`}>{label}</span>
        </div>
        <p className="text-xs text-text-muted">ไม่มีข้อมูล</p>
      </div>
    );
  }

  return (
    <div className={`rounded-[var(--radius-sm)] border ${colors.border} ${colors.bg} p-3 space-y-2`}>
      <div className="flex items-center gap-1.5">
        {variant === "allied" ? <Shield className={`h-3.5 w-3.5 ${colors.text}`} /> : <Swords className={`h-3.5 w-3.5 ${colors.text}`} />}
        <span className={`text-xs font-medium ${colors.text}`}>{label}</span>
        {speed > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-text-muted ml-auto">
            <Gauge className="h-3 w-3" /> {speed}
          </span>
        )}
      </div>

      {/* Heroes */}
      <div className="flex flex-wrap gap-1.5">
        {heroes.map((h, i) => {
          const hero = heroMap.get(h.heroId);
          return (
            <div key={i} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-bg-card/60 border border-border-dim">
              {hero?.imageUrl ? (
                <img src={hero.imageUrl} alt="" className="w-5 h-5 rounded-full object-cover object-top" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-bg-surface flex items-center justify-center">
                  <User className="w-3 h-3 text-text-muted" />
                </div>
              )}
              <span className="text-xs text-text-primary">{hero?.name ?? "?"}</span>
            </div>
          );
        })}
      </div>

      {/* Skill sequence */}
      {skillSequence.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <Zap className="h-3 w-3 text-gold shrink-0" />
          {skillSequence
            .sort((a, b) => a.order - b.order)
            .map((s, i) => {
              const hero = heroMap.get(s.heroId);
              let skillName = s.skillId;
              if (hero) {
                if (hero.skill1Id === s.skillId) skillName = "S1";
                else if (hero.skill2Id === s.skillId) skillName = "S2";
              }
              return (
                <span key={i} className="flex items-center gap-0.5">
                  {i > 0 && <ChevronRight className="w-2.5 h-2.5 text-text-muted" />}
                  <span className={`px-1.5 py-0.5 rounded text-[11px] border ${colors.border} ${colors.bg}`}>
                    <span className="text-text-muted">{hero?.name ?? "?"}</span>{" "}
                    <span className="font-medium text-text-primary">{skillName}</span>
                  </span>
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
}

function BattleRow({
  battle,
  heroMap,
  onDelete,
}: {
  battle: Battle;
  heroMap: Map<string, HeroInfo>;
  onDelete: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const alliedTeam = (battle.alliedTeam ?? {}) as TeamData;
  const enemyTeam = (battle.enemyTeam ?? {}) as TeamData;
  const hasTeamData = (alliedTeam.heroes?.length ?? 0) > 0 || (enemyTeam.heroes?.length ?? 0) > 0;

  return (
    <>
      <tr
        onClick={() => setIsExpanded(!isExpanded)}
        className={`border-b border-border-dim hover:bg-bg-elevated transition-colors cursor-pointer ${isExpanded ? "bg-bg-elevated" : ""}`}
      >
        <td className="px-4 py-3 text-text-primary font-medium">
          {battle.date}
        </td>
        <td className="px-4 py-3 text-text-secondary">
          {battle.memberIgn ?? "—"}
        </td>
        <td className="px-4 py-3 text-text-secondary">
          {battle.enemyGuildName || "—"}
          {battle.enemyPlayerName && (
            <span className="text-text-muted ml-1">
              ({battle.enemyPlayerName})
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <span className={getResultBadgeClasses(battle.result)}>
            {battle.result === "win" ? "ชนะ" : "แพ้"}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Link href={`/guild-war/edit?id=${battle.id}`}>
              <button className="p-1 rounded-[var(--radius-sm)] text-text-muted hover:text-gold hover:bg-gold/10 transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </Link>
            <button
              onClick={onDelete}
              className="p-1 rounded-[var(--radius-sm)] text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-4 py-3 bg-bg-surface/50 border-b border-border-dim">
            <div className="space-y-3">
              {/* Battle meta */}
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                <span className="text-text-muted">
                  ประเภท: <span className="text-text-primary font-medium">{battle.battleType === "attack" ? "บุก" : "รับ"}</span>
                </span>
                <span className="text-text-muted">
                  ลงมือก่อน: <span className="text-text-primary font-medium">
                    {battle.firstTurn === true ? "ใช่" : battle.firstTurn === false ? "ไม่ใช่" : "ไม่ทราบ"}
                  </span>
                </span>
              </div>

              {/* Teams */}
              {hasTeamData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InlineTeam team={alliedTeam} heroMap={heroMap} variant="allied" label="ทีมฝ่ายเรา" />
                  <InlineTeam team={enemyTeam} heroMap={heroMap} variant="enemy" label="ทีมศัตรู" />
                </div>
              ) : (
                <p className="text-xs text-text-muted">
                  ยังไม่มีข้อมูลทีม —{" "}
                  <Link href={`/guild-war/edit?id=${battle.id}`} className="text-gold hover:underline">แก้ไขเพื่อเพิ่มข้อมูล</Link>
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
