import Link from "next/link";
import type { SkillStep } from "@/lib/validations/guide";
import { SkillChain } from "./skill-chain";

interface Hero {
  id: string;
  name: string;
  imageUrl: string | null;
  skill1ImageUrl: string | null;
  skill2ImageUrl: string | null;
}

interface Guide {
  id: string;
  title: string;
  defenseHeroes: string[];
  attackHeroes: string[];
  attackPriority: number;
  attackSkillOrder: unknown;
  strategyNotes: string | null;
  patchVersion: string;
  updatedAt: Date | null;
}

function HeroPortrait({
  hero,
  size = 56,
  className = "",
}: {
  hero: Hero | undefined;
  size?: number;
  className?: string;
}) {
  if (!hero) {
    return (
      <div
        className={`hero-portrait ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.25,
          fontSize: size * 0.4,
        }}
      >
        ?
      </div>
    );
  }
  return hero.imageUrl ? (
    <img
      src={hero.imageUrl}
      alt={hero.name}
      className={`hero-portrait ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        objectFit: "cover",
      }}
    />
  ) : (
    <div
      className={`hero-portrait ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        fontSize: size * 0.4,
      }}
    >
      {hero.name[0]}
    </div>
  );
}

export function GuideCard({
  guide,
  heroes,
  index,
}: {
  guide: Guide;
  heroes: Hero[];
  index: number;
}) {
  const heroByName = (name: string) => heroes.find((h) => h.name === name);

  const priorityClass =
    guide.attackPriority === 1
      ? "priority-1"
      : guide.attackPriority === 2
        ? "priority-2"
        : guide.attackPriority === 3
          ? "priority-3"
          : "priority-fallback";

  const cardExtra = guide.attackPriority === 1 ? "war-card-gold" : "";
  const updatedDate = guide.updatedAt
    ? new Date(guide.updatedAt).toLocaleDateString("th-TH")
    : "";

  const skillSteps = (guide.attackSkillOrder ?? []) as SkillStep[];

  return (
    <Link href={`/gvg-guides/${guide.id}`}>
      <div
        className={`war-card ${cardExtra} p-6 animate-fade-in-up stagger-${Math.min(index + 1, 10)} cursor-pointer`}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <span className={`priority-badge ${priorityClass}`}>
            {guide.attackPriority}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text-primary leading-snug truncate">
              {guide.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="patch-badge">{guide.patchVersion}</span>
              <span className="text-text-muted text-sm">{updatedDate}</span>
            </div>
          </div>
        </div>

        {/* Teams row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Defense */}
          <div className="flex-1">
            <span className="team-label-defense mb-2 inline-block">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
              </svg>
              ป้องกัน
            </span>
            <div className="flex items-center gap-3 mt-1">
              {guide.defenseHeroes.map((name) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-1"
                >
                  <HeroPortrait
                    hero={heroByName(name)}
                    size={56}
                    className="hero-portrait-defense"
                  />
                  <span className="text-xs text-text-muted text-center leading-tight max-w-[60px] truncate">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* VS */}
          <div className="hidden sm:flex items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-px h-4 bg-border-dim" />
              <span className="font-display font-bold text-sm text-accent tracking-wider">
                VS
              </span>
              <div className="w-px h-4 bg-border-dim" />
            </div>
          </div>

          {/* Attack */}
          <div className="flex-1">
            <span className="team-label-attack mb-2 inline-block">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7.5 2l-5 5 5 5-5 5 5 5 5-5-5-5 5-5z M14.5 2l5 5-5 5 5 5-5 5-5-5 5-5-5-5z" />
              </svg>
              โจมตี
            </span>
            <div className="flex items-center gap-3 mt-1">
              {guide.attackHeroes.map((name) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-1"
                >
                  <HeroPortrait
                    hero={heroByName(name)}
                    size={56}
                    className="hero-portrait-attack"
                  />
                  <span className="text-xs text-text-muted text-center leading-tight max-w-[60px] truncate">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skill chain */}
        {skillSteps.length > 0 && (
          <div className="mb-3">
            <span className="text-xs font-display font-semibold text-text-muted uppercase tracking-wider mb-2 block">
              ลำดับสกิล
            </span>
            <SkillChain steps={skillSteps} heroes={heroes} />
          </div>
        )}

        {/* Strategy preview */}
        {guide.strategyNotes && (
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
            {guide.strategyNotes}
          </p>
        )}
      </div>
    </Link>
  );
}
