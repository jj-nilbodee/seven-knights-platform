"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Swords,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamComposition } from "@/components/guild-war/team-composition";
import type {
  HeroData,
  TeamCompositionState,
} from "@/components/guild-war/index";
import { initialTeamState } from "@/components/guild-war/index";
import { createBattle, getBattleContext } from "@/actions/battles";

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
    formation: state.formation,
    skillSequence: state.skillSequence.map((s) => ({
      heroId: s.heroId,
      skillId: s.skillId,
      order: s.order,
    })),
    speed: typeof state.speed === "number" ? state.speed : 0,
  };
}

function getTodayDate() {
  const now = new Date();
  return now.toISOString().split("T")[0];
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

export function BattleSubmitClient({
  members,
  heroes,
  guildId,
}: {
  members: Member[];
  heroes: HeroData[];
  guildId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [memberId, setMemberId] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [battleNumber, setBattleNumber] = useState("1");
  const [battleType, setBattleType] = useState("attack");
  const [result, setResult] = useState("");
  const [enemyGuildName, setEnemyGuildName] = useState("");
  const [enemyPlayerName, setEnemyPlayerName] = useState("");
  const [firstTurn, setFirstTurn] = useState("unknown");
  const [videoUrl, setVideoUrl] = useState("");
  const [memberBattleCount, setMemberBattleCount] = useState(0);

  // Team composition state
  const [alliedTeam, setAlliedTeam] =
    useState<TeamCompositionState>(initialTeamState);
  const [enemyTeam, setEnemyTeam] =
    useState<TeamCompositionState>(initialTeamState);

  // Active section for mobile
  const [activeSection, setActiveSection] = useState<
    "info" | "allied" | "enemy"
  >("info");

  // Auto-populate battle number and enemy guild name
  useEffect(() => {
    if (!date) return;

    if (memberId) {
      getBattleContext(guildId, memberId, date).then((ctx) => {
        setMemberBattleCount(ctx.memberBattleCount);
        setBattleNumber(String(ctx.nextBattleNumber));
        if (ctx.enemyGuildName) {
          setEnemyGuildName(ctx.enemyGuildName);
        }
      });
    } else {
      getBattleContext(guildId, "", date).then((ctx) => {
        if (ctx.enemyGuildName) {
          setEnemyGuildName(ctx.enemyGuildName);
        }
      });
    }
  }, [memberId, date, guildId]);

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
    if (memberBattleCount >= 5) {
      toast.error("สมาชิกนี้ลงสนามครบ 5 ครั้งแล้วในวันนี้");
      return;
    }

    startTransition(async () => {
      const res = await createBattle({
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
        guildId,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("บันทึกการต่อสู้สำเร็จ!");
        router.push("/guild-war");
      }
    });
  }

  const sectionTabs = [
    { id: "info" as const, label: "ข้อมูลทั่วไป", icon: Swords },
    { id: "allied" as const, label: "ทีมฝ่ายเรา", icon: Shield },
    { id: "enemy" as const, label: "ทีมศัตรู", icon: Swords },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/guild-war">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            บันทึกการต่อสู้
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            เพิ่มข้อมูลการต่อสู้สงครามกิลด์
          </p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 border-b border-border-dim pb-0">
        {sectionTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeSection === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* General Info Section */}
        <div className={activeSection === "info" ? "block" : "hidden"}>
          <div className="space-y-6">
            {/* Member + Date row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  สมาชิก <span className="text-accent">*</span>
                </label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสมาชิก" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.ign}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <p className="text-xs text-text-muted">
                  เฉพาะวัน เสาร์, จันทร์ หรือ พุธ
                </p>
              </div>
            </div>

            {/* Battle number + Battle type row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  ครั้งที่ <span className="text-accent">*</span>
                </label>
                <Select value={battleNumber} onValueChange={setBattleNumber}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        ครั้งที่ {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {memberId && memberBattleCount > 0 && (
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

            {/* Result + First turn row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    { value: "no", label: "ไม่ใช่", color: "accent" },
                    { value: "unknown", label: "ไม่ทราบ", color: "cyan" },
                  ]}
                />
              </div>
            </div>

            {/* Enemy info row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  กิลด์ศัตรู
                </label>
                <Input
                  placeholder="ชื่อกิลด์ศัตรู"
                  value={enemyGuildName}
                  onChange={(e) => setEnemyGuildName(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  ผู้เล่นศัตรู
                </label>
                <Input
                  placeholder="ชื่อผู้เล่นศัตรู"
                  value={enemyPlayerName}
                  onChange={(e) => setEnemyPlayerName(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Video URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">
                ลิงก์วิดีโอ
              </label>
              <Input
                type="url"
                placeholder="https://..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
        </div>

        {/* Allied Team Section */}
        <div className={activeSection === "allied" ? "block" : "hidden"}>
          <div className="p-4 rounded-[var(--radius-md)] bg-bg-elevated border border-border-dim">
            <TeamComposition
              heroes={heroes}
              state={alliedTeam}
              onChange={setAlliedTeam}
              variant="allied"
              disabled={isPending}
              maxHeroes={3}
            />
          </div>
        </div>

        {/* Enemy Team Section */}
        <div className={activeSection === "enemy" ? "block" : "hidden"}>
          <div className="p-4 rounded-[var(--radius-md)] bg-bg-elevated border border-border-dim">
            <TeamComposition
              heroes={heroes}
              state={enemyTeam}
              onChange={setEnemyTeam}
              variant="enemy"
              disabled={isPending}
              maxHeroes={3}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-6">
          <Button
            type="submit"
            disabled={isPending || memberBattleCount >= 5}
            className="flex-1"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
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
