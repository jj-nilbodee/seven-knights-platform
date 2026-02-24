"use client";

import type { SelectedHero, SkillSequenceItem } from "./index";
import { cn } from "@/lib/utils";

interface SkillSequenceSelectorProps {
  selectedHeroes: SelectedHero[];
  skillSequence: SkillSequenceItem[];
  onSequenceChange: (sequence: SkillSequenceItem[]) => void;
  variant: "allied" | "enemy";
  disabled?: boolean;
  historicalSequences?: Array<{ heroId: string; skillId: string; order: number }[]>;
}

const variantStyles = {
  allied: {
    skillBtn: "hover:border-cyan/60 hover:bg-cyan/10",
    skillSelected: "bg-cyan/20 border-cyan/50",
    orderBadge: "bg-cyan text-text-inverse",
  },
  enemy: {
    skillBtn: "hover:border-accent/60 hover:bg-accent/10",
    skillSelected: "bg-accent/20 border-accent/50",
    orderBadge: "bg-accent text-text-inverse",
  },
};

function getActiveSkills(selectedHeroes: SelectedHero[]) {
  const skills: Array<{
    heroId: string;
    heroName: string;
    skillId: string;
    skillLabel: string;
  }> = [];

  for (const { hero } of selectedHeroes) {
    if (hero.skill1Type === "ACTIVE" && hero.skill1Id) {
      skills.push({
        heroId: hero.id,
        heroName: hero.name,
        skillId: hero.skill1Id,
        skillLabel: "S1 ล่าง",
      });
    }
    if (hero.skill2Type === "ACTIVE" && hero.skill2Id) {
      skills.push({
        heroId: hero.id,
        heroName: hero.name,
        skillId: hero.skill2Id,
        skillLabel: "S2 บน",
      });
    }
  }

  return skills;
}

function getSuggestedSkillId(
  skillSequence: SkillSequenceItem[],
  historicalSequences: Array<{ heroId: string; skillId: string; order: number }[]> | undefined,
): string | null {
  if (!historicalSequences || historicalSequences.length === 0) return null;
  if (skillSequence.length >= 3) return null;

  const nextPosition = skillSequence.length + 1;

  // Filter sequences that match the current prefix
  const matching = historicalSequences.filter((seq) => {
    for (const current of skillSequence) {
      const entry = seq.find((s) => s.order === current.order);
      if (!entry || entry.skillId !== current.skillId) return false;
    }
    return true;
  });

  if (matching.length === 0) return null;

  // Count which skillId appears most at the next position
  const counts = new Map<string, number>();
  for (const seq of matching) {
    const next = seq.find((s) => s.order === nextPosition);
    if (next) {
      counts.set(next.skillId, (counts.get(next.skillId) ?? 0) + 1);
    }
  }

  if (counts.size === 0) return null;

  let bestSkillId = "";
  let bestCount = 0;
  for (const [skillId, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestSkillId = skillId;
    }
  }

  return bestSkillId || null;
}

export function SkillSequenceSelector({
  selectedHeroes,
  skillSequence,
  onSequenceChange,
  variant,
  disabled = false,
  historicalSequences,
}: SkillSequenceSelectorProps) {
  const styles = variantStyles[variant];

  const availableSkills = getActiveSkills(selectedHeroes);

  const suggestedSkillId = getSuggestedSkillId(skillSequence, historicalSequences);

  const isSkillSelected = (skillId: string) =>
    skillSequence.some((s) => s.skillId === skillId);

  const getNextOrder = (): 1 | 2 | 3 | null => {
    if (skillSequence.length >= 3) return null;
    return (skillSequence.length + 1) as 1 | 2 | 3;
  };

  const toggleSkill = (skill: {
    heroId: string;
    heroName: string;
    skillId: string;
    skillLabel: string;
  }) => {
    if (disabled) return;

    if (isSkillSelected(skill.skillId)) {
      const filtered = skillSequence.filter((s) => s.skillId !== skill.skillId);
      const reordered = filtered.map((s, index) => ({
        ...s,
        order: (index + 1) as 1 | 2 | 3,
      }));
      onSequenceChange(reordered);
      return;
    }

    const nextOrder = getNextOrder();
    if (!nextOrder) return;

    onSequenceChange([
      ...skillSequence,
      {
        heroId: skill.heroId,
        skillId: skill.skillId,
        order: nextOrder,
        heroName: skill.heroName,
        skillLabel: skill.skillLabel,
      },
    ]);
  };

  // Group skills by hero
  const skillsByHero: Record<string, typeof availableSkills> = {};
  for (const skill of availableSkills) {
    if (!skillsByHero[skill.heroId]) {
      skillsByHero[skill.heroId] = [];
    }
    skillsByHero[skill.heroId].push(skill);
  }

  if (selectedHeroes.length === 0) {
    return (
      <div className="text-xs text-text-muted py-1">
        เลือกฮีโร่ก่อน
      </div>
    );
  }

  if (availableSkills.length === 0) {
    return (
      <div className="text-xs text-text-muted py-1">
        ไม่มีสกิล Active
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center">
      {Object.entries(skillsByHero).map(([heroId, skills]) => {
        const heroName = skills[0]?.heroName || "?";

        return (
          <div key={heroId} className="flex items-center gap-1">
            <span className="text-[10px] text-text-muted mr-0.5 max-w-15 truncate">
              {heroName}
            </span>
            {skills.map((skill) => {
              const selected = isSkillSelected(skill.skillId);
              const canSelect = !selected && skillSequence.length < 3;
              const isSuggested = !selected && canSelect && suggestedSkillId === skill.skillId;

              return (
                <button
                  key={skill.skillId}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  disabled={disabled || (!selected && !canSelect)}
                  className={cn(
                    "relative px-2 py-1 rounded-sm border text-xs transition-all cursor-pointer",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    selected
                      ? styles.skillSelected
                      : isSuggested
                        ? "bg-gold/10 border-gold/50 shadow-[0_0_6px_rgba(255,215,0,0.2)]"
                        : cn(
                            "bg-transparent border-text-muted/30",
                            styles.skillBtn,
                          ),
                  )}
                >
                  {skill.skillLabel}
                  {selected && (
                    <span
                      className={cn(
                        "absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                        styles.orderBadge,
                      )}
                    >
                      {
                        skillSequence.find(
                          (s) => s.skillId === skill.skillId,
                        )?.order
                      }
                    </span>
                  )}
                  {isSuggested && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-gold border border-gold/80" />
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
