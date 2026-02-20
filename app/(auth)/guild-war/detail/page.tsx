import { requireOfficer, resolveGuildId } from "@/lib/auth";
import { getBattleById } from "@/lib/db/queries/battles";
import { listHeroes } from "@/lib/db/queries/heroes";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  XCircle,
  User,
  Swords,
  Shield,
  Gauge,
  Zap,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getResultBadgeClasses } from "@/lib/badge-utils";

const weekdayLabels: Record<string, string> = {
  SAT: "เสาร์",
  MON: "จันทร์",
  WED: "พุธ",
};

interface TeamData {
  heroes?: Array<{ heroId: string; position: string | null }>;
  formation?: string | null;
  skillSequence?: Array<{
    heroId: string;
    skillId: string;
    order: number;
  }>;
  speed?: number;
}

function TeamDisplay({
  team,
  heroMap,
  variant,
  label,
}: {
  team: TeamData;
  heroMap: Map<
    string,
    { name: string; imageUrl: string | null; skill1Id: string | null; skill1Name: string; skill2Id: string | null; skill2Name: string }
  >;
  variant: "allied" | "enemy";
  label: string;
}) {
  const colors =
    variant === "allied"
      ? { border: "border-cyan/30", bg: "bg-cyan/10", text: "text-cyan" }
      : { border: "border-accent/30", bg: "bg-accent/10", text: "text-accent" };

  const heroes = team.heroes ?? [];
  const formation = team.formation ?? null;
  const skillSequence = team.skillSequence ?? [];
  const speed = team.speed ?? 0;

  return (
    <div
      className={`rounded-[var(--radius-md)] border ${colors.border} ${colors.bg} p-5 space-y-4`}
    >
      <div className="flex items-center gap-2">
        {variant === "allied" ? (
          <Shield className={`h-5 w-5 ${colors.text}`} />
        ) : (
          <Swords className={`h-5 w-5 ${colors.text}`} />
        )}
        <h3 className={`font-display font-semibold ${colors.text}`}>
          {label}
        </h3>
      </div>

      {/* Heroes */}
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
          ฮีโร่
        </p>
        <div className="flex flex-wrap gap-3">
          {heroes.length > 0 ? (
            heroes.map((h, i) => {
              const hero = heroMap.get(h.heroId);
              return (
                <div
                  key={i}
                  className="flex flex-col items-center p-2 rounded-[var(--radius-sm)] bg-bg-card/50 border border-border-dim min-w-[70px]"
                >
                  <div className="w-12 h-16 rounded-[var(--radius-sm)] overflow-hidden bg-bg-surface mb-1">
                    {hero?.imageUrl ? (
                      <img
                        src={hero.imageUrl}
                        alt={hero.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-text-muted" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-text-primary text-center line-clamp-1">
                    {hero?.name ?? "Unknown"}
                  </span>
                  {h.position && (
                    <span className="text-[10px] text-text-muted">
                      {h.position === "front" ? "หน้า" : "หลัง"}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <span className="text-sm text-text-muted">ไม่มีข้อมูล</span>
          )}
        </div>
      </div>

      {/* Formation & Speed */}
      <div className="flex flex-wrap gap-4">
        {formation && (
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
              จัดทัพ
            </p>
            <span className="text-sm text-text-primary font-medium">
              {formation}
            </span>
          </div>
        )}
        {speed > 0 && (
          <div className="flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-text-muted" />
            <p className="text-xs text-text-muted uppercase tracking-wider">
              ความเร็ว:
            </p>
            <span className="text-sm text-text-primary font-medium">
              {speed}
            </span>
          </div>
        )}
      </div>

      {/* Skill Sequence */}
      {skillSequence.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Zap className="w-3.5 h-3.5 text-gold" />
            <p className="text-xs text-text-muted uppercase tracking-wider">
              ลำดับสกิล
            </p>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {skillSequence
              .sort((a, b) => a.order - b.order)
              .map((s, i) => {
                const hero = heroMap.get(s.heroId);
                let skillName = s.skillId;
                if (hero) {
                  if (hero.skill1Id === s.skillId)
                    skillName = hero.skill1Name;
                  else if (hero.skill2Id === s.skillId)
                    skillName = hero.skill2Name;
                }
                return (
                  <div key={i} className="flex items-center gap-1">
                    {i > 0 && (
                      <ChevronRight className="w-3 h-3 text-text-muted" />
                    )}
                    <div
                      className={`px-2.5 py-1 rounded-[var(--radius-sm)] border ${colors.border} ${colors.bg}`}
                    >
                      <span className="text-xs text-text-muted">
                        {hero?.name ?? "?"}:
                      </span>{" "}
                      <span className="text-sm font-medium text-text-primary">
                        {skillName}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function BattleDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; guildId?: string }>;
}) {
  const user = await requireOfficer();
  const params = await searchParams;
  const guildId = resolveGuildId(user, params);
  const battleId = params.id;

  if (!battleId) redirect("/guild-war");

  const battle = await getBattleById(battleId);
  if (!battle) redirect("/guild-war");
  if (user.role !== "admin" && battle.guildId !== guildId) redirect("/guild-war");

  const heroes = await listHeroes({ isActive: true });
  const heroMap = new Map(
    heroes.map((h) => [
      h.id,
      {
        name: h.name,
        imageUrl: h.imageUrl,
        skill1Id: h.skill1Id,
        skill1Name: h.skill1Name,
        skill2Id: h.skill2Id,
        skill2Name: h.skill2Name,
      },
    ]),
  );

  const alliedTeam = (battle.alliedTeam ?? {}) as TeamData;
  const enemyTeam = (battle.enemyTeam ?? {}) as TeamData;

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
            รายละเอียดการต่อสู้
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {battle.date} — {weekdayLabels[battle.weekday] ?? battle.weekday}
          </p>
        </div>
        <span className={getResultBadgeClasses(battle.result)}>
          {battle.result === "win" ? (
            <>
              <Trophy className="h-3.5 w-3.5" /> ชนะ
            </>
          ) : (
            <>
              <XCircle className="h-3.5 w-3.5" /> แพ้
            </>
          )}
        </span>
      </div>

      {/* Battle info card */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">
              สมาชิก
            </p>
            <p className="text-sm text-text-primary font-medium mt-1">
              {battle.memberIgn ?? "—"}
              {battle.memberNickname && (
                <span className="text-text-secondary ml-1">
                  ({battle.memberNickname})
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">
              ครั้งที่
            </p>
            <p className="text-sm text-text-primary font-medium mt-1">
              {battle.battleNumber}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">
              ประเภท
            </p>
            <p className="text-sm text-text-primary font-medium mt-1">
              {battle.battleType === "attack" ? "บุก" : "รับ"}
            </p>
          </div>
          {battle.enemyGuildName && (
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">
                กิลด์ศัตรู
              </p>
              <p className="text-sm text-text-primary font-medium mt-1">
                {battle.enemyGuildName}
              </p>
            </div>
          )}
          {battle.enemyPlayerName && (
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">
                ผู้เล่นศัตรู
              </p>
              <p className="text-sm text-text-primary font-medium mt-1">
                {battle.enemyPlayerName}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">
              ลงมือก่อน
            </p>
            <p className="text-sm text-text-primary font-medium mt-1">
              {battle.firstTurn === true
                ? "ใช่"
                : battle.firstTurn === false
                  ? "ไม่ใช่"
                  : "ไม่ทราบ"}
            </p>
          </div>
        </div>
        {battle.videoUrl && (
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
              วิดีโอ
            </p>
            <a
              href={battle.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-cyan hover:underline"
            >
              ดูวิดีโอ <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* Team compositions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamDisplay
          team={alliedTeam}
          heroMap={heroMap}
          variant="allied"
          label="ทีมฝ่ายเรา"
        />
        <TeamDisplay
          team={enemyTeam}
          heroMap={heroMap}
          variant="enemy"
          label="ทีมศัตรู"
        />
      </div>
    </div>
  );
}
