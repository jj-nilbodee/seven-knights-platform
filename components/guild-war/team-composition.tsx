"use client";

import type {
  HeroData,
  Position,
  TeamCompositionState,
  SelectedHero,
  SkillSequenceItem,
} from "./index";
import { HeroSelector } from "./hero-selector";
import { FormationSelector } from "./formation-selector";
import { FormationGrid } from "./formation-grid";
import { SkillSequenceSelector } from "./skill-sequence-selector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gauge } from "lucide-react";

interface TeamCompositionProps {
  heroes: HeroData[];
  state: TeamCompositionState;
  onChange: (state: TeamCompositionState) => void;
  variant: "allied" | "enemy";
  disabled?: boolean;
  loading?: boolean;
  maxHeroes?: number;
}

export function TeamComposition({
  heroes,
  state,
  onChange,
  variant,
  disabled = false,
  loading = false,
  maxHeroes = 3,
}: TeamCompositionProps) {
  const handleHeroSelectionChange = (selectedHeroes: SelectedHero[]) => {
    const selectedHeroIds = new Set(selectedHeroes.map((h) => h.heroId));
    const validSkillSequence = state.skillSequence.filter((skill) =>
      selectedHeroIds.has(skill.heroId),
    );
    const reorderedSequence = validSkillSequence.map((s, index) => ({
      ...s,
      order: (index + 1) as 1 | 2 | 3,
    }));

    onChange({
      ...state,
      selectedHeroes,
      skillSequence: reorderedSequence,
    });
  };

  const handleFormationChange = (formation: typeof state.formation) => {
    const resetHeroes = state.selectedHeroes.map((h) => ({
      ...h,
      position: null,
    }));

    onChange({
      ...state,
      formation,
      selectedHeroes: resetHeroes,
    });
  };

  const handlePositionChange = (heroId: string, position: Position | null) => {
    const updatedHeroes = state.selectedHeroes.map((h) =>
      h.heroId === heroId ? { ...h, position } : h,
    );

    onChange({
      ...state,
      selectedHeroes: updatedHeroes,
    });
  };

  const handleSkillSequenceChange = (sequence: SkillSequenceItem[]) => {
    onChange({
      ...state,
      skillSequence: sequence,
    });
  };

  const handleSpeedChange = (speed: number | "") => {
    onChange({
      ...state,
      speed,
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Selection */}
      <div className="space-y-3">
        <Label className="text-text-primary font-medium block text-center">
          เลือกฮีโร่ (0-{maxHeroes})
        </Label>
        {loading ? (
          <div className="flex items-center justify-center h-32 bg-bg-card/30 rounded-[var(--radius-md)] border border-border-dim">
            <div className="animate-pulse text-text-muted">
              กำลังโหลดฮีโร่...
            </div>
          </div>
        ) : (
          <HeroSelector
            heroes={heroes}
            selectedHeroes={state.selectedHeroes}
            onSelectionChange={handleHeroSelectionChange}
            maxSelection={maxHeroes}
            variant={variant}
            disabled={disabled}
          />
        )}
      </div>

      {/* Formation Selection */}
      <div className="space-y-3">
        <Label className="text-text-primary font-medium block text-center">
          จัดทัพ
        </Label>
        <FormationSelector
          value={state.formation}
          onChange={handleFormationChange}
          maxHeroes={maxHeroes}
          variant={variant}
          disabled={disabled}
        />
      </div>

      {/* Formation Grid */}
      {state.formation && state.selectedHeroes.length > 0 && (
        <div className="space-y-3">
          <Label className="text-text-primary font-medium block text-center">
            ตำแหน่งฮีโร่
          </Label>
          <FormationGrid
            formation={state.formation}
            heroes={state.selectedHeroes}
            onPositionChange={handlePositionChange}
            variant={variant}
            disabled={disabled}
          />
        </div>
      )}

      {/* Skill Sequence */}
      <div className="space-y-3">
        <Label className="text-text-primary font-medium block text-center">
          ลำดับสกิล
        </Label>
        <SkillSequenceSelector
          selectedHeroes={state.selectedHeroes}
          skillSequence={state.skillSequence}
          onSequenceChange={handleSkillSequenceChange}
          variant={variant}
          disabled={disabled}
        />
      </div>

      {/* Speed Input */}
      <div className="space-y-2 flex flex-col items-center">
        <Label
          htmlFor={`${variant}-speed`}
          className="text-text-primary font-medium flex items-center gap-2"
        >
          <Gauge className="w-4 h-4" />
          ความเร็วทีม
        </Label>
        <Input
          id={`${variant}-speed`}
          type="number"
          placeholder="ใส่ความเร็วทีม"
          value={state.speed}
          onChange={(e) => {
            const value = e.target.value;
            handleSpeedChange(value === "" ? "" : parseInt(value, 10));
          }}
          min={0}
          className="h-11 w-[200px] text-center"
          disabled={disabled}
        />
        <p className="text-xs text-text-muted">ค่าความเร็วรวมของทีม</p>
      </div>
    </div>
  );
}
