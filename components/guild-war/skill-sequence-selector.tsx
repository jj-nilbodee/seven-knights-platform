"use client";

import type { SelectedHero, SkillSequenceItem } from "./index";
import { cn } from "@/lib/utils";
import { X, ChevronRight, Zap } from "lucide-react";

interface SkillSequenceSelectorProps {
  selectedHeroes: SelectedHero[];
  skillSequence: SkillSequenceItem[];
  onSequenceChange: (sequence: SkillSequenceItem[]) => void;
  variant: "allied" | "enemy";
  disabled?: boolean;
}

const variantStyles = {
  allied: {
    slotBg: "bg-cyan/10 border-cyan/30",
    slotFilled: "bg-cyan/20 border-cyan",
    skillBtn: "hover:border-cyan/60 hover:bg-cyan/10",
    skillSelected: "bg-cyan/30 border-cyan/50",
    orderBadge: "bg-cyan text-white",
  },
  enemy: {
    slotBg: "bg-accent/10 border-accent/30",
    slotFilled: "bg-accent/20 border-accent",
    skillBtn: "hover:border-accent/60 hover:bg-accent/10",
    skillSelected: "bg-accent/30 border-accent/50",
    orderBadge: "bg-accent text-white",
  },
};

function getActiveSkills(selectedHeroes: SelectedHero[]) {
  const skills: Array<{
    heroId: string;
    heroName: string;
    skillId: string;
    skillName: string;
  }> = [];

  for (const { hero } of selectedHeroes) {
    // Skill 1 — ACTIVE
    if (hero.skill1Type === "ACTIVE" && hero.skill1Id) {
      skills.push({
        heroId: hero.id,
        heroName: hero.name,
        skillId: hero.skill1Id,
        skillName: hero.skill1Name,
      });
    }
    // Skill 2 — ACTIVE
    if (hero.skill2Type === "ACTIVE" && hero.skill2Id) {
      skills.push({
        heroId: hero.id,
        heroName: hero.name,
        skillId: hero.skill2Id,
        skillName: hero.skill2Name,
      });
    }
  }

  return skills;
}

export function SkillSequenceSelector({
  selectedHeroes,
  skillSequence,
  onSequenceChange,
  variant,
  disabled = false,
}: SkillSequenceSelectorProps) {
  const styles = variantStyles[variant];

  const availableSkills = getActiveSkills(selectedHeroes);

  const isSkillSelected = (skillId: string) =>
    skillSequence.some((s) => s.skillId === skillId);

  const getNextOrder = (): 1 | 2 | 3 | null => {
    if (skillSequence.length >= 3) return null;
    return (skillSequence.length + 1) as 1 | 2 | 3;
  };

  const addSkill = (skill: {
    heroId: string;
    heroName: string;
    skillId: string;
    skillName: string;
  }) => {
    if (disabled) return;
    const nextOrder = getNextOrder();
    if (!nextOrder) return;
    if (isSkillSelected(skill.skillId)) return;

    onSequenceChange([
      ...skillSequence,
      {
        heroId: skill.heroId,
        skillId: skill.skillId,
        order: nextOrder,
        heroName: skill.heroName,
        skillName: skill.skillName,
      },
    ]);
  };

  const removeSkill = (skillId: string) => {
    if (disabled) return;
    const filtered = skillSequence.filter((s) => s.skillId !== skillId);
    const reordered = filtered.map((s, index) => ({
      ...s,
      order: (index + 1) as 1 | 2 | 3,
    }));
    onSequenceChange(reordered);
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
      <div className="text-center py-4 text-text-muted text-sm">
        เลือกฮีโร่ก่อนเพื่อกำหนดลำดับสกิล
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Skill sequence slots */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-gold" />
          <span className="text-sm font-medium text-text-primary">
            ลำดับสกิล
          </span>
          <span className="text-xs text-text-muted">
            ({skillSequence.length}/3)
          </span>
        </div>

        <div className="flex items-center justify-center gap-1 md:gap-2 flex-wrap">
          {[1, 2, 3].map((order) => {
            const skill = skillSequence.find((s) => s.order === order);

            return (
              <div key={order} className="flex items-center gap-1 md:gap-2">
                {order > 1 && (
                  <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-text-muted" />
                )}
                <div
                  className={cn(
                    "relative flex flex-col items-center justify-center p-2 md:p-3 rounded-[var(--radius-md)] border min-w-[80px] min-h-[60px] md:min-w-[100px] md:min-h-[70px] transition-all",
                    skill
                      ? styles.slotFilled
                      : cn(styles.slotBg, "border-dashed"),
                  )}
                >
                  <div
                    className={cn(
                      "absolute -top-1.5 -left-1.5 md:-top-2 md:-left-2 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      styles.orderBadge,
                    )}
                  >
                    {order}
                  </div>

                  {skill ? (
                    <>
                      <button
                        onClick={() => removeSkill(skill.skillId)}
                        disabled={disabled}
                        className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full bg-accent/80 hover:bg-accent flex items-center justify-center transition-colors disabled:opacity-50"
                      >
                        <X className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                      </button>
                      <span className="text-[10px] md:text-xs text-text-muted">
                        {skill.heroName}
                      </span>
                      <span className="text-xs md:text-sm font-medium text-text-primary text-center line-clamp-1">
                        {skill.skillName}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-text-muted">เลือก</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available skills grouped by hero */}
      <div className="space-y-3 md:space-y-4">
        <div className="text-sm md:text-base font-medium text-text-muted text-center">
          สกิล Active ที่ใช้ได้
        </div>

        <div className="p-3 md:p-4 rounded-[var(--radius-md)] border border-border-dim">
          <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
            {Object.entries(skillsByHero).map(([heroId, skills]) => {
              const heroName = skills[0]?.heroName || "Unknown";

              return (
                <div key={heroId} className="flex flex-col items-center gap-2">
                  <div className="text-xs text-text-muted font-medium">
                    {heroName}
                  </div>
                  <div className="flex gap-2">
                    {skills.map((skill) => {
                      const selected = isSkillSelected(skill.skillId);
                      const canSelect = !selected && skillSequence.length < 3;

                      return (
                        <button
                          key={skill.skillId}
                          onClick={() => addSkill(skill)}
                          disabled={disabled || !canSelect}
                          className={cn(
                            "relative px-3 py-2 md:px-4 md:py-3 rounded-[var(--radius-md)] border text-sm md:text-base transition-all text-text-primary",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            selected
                              ? styles.skillSelected
                              : cn(
                                  "bg-transparent border-text-muted/40",
                                  styles.skillBtn,
                                ),
                          )}
                        >
                          {skill.skillName}
                          {selected && (
                            <span
                              className={cn(
                                "absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
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
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {availableSkills.length === 0 && (
            <div className="text-center py-4 text-text-muted text-sm">
              ไม่มีสกิล Active จากฮีโร่ที่เลือก
            </div>
          )}
        </div>
      </div>

      {skillSequence.length === 3 && (
        <p className="text-sm text-green text-center">ลำดับสกิลครบแล้ว</p>
      )}
      {skillSequence.length > 0 && skillSequence.length < 3 && (
        <p className="text-sm text-accent text-center">
          เลือกอีก {3 - skillSequence.length} สกิลเพื่อให้ครบลำดับ
        </p>
      )}
    </div>
  );
}
