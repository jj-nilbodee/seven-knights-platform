"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Swords,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createBattle } from "@/actions/battles";

type Member = {
  id: string;
  guildId: string;
  ign: string;
  nickname: string;
  isActive: boolean | null;
  status: string | null;
  joinedAt: Date | null;
  lastBattleAt: Date | null;
};

function Toast({
  message,
  type,
  onDone,
}: {
  message: string;
  type: "success" | "error";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] shadow-lg border backdrop-blur-md ${
          type === "success"
            ? "bg-green/20 border-green/30 text-green"
            : "bg-accent/20 border-accent/30 text-accent"
        }`}
      >
        {type === "success" ? (
          <CheckCircle className="h-5 w-5 shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 shrink-0" />
        )}
        <span className="font-medium text-sm">{message}</span>
      </div>
    </div>
  );
}

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
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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

  // Team composition state
  const [alliedTeam, setAlliedTeam] =
    useState<TeamCompositionState>(initialTeamState);
  const [enemyTeam, setEnemyTeam] =
    useState<TeamCompositionState>(initialTeamState);

  // Active section for mobile
  const [activeSection, setActiveSection] = useState<
    "info" | "allied" | "enemy"
  >("info");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!memberId) {
      setToast({ message: "กรุณาเลือกสมาชิก", type: "error" });
      return;
    }
    if (!result) {
      setToast({ message: "กรุณาเลือกผลการต่อสู้", type: "error" });
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
        setToast({ message: res.error, type: "error" });
      } else {
        setToast({ message: "บันทึกการต่อสู้สำเร็จ!", type: "success" });
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
          <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Member select */}
              <div className="space-y-1.5">
                <Label className="text-text-primary">สมาชิก *</Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสมาชิก" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.ign} ({m.nickname})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-text-primary">วันที่ *</Label>
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

              {/* Battle number */}
              <div className="space-y-1.5">
                <Label className="text-text-primary">ครั้งที่ *</Label>
                <Select value={battleNumber} onValueChange={setBattleNumber}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">ครั้งที่ 1</SelectItem>
                    <SelectItem value="2">ครั้งที่ 2</SelectItem>
                    <SelectItem value="3">ครั้งที่ 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Battle type */}
              <div className="space-y-1.5">
                <Label className="text-text-primary">ประเภท</Label>
                <Select value={battleType} onValueChange={setBattleType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attack">บุก</SelectItem>
                    <SelectItem value="defense">รับ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Result */}
              <div className="space-y-1.5">
                <Label className="text-text-primary">ผลลัพธ์ *</Label>
                <Select value={result} onValueChange={setResult}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกผลลัพธ์" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="win">ชนะ</SelectItem>
                    <SelectItem value="loss">แพ้</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* First turn */}
              <div className="space-y-1.5">
                <Label className="text-text-primary">ลงมือก่อน</Label>
                <Select value={firstTurn} onValueChange={setFirstTurn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">ไม่ทราบ</SelectItem>
                    <SelectItem value="yes">ใช่</SelectItem>
                    <SelectItem value="no">ไม่ใช่</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Enemy guild name */}
              <div className="space-y-1.5">
                <Label className="text-text-primary">กิลด์ศัตรู</Label>
                <Input
                  placeholder="ชื่อกิลด์ศัตรู"
                  value={enemyGuildName}
                  onChange={(e) => setEnemyGuildName(e.target.value)}
                  disabled={isPending}
                />
              </div>

              {/* Enemy player name */}
              <div className="space-y-1.5">
                <Label className="text-text-primary">ผู้เล่นศัตรู</Label>
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
              <Label className="text-text-primary">ลิงก์วิดีโอ</Label>
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
          <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-6">
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
          <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-6">
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
        <div className="flex items-center justify-between pt-4">
          <Link href="/guild-war">
            <Button variant="outline" type="button" disabled={isPending}>
              ยกเลิก
            </Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              "บันทึกการต่อสู้"
            )}
          </Button>
        </div>
      </form>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
