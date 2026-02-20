"use client";

import { useState } from "react";
import type { Formation, Position, SelectedHero } from "./index";
import { cn } from "@/lib/utils";
import { User, Plus, X } from "lucide-react";

interface FormationGridProps {
  formation: Formation;
  heroes: SelectedHero[];
  onPositionChange: (heroId: string, position: Position | null) => void;
  variant: "allied" | "enemy";
  disabled?: boolean;
}

const formationConfig: Record<string, { front: number; back: number }> = {
  "4-1": { front: 4, back: 1 },
  "3-2": { front: 3, back: 2 },
  "1-4": { front: 1, back: 4 },
  "2-3": { front: 2, back: 3 },
};

const variantStyles = {
  allied: {
    slotBorder: "border-cyan/30",
    slotHover: "hover:border-cyan/60 hover:bg-cyan/10",
    activeBorder: "border-cyan ring-2 ring-cyan/30",
    heroCard: "border-cyan/40 bg-cyan/10",
    label: "text-cyan",
  },
  enemy: {
    slotBorder: "border-accent/30",
    slotHover: "hover:border-accent/60 hover:bg-accent/10",
    activeBorder: "border-accent ring-2 ring-accent/30",
    heroCard: "border-accent/40 bg-accent/10",
    label: "text-accent",
  },
};

export function FormationGrid({
  formation,
  heroes,
  onPositionChange,
  variant,
  disabled = false,
}: FormationGridProps) {
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const styles = variantStyles[variant];

  if (!formation) {
    return (
      <div className="text-center py-4 text-text-muted text-sm">
        เลือกจัดทัพก่อนเพื่อกำหนดตำแหน่งฮีโร่
      </div>
    );
  }

  const config = formationConfig[formation];
  if (!config) return null;

  const frontHeroes = heroes.filter((h) => h.position === "front");
  const backHeroes = heroes.filter((h) => h.position === "back");
  const unassignedHeroes = heroes.filter((h) => h.position === null);

  const handleHeroClick = (heroId: string) => {
    if (disabled) return;
    setSelectedHeroId(selectedHeroId === heroId ? null : heroId);
  };

  const handleSlotClick = (position: Position) => {
    if (disabled || !selectedHeroId) return;

    const hero = heroes.find((h) => h.heroId === selectedHeroId);
    if (!hero) return;

    const currentCount =
      position === "front" ? frontHeroes.length : backHeroes.length;
    const maxForPosition = position === "front" ? config.front : config.back;

    if (currentCount >= maxForPosition && hero.position !== position) return;

    onPositionChange(selectedHeroId, position);
    setSelectedHeroId(null);
  };

  const handleRemoveFromPosition = (heroId: string) => {
    if (disabled) return;
    onPositionChange(heroId, null);
  };

  const renderHeroInSlot = (hero: SelectedHero) => (
    <div
      key={hero.heroId}
      className={cn(
        "relative flex flex-col items-center p-2 md:p-3 rounded-[var(--radius-md)] border transition-all",
        styles.heroCard,
        "min-w-[70px] md:min-w-[90px]",
      )}
    >
      <button
        onClick={() => handleRemoveFromPosition(hero.heroId)}
        disabled={disabled}
        className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-accent/80 hover:bg-accent flex items-center justify-center transition-colors disabled:opacity-50 z-10"
      >
        <X className="w-3 h-3 md:w-4 md:h-4 text-white" />
      </button>
      <div className="w-14 h-[75px] md:w-16 md:h-[85px] lg:w-20 lg:h-[106px] rounded-[var(--radius-sm)] overflow-hidden bg-bg-surface">
        {hero.hero.imageUrl ? (
          <img
            src={hero.hero.imageUrl}
            alt={hero.hero.name}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-6 h-6 md:w-8 md:h-8 text-text-muted" />
          </div>
        )}
      </div>
      <span className="text-xs md:text-sm text-text-primary mt-1 text-center line-clamp-1 max-w-[70px] md:max-w-[90px]">
        {hero.hero.name}
      </span>
    </div>
  );

  const renderEmptySlot = (position: Position, index: number) => {
    const isClickable = selectedHeroId !== null;
    const currentCount =
      position === "front" ? frontHeroes.length : backHeroes.length;
    const maxForPosition = position === "front" ? config.front : config.back;
    const hasRoom = currentCount < maxForPosition;

    return (
      <button
        key={`${position}-empty-${index}`}
        onClick={() => handleSlotClick(position)}
        disabled={disabled || !isClickable || !hasRoom}
        className={cn(
          "flex flex-col items-center justify-center p-2 md:p-3 rounded-[var(--radius-md)] border-2 border-dashed transition-all",
          "min-w-[70px] min-h-[100px] md:min-w-[90px] md:min-h-[120px] lg:min-h-[140px]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          styles.slotBorder,
          isClickable && hasRoom && styles.slotHover,
        )}
      >
        <Plus className="w-5 h-5 md:w-6 md:h-6 text-text-muted" />
        <span className="text-xs md:text-sm text-text-muted mt-1">
          {position === "front" ? "หน้า" : "หลัง"}
        </span>
      </button>
    );
  };

  const emptyFrontSlots = Math.max(0, config.front - frontHeroes.length);
  const emptyBackSlots = Math.max(0, config.back - backHeroes.length);

  return (
    <div className="space-y-4">
      {/* Front Row */}
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className={cn("text-sm md:text-base font-medium", styles.label)}>
            แถวหน้า
          </span>
          <span className="text-xs md:text-sm text-text-muted">
            ({frontHeroes.length}/{config.front})
          </span>
        </div>
        <div className="flex flex-wrap gap-3 md:gap-4 justify-center min-h-[110px] md:min-h-[140px] p-3 md:p-4 rounded-[var(--radius-md)] bg-bg-card/30 border border-border-dim">
          {frontHeroes.map(renderHeroInSlot)}
          {Array.from({ length: emptyFrontSlots }).map((_, i) =>
            renderEmptySlot("front", i),
          )}
        </div>
      </div>

      {/* Back Row */}
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className={cn("text-sm md:text-base font-medium", styles.label)}>
            แถวหลัง
          </span>
          <span className="text-xs md:text-sm text-text-muted">
            ({backHeroes.length}/{config.back})
          </span>
        </div>
        <div className="flex flex-wrap gap-3 md:gap-4 justify-center min-h-[110px] md:min-h-[140px] p-3 md:p-4 rounded-[var(--radius-md)] bg-bg-card/30 border border-border-dim">
          {backHeroes.map(renderHeroInSlot)}
          {Array.from({ length: emptyBackSlots }).map((_, i) =>
            renderEmptySlot("back", i),
          )}
        </div>
      </div>

      {/* Unassigned Heroes */}
      {unassignedHeroes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm md:text-base font-medium text-text-muted">
              ยังไม่ได้จัดตำแหน่ง
            </span>
            <span className="text-xs md:text-sm text-text-muted">
              (คลิกฮีโร่ แล้วคลิกช่อง)
            </span>
          </div>
          <div className="flex flex-wrap gap-3 md:gap-4 justify-center p-3 md:p-4 rounded-[var(--radius-md)] bg-bg-surface/50 border border-border-dim">
            {unassignedHeroes.map((hero) => (
              <button
                key={hero.heroId}
                onClick={() => handleHeroClick(hero.heroId)}
                disabled={disabled}
                className={cn(
                  "flex flex-col items-center p-2 md:p-3 rounded-[var(--radius-md)] border transition-all",
                  "min-w-[70px] md:min-w-[90px]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  selectedHeroId === hero.heroId
                    ? styles.activeBorder
                    : "border-border-dim bg-bg-card/50 hover:border-border-bright",
                )}
              >
                <div className="w-14 h-[75px] md:w-16 md:h-[85px] lg:w-20 lg:h-[106px] rounded-[var(--radius-sm)] overflow-hidden bg-bg-surface">
                  {hero.hero.imageUrl ? (
                    <img
                      src={hero.hero.imageUrl}
                      alt={hero.hero.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 md:w-8 md:h-8 text-text-muted" />
                    </div>
                  )}
                </div>
                <span className="text-xs md:text-sm text-text-primary mt-1 text-center line-clamp-1 max-w-[70px] md:max-w-[90px]">
                  {hero.hero.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {unassignedHeroes.length === 0 && heroes.length > 0 && (
        <p className="text-sm text-green text-center">
          จัดตำแหน่งฮีโร่ครบทั้ง {heroes.length} ตัวแล้ว
        </p>
      )}
      {unassignedHeroes.length > 0 && (
        <p className="text-sm text-text-muted text-center">
          เหลือ {unassignedHeroes.length} ฮีโร่ยังไม่ได้จัดตำแหน่ง
        </p>
      )}
    </div>
  );
}
