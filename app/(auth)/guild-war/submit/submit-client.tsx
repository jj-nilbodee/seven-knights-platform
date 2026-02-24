"use client";

import { useState, useTransition, useEffect, useRef, startTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Search,
  X,
  ChevronDown,
  Shield,
  Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkillSequenceSelector } from "@/components/guild-war/skill-sequence-selector";
import type {
  HeroData,
  SelectedHero,
  TeamCompositionState,
  SkillSequenceItem,
} from "@/components/guild-war/index";
import { initialTeamState } from "@/components/guild-war/index";
import { createBattle, updateBattle, getBattleContext } from "@/actions/battles";

type Member = {
  id: string;
  guildId: string;
  ign: string;
  isActive: boolean | null;
  status: string | null;
  joinedAt: Date | null;
  lastBattleAt: Date | null;
};

function serializeTeam(state: TeamCompositionState) {
  return {
    heroes: state.selectedHeroes.map((h) => ({
      heroId: h.heroId,
      position: h.position,
    })),
    formation: null,
    skillSequence: state.skillSequence.map((s) => ({
      heroId: s.heroId,
      skillId: s.skillId,
      order: s.order,
    })),
    speed: typeof state.speed === "number" ? state.speed : 0,
  };
}

function getLatestGuildWarDate() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  // Guild war days: Monday(1), Wednesday(3), Saturday(6)
  // daysBack[day] = how many days to subtract to reach the latest eligible day (including today)
  const daysBack = [1, 0, 1, 0, 1, 1, 0]; // Sun→Sat, Mon→Mon, Tue→Mon, Wed→Wed, Thu→Wed, Fri→Wed, Sat→Sat
  const target = new Date(now);
  target.setDate(target.getDate() - daysBack[day]);
  return target.toISOString().split("T")[0];
}

function RadioGroup({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; color?: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => {
        const isActive = value === opt.value;
        const activeColor = opt.color ?? "accent";
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`
              flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium
              border transition-all cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                isActive
                  ? activeColor === "green"
                    ? "border-green bg-green/15 text-green shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                    : activeColor === "accent"
                      ? "border-accent bg-accent/15 text-accent shadow-[0_0_8px_rgba(230,57,70,0.15)]"
                      : "border-cyan bg-cyan/15 text-cyan shadow-[0_0_8px_rgba(34,211,238,0.15)]"
                  : "border-border-dim bg-bg-input text-text-muted hover:text-text-secondary hover:border-border-default"
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Member Combobox ──────────────────── */

function MemberCombobox({
  members,
  value,
  onChange,
  disabled,
}: {
  members: Member[];
  value: string;
  onChange: (memberId: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedMember = members.find((m) => m.id === value);

  const filtered = members.filter((m) =>
    m.ign.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (member: Member) => {
    onChange(member.id);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        {value && !open ? (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setQuery("");
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            disabled={disabled}
            className="w-full flex items-center h-9 pl-8 pr-8 rounded-md border border-border-default bg-bg-input text-sm text-text-primary text-left cursor-pointer hover:border-border-bright disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedMember?.ign}
          </button>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="พิมพ์ชื่อสมาชิก..."
            disabled={disabled}
            className="flex w-full rounded-md border border-border-default bg-bg-input pl-8 pr-8 h-9 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_rgba(230,57,70,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
          />
        )}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-30 w-full mt-1 rounded-md overflow-hidden max-h-48 overflow-y-auto bg-bg-card border border-border-default shadow-lg">
          {filtered.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => handleSelect(member)}
              className={`w-full flex items-center px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                member.id === value
                  ? "bg-accent/10 text-accent"
                  : "text-text-primary hover:bg-bg-card-hover"
              }`}
            >
              {member.ign}
            </button>
          ))}
        </div>
      )}
      {open && query && filtered.length === 0 && (
        <div className="absolute z-30 w-full mt-1 rounded-md overflow-hidden bg-bg-card border border-border-default shadow-lg">
          <div className="px-3 py-2 text-sm text-text-muted">ไม่พบสมาชิก</div>
        </div>
      )}
    </div>
  );
}

/* ── Enemy Player Input with Suggestions ──────────────────── */

function EnemyPlayerInput({
  value,
  onChange,
  suggestions,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  disabled?: boolean;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync from parent when value changes externally (e.g. reset)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const filtered = suggestions.filter(
    (name) =>
      name.toLowerCase().includes(localValue.toLowerCase()) &&
      name !== localValue,
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        placeholder="ชื่อผู้เล่นศัตรู"
        value={localValue}
        onChange={(e) => {
          const val = e.target.value;
          setLocalValue(val);
          startTransition(() => onChange(val));
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        disabled={disabled}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-30 w-full mt-1 rounded-md overflow-hidden max-h-48 overflow-y-auto bg-bg-card border border-border-default shadow-lg">
          {filtered.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setLocalValue(name);
                onChange(name);
                setOpen(false);
              }}
              className="w-full flex items-center px-3 py-2 text-sm text-left transition-colors cursor-pointer text-text-primary hover:bg-bg-card-hover"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Deferred Text Input ──────────────────── */

function DeferredInput({
  value,
  onValueChange,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <Input
      {...props}
      value={localValue}
      onChange={(e) => {
        const val = e.target.value;
        setLocalValue(val);
        startTransition(() => onValueChange(val));
      }}
    />
  );
}

/* ── Hero Chip Picker ──────────────────── */

function HeroChipPicker({
  heroes,
  selectedHeroes,
  onSelectionChange,
  variant,
  disabled,
  maxHeroes = 3,
}: {
  heroes: HeroData[];
  selectedHeroes: SelectedHero[];
  onSelectionChange: (heroes: SelectedHero[]) => void;
  variant: "allied" | "enemy";
  disabled?: boolean;
  maxHeroes?: number;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isAllied = variant === "allied";
  const borderColor = isAllied ? "border-cyan" : "border-accent";
  const chipBg = isAllied ? "bg-cyan/10" : "bg-accent/10";
  const chipBorder = isAllied ? "border-cyan/40" : "border-accent/40";
  const labelColor = isAllied ? "text-cyan" : "text-accent";

  const selectedIds = new Set(selectedHeroes.map((h) => h.heroId));

  const filtered = heroes.filter(
    (h) =>
      h.name.toLowerCase().includes(query.toLowerCase()) &&
      !selectedIds.has(h.id),
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (hero: HeroData) => {
    if (selectedHeroes.length >= maxHeroes) return;
    onSelectionChange([
      ...selectedHeroes,
      { heroId: hero.id, hero, position: null },
    ]);
    setQuery("");
    setOpen(false);
  };

  const handleRemove = (heroId: string) => {
    onSelectionChange(selectedHeroes.filter((h) => h.heroId !== heroId));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isAllied ? (
          <Shield className={`w-4 h-4 ${labelColor}`} />
        ) : (
          <Swords className={`w-4 h-4 ${labelColor}`} />
        )}
        <span className={`text-sm font-medium ${labelColor}`}>
          {isAllied ? "ทีมฝ่ายเรา" : "ทีมศัตรู"}
        </span>
        <span className="text-xs text-text-muted">
          ({selectedHeroes.length}/{maxHeroes})
        </span>
      </div>

      {/* Selected chips */}
      <div className="flex flex-wrap gap-1.5">
        {selectedHeroes.map((sh) => (
          <div
            key={sh.heroId}
            className={`flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full border text-sm ${chipBg} ${chipBorder}`}
          >
            {sh.hero.imageUrl ? (
              <img
                src={sh.hero.imageUrl}
                alt=""
                className="w-6 h-6 rounded-full object-cover object-top"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-bg-surface flex items-center justify-center text-[10px] text-text-muted">
                ?
              </div>
            )}
            <span className="text-text-primary text-sm">{sh.hero.name}</span>
            <button
              type="button"
              onClick={() => handleRemove(sh.heroId)}
              disabled={disabled}
              className="ml-0.5 text-text-muted hover:text-accent transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Search input */}
      {selectedHeroes.length < maxHeroes && (
        <div ref={wrapperRef} className="relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <Input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder={`ค้นหาฮีโร่... (เหลือ ${maxHeroes - selectedHeroes.length} ตัว)`}
              disabled={disabled}
              className={`pl-8 h-9 text-sm ${open && query ? borderColor : ""}`}
            />
          </div>
          {open && filtered.length > 0 && (
            <div className="absolute z-30 w-full mt-1 rounded-[var(--radius-md)] overflow-hidden max-h-48 overflow-y-auto bg-bg-card border border-border-default shadow-lg">
              {filtered.slice(0, 20).map((hero) => (
                <button
                  key={hero.id}
                  type="button"
                  onClick={() => handleSelect(hero)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors cursor-pointer text-text-primary hover:bg-bg-card-hover"
                >
                  {hero.imageUrl ? (
                    <img
                      src={hero.imageUrl}
                      alt=""
                      className="w-7 h-7 rounded-[var(--radius-sm)] object-cover object-top"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-xs bg-bg-input text-text-muted">
                      ?
                    </div>
                  )}
                  {hero.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Initial Battle type for edit mode ──────────────────── */

export type InitialBattle = {
  id: string;
  memberId: string;
  date: string;
  battleNumber: number;
  battleType: string | null;
  result: string;
  enemyGuildName: string | null;
  enemyPlayerName: string | null;
  alliedTeam: unknown;
  enemyTeam: unknown;
  firstTurn: boolean | null;
  videoUrl: string | null;
};

interface TeamJsonData {
  heroes?: Array<{ heroId: string; position: string | null }>;
  skillSequence?: Array<{ heroId: string; skillId: string; order: number }>;
  speed?: number;
}

function reconstructTeamState(
  teamJson: unknown,
  heroList: HeroData[],
): TeamCompositionState {
  const data = (teamJson ?? {}) as TeamJsonData;
  const heroMap = new Map(heroList.map((h) => [h.id, h]));

  const selectedHeroes: SelectedHero[] = (data.heroes ?? [])
    .map((h) => {
      const hero = heroMap.get(h.heroId);
      if (!hero) return null;
      return {
        heroId: h.heroId,
        hero,
        position: (h.position as "front" | "back" | null) ?? null,
      };
    })
    .filter((h): h is SelectedHero => h !== null);

  const skillSequence: SkillSequenceItem[] = (data.skillSequence ?? []).map(
    (s) => {
      const hero = heroMap.get(s.heroId);
      let skillLabel = s.skillId;
      if (hero) {
        if (hero.skill1Id === s.skillId) skillLabel = "Skill 1 ล่าง";
        else if (hero.skill2Id === s.skillId) skillLabel = "Skill 2 บน";
      }
      return {
        heroId: s.heroId,
        skillId: s.skillId,
        order: s.order as 1 | 2 | 3,
        heroName: hero?.name ?? "?",
        skillLabel,
      };
    },
  );

  return {
    selectedHeroes,
    formation: null,
    skillSequence,
    speed: data.speed ?? "",
  };
}

/* ── Main Form ──────────────────── */

export function BattleSubmitClient({
  members,
  heroes,
  guildId,
  initialBattle,
}: {
  members: Member[];
  heroes: HeroData[];
  guildId: string;
  initialBattle?: InitialBattle;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditMode = !!initialBattle;

  // Form state
  const [memberId, setMemberId] = useState(initialBattle?.memberId ?? "");
  const [date, setDate] = useState(initialBattle?.date ?? getLatestGuildWarDate());
  const [battleNumber, setBattleNumber] = useState(
    initialBattle ? String(initialBattle.battleNumber) : "1",
  );
  const [battleType, setBattleType] = useState(
    initialBattle?.battleType ?? "attack",
  );
  const [result, setResult] = useState(initialBattle?.result ?? "");
  const [enemyGuildName, setEnemyGuildName] = useState(
    initialBattle?.enemyGuildName ?? "",
  );
  const [enemyPlayerName, setEnemyPlayerName] = useState(
    initialBattle?.enemyPlayerName ?? "",
  );
  const [firstTurn, setFirstTurn] = useState(
    initialBattle
      ? initialBattle.firstTurn === true
        ? "yes"
        : initialBattle.firstTurn === false
          ? "no"
          : "unknown"
      : "unknown",
  );
  const [videoUrl, setVideoUrl] = useState(initialBattle?.videoUrl ?? "");
  const [memberBattleCount, setMemberBattleCount] = useState(0);
  const [enemyPlayerSuggestions, setEnemyPlayerSuggestions] = useState<string[]>([]);

  // Team composition state
  const [alliedTeam, setAlliedTeam] = useState<TeamCompositionState>(
    initialBattle
      ? reconstructTeamState(initialBattle.alliedTeam, heroes)
      : initialTeamState,
  );
  const [enemyTeam, setEnemyTeam] = useState<TeamCompositionState>(
    initialBattle
      ? reconstructTeamState(initialBattle.enemyTeam, heroes)
      : initialTeamState,
  );

  // Collapsible advanced section — open by default in edit mode if there's advanced data
  const [advancedOpen, setAdvancedOpen] = useState(() => {
    if (!initialBattle) return false;
    const allied = (initialBattle.alliedTeam ?? {}) as TeamJsonData;
    const enemy = (initialBattle.enemyTeam ?? {}) as TeamJsonData;
    return !!(
      (allied.skillSequence && allied.skillSequence.length > 0) ||
      (enemy.skillSequence && enemy.skillSequence.length > 0) ||
      (allied.speed && allied.speed > 0) ||
      (enemy.speed && enemy.speed > 0) ||
      initialBattle.videoUrl
    );
  });

  // Auto-populate battle number and enemy guild name (skip in edit mode)
  useEffect(() => {
    if (isEditMode || !date) return;

    if (memberId) {
      getBattleContext(guildId, memberId, date).then((ctx) => {
        setMemberBattleCount(ctx.memberBattleCount);
        setBattleNumber(String(ctx.nextBattleNumber));
        if (ctx.enemyGuildName) {
          setEnemyGuildName(ctx.enemyGuildName);
        }
        setEnemyPlayerSuggestions(ctx.enemyPlayerNames);
      });
    } else {
      getBattleContext(guildId, "", date).then((ctx) => {
        if (ctx.enemyGuildName) {
          setEnemyGuildName(ctx.enemyGuildName);
        }
        setEnemyPlayerSuggestions(ctx.enemyPlayerNames);
      });
    }
  }, [memberId, date, guildId, isEditMode]);

  // Hero selection handlers that also clean up skill sequences
  const handleAlliedHeroChange = (selectedHeroes: SelectedHero[]) => {
    const selectedHeroIds = new Set(selectedHeroes.map((h) => h.heroId));
    const validSkills = alliedTeam.skillSequence.filter((s) =>
      selectedHeroIds.has(s.heroId),
    );
    const reordered = validSkills.map((s, i) => ({
      ...s,
      order: (i + 1) as 1 | 2 | 3,
    }));
    setAlliedTeam({
      ...alliedTeam,
      selectedHeroes,
      skillSequence: reordered,
    });
  };

  const handleEnemyHeroChange = (selectedHeroes: SelectedHero[]) => {
    const selectedHeroIds = new Set(selectedHeroes.map((h) => h.heroId));
    const validSkills = enemyTeam.skillSequence.filter((s) =>
      selectedHeroIds.has(s.heroId),
    );
    const reordered = validSkills.map((s, i) => ({
      ...s,
      order: (i + 1) as 1 | 2 | 3,
    }));
    setEnemyTeam({
      ...enemyTeam,
      selectedHeroes,
      skillSequence: reordered,
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!memberId) {
      toast.error("กรุณาเลือกสมาชิก");
      return;
    }
    if (!result) {
      toast.error("กรุณาเลือกผลการต่อสู้");
      return;
    }
    if (!isEditMode && memberBattleCount >= 5) {
      toast.error("สมาชิกนี้ลงสนามครบ 5 ครั้งแล้วในวันนี้");
      return;
    }

    startTransition(async () => {
      const battleData = {
        memberId,
        date,
        battleNumber: parseInt(battleNumber, 10),
        battleType,
        result,
        enemyGuildName,
        enemyPlayerName,
        alliedTeam: serializeTeam(alliedTeam),
        enemyTeam: serializeTeam(enemyTeam),
        firstTurn:
          firstTurn === "yes" ? true : firstTurn === "no" ? false : null,
        videoUrl,
      };

      const res = isEditMode
        ? await updateBattle(initialBattle.id, battleData)
        : await createBattle({ ...battleData, guildId });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          isEditMode ? "แก้ไขการต่อสู้สำเร็จ!" : "บันทึกการต่อสู้สำเร็จ!",
        );
        router.push("/guild-war");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/guild-war">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-text-primary">
            {isEditMode ? "แก้ไขการต่อสู้" : "บันทึกการต่อสู้"}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {isEditMode
              ? "แก้ไขข้อมูลการต่อสู้สงครามกิลด์"
              : "เพิ่มข้อมูลการต่อสู้สงครามกิลด์"}
          </p>
        </div>
        {/* Battle # badge */}
        {!isEditMode && memberId && (
          <div className="flex flex-col items-center px-3 py-1.5 rounded-[var(--radius-md)] bg-accent/10 border border-accent/30">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">
              ครั้งที่
            </span>
            <span className="text-lg font-bold text-accent">
              {battleNumber}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Member + Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">
              สมาชิก <span className="text-accent">*</span>
            </label>
            <MemberCombobox
              members={members}
              value={memberId}
              onChange={setMemberId}
              disabled={isPending}
            />
            {!isEditMode && memberId && memberBattleCount > 0 && (
              <p className="text-xs text-text-muted">
                ลงสนามแล้ว {memberBattleCount}/5 ครั้ง
                {memberBattleCount >= 5 && (
                  <span className="text-accent ml-1">(ครบแล้ว)</span>
                )}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">
              วันที่ <span className="text-accent">*</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        {/* Row 2: Result + First Turn + Battle Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">
              ผลลัพธ์ <span className="text-accent">*</span>
            </label>
            <RadioGroup
              value={result}
              onChange={setResult}
              disabled={isPending}
              options={[
                { value: "win", label: "ชนะ", color: "green" },
                { value: "loss", label: "แพ้", color: "accent" },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">
              ลงมือก่อน
            </label>
            <RadioGroup
              value={firstTurn}
              onChange={setFirstTurn}
              disabled={isPending}
              options={[
                { value: "yes", label: "ใช่", color: "green" },
                { value: "no", label: "ไม่", color: "accent" },
                { value: "unknown", label: "?", color: "cyan" },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">
              ประเภท
            </label>
            <RadioGroup
              value={battleType}
              onChange={setBattleType}
              disabled={isPending}
              options={[
                { value: "attack", label: "บุก", color: "accent" },
                { value: "defense", label: "รับ", color: "cyan" },
              ]}
            />
          </div>
        </div>

        {/* Row 3: Enemy guild + Enemy player */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">
              กิลด์ศัตรู
            </label>
            <DeferredInput
              placeholder="ชื่อกิลด์ศัตรู"
              value={enemyGuildName}
              onValueChange={setEnemyGuildName}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">
              ผู้เล่นศัตรู
            </label>
            <EnemyPlayerInput
              value={enemyPlayerName}
              onChange={setEnemyPlayerName}
              suggestions={enemyPlayerSuggestions}
              disabled={isPending}
            />
          </div>
        </div>

        {/* Row 4: Hero pickers side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-[var(--radius-md)] bg-bg-elevated border border-border-dim">
            <HeroChipPicker
              heroes={heroes}
              selectedHeroes={alliedTeam.selectedHeroes}
              onSelectionChange={handleAlliedHeroChange}
              variant="allied"
              disabled={isPending}
            />
          </div>

          <div className="p-3 rounded-[var(--radius-md)] bg-bg-elevated border border-border-dim">
            <HeroChipPicker
              heroes={heroes}
              selectedHeroes={enemyTeam.selectedHeroes}
              onSelectionChange={handleEnemyHeroChange}
              variant="enemy"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Collapsible advanced section */}
        <div className="border border-border-dim rounded-[var(--radius-md)] overflow-hidden">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-bg-elevated hover:bg-bg-card-hover transition-colors cursor-pointer"
          >
            <span className="text-sm font-medium text-text-secondary">
              รายละเอียดเพิ่มเติม
            </span>
            <ChevronDown
              className={`w-4 h-4 text-text-muted transition-transform ${advancedOpen ? "rotate-180" : ""}`}
            />
          </button>

          {advancedOpen && (
            <div className="px-4 pb-4 pt-2 space-y-6 border-t border-border-dim">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Allied advanced */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan" />
                    <span className="text-sm font-medium text-cyan">
                      ทีมฝ่ายเรา
                    </span>
                  </div>

                  {/* Skill Sequence */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      ลำดับสกิล
                    </label>
                    <SkillSequenceSelector
                      selectedHeroes={alliedTeam.selectedHeroes}
                      skillSequence={alliedTeam.skillSequence}
                      onSequenceChange={(sequence: SkillSequenceItem[]) =>
                        setAlliedTeam({ ...alliedTeam, skillSequence: sequence })
                      }
                      variant="allied"
                      disabled={isPending}
                    />
                  </div>

                  {/* Speed */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      ความเร็ว
                    </label>
                    <Input
                      type="number"
                      placeholder="ความเร็วทีม"
                      value={alliedTeam.speed}
                      onChange={(e) =>
                        setAlliedTeam({
                          ...alliedTeam,
                          speed:
                            e.target.value === ""
                              ? ""
                              : parseInt(e.target.value, 10),
                        })
                      }
                      min={0}
                      className="h-9"
                      disabled={isPending}
                    />
                  </div>
                </div>

                {/* Enemy advanced */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-accent">
                      ทีมศัตรู
                    </span>
                  </div>

                  {/* Skill Sequence */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      ลำดับสกิล
                    </label>
                    <SkillSequenceSelector
                      selectedHeroes={enemyTeam.selectedHeroes}
                      skillSequence={enemyTeam.skillSequence}
                      onSequenceChange={(sequence: SkillSequenceItem[]) =>
                        setEnemyTeam({ ...enemyTeam, skillSequence: sequence })
                      }
                      variant="enemy"
                      disabled={isPending}
                    />
                  </div>

                  {/* Speed */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      ความเร็ว
                    </label>
                    <Input
                      type="number"
                      placeholder="ความเร็วทีม"
                      value={enemyTeam.speed}
                      onChange={(e) =>
                        setEnemyTeam({
                          ...enemyTeam,
                          speed:
                            e.target.value === ""
                              ? ""
                              : parseInt(e.target.value, 10),
                        })
                      }
                      min={0}
                      className="h-9"
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>

              {/* Video URL — full width below columns */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  ลิงก์วิดีโอ
                </label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  disabled={isPending}
                  className="h-9"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isPending || (!isEditMode && memberBattleCount >= 5)}
            className="flex-1"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditMode ? "กำลังบันทึก..." : "กำลังบันทึก..."}
              </>
            ) : isEditMode ? (
              "บันทึกการแก้ไข"
            ) : (
              "บันทึกการต่อสู้"
            )}
          </Button>
          <Link href="/guild-war">
            <Button variant="outline" type="button" disabled={isPending}>
              ยกเลิก
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
