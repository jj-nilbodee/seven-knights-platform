"use client";

import { useState } from "react";
import type { HeroData, SelectedHero } from "./index";
import { Input } from "@/components/ui/input";
import { Search, X, Check, User, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroSelectorProps {
  heroes: HeroData[];
  selectedHeroes: SelectedHero[];
  onSelectionChange: (heroes: SelectedHero[]) => void;
  maxSelection?: number;
  variant: "allied" | "enemy";
  disabled?: boolean;
  suggestedCount?: number;
}

const variantStyles = {
  allied: {
    selectedBorder: "border-cyan ring-2 ring-cyan/30",
    selectedBg: "bg-cyan/10",
    counterBg: "bg-cyan/20 text-cyan",
    stripBg: "bg-cyan/5 border-cyan/20",
  },
  enemy: {
    selectedBorder: "border-accent ring-2 ring-accent/30",
    selectedBg: "bg-accent/10",
    counterBg: "bg-accent/20 text-accent",
    stripBg: "bg-accent/5 border-accent/20",
  },
};

export function HeroSelector({
  heroes,
  selectedHeroes,
  onSelectionChange,
  maxSelection = 3,
  variant,
  disabled = false,
  suggestedCount = 6,
}: HeroSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllHeroes, setShowAllHeroes] = useState(false);
  const styles = variantStyles[variant];

  const suggestedHeroes = heroes.slice(0, suggestedCount);

  const searchResults = searchQuery.trim()
    ? heroes.filter((hero) =>
        hero.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const displayedHeroes = searchQuery.trim()
    ? searchResults
    : showAllHeroes
      ? heroes
      : suggestedHeroes;

  const isSearching = searchQuery.trim().length > 0;
  const hasMoreHeroes = heroes.length > suggestedCount;

  const isSelected = (heroId: string) =>
    selectedHeroes.some((h) => h.heroId === heroId);

  const toggleHeroSelection = (hero: HeroData) => {
    if (disabled) return;

    if (isSelected(hero.id)) {
      onSelectionChange(selectedHeroes.filter((h) => h.heroId !== hero.id));
    } else if (selectedHeroes.length < maxSelection) {
      onSelectionChange([
        ...selectedHeroes,
        { heroId: hero.id, hero, position: null },
      ]);
    }
  };

  const removeHero = (heroId: string) => {
    if (disabled) return;
    onSelectionChange(selectedHeroes.filter((h) => h.heroId !== heroId));
  };

  return (
    <div className="space-y-4">
      {/* Selected heroes strip */}
      {selectedHeroes.length > 0 && (
        <div className={cn("p-3 rounded-[var(--radius-md)] border", styles.stripBg)}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-sm font-medium text-text-primary">
              ฮีโร่ที่เลือก
            </span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                styles.counterBg,
              )}
            >
              {selectedHeroes.length}/{maxSelection}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {selectedHeroes.map(({ heroId, hero }) => (
              <div
                key={heroId}
                className="flex items-center gap-2 bg-bg-card/50 border border-border-dim rounded-[var(--radius-sm)] px-2 py-1.5"
              >
                <div className="w-6 h-8 rounded overflow-hidden bg-bg-surface shrink-0">
                  {hero.imageUrl ? (
                    <img
                      src={hero.imageUrl}
                      alt={hero.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-3 h-3 text-text-muted" />
                    </div>
                  )}
                </div>
                <span className="text-sm text-text-primary">{hero.name}</span>
                <button
                  onClick={() => removeHero(heroId)}
                  disabled={disabled}
                  className="ml-1 p-0.5 rounded hover:bg-accent/20 transition-colors disabled:opacity-50"
                >
                  <X className="w-3 h-3 text-text-muted hover:text-accent" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          type="text"
          placeholder="ค้นหาฮีโร่..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-11"
          disabled={disabled}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-bg-elevated transition-colors"
          >
            <X className="h-3 w-3 text-text-muted" />
          </button>
        )}
      </div>

      {/* Section header */}
      <div className="flex items-center justify-center gap-3 text-sm flex-wrap">
        <span className="text-text-muted">
          {isSearching
            ? `${searchResults.length} ผลลัพธ์สำหรับ "${searchQuery}"`
            : showAllHeroes
              ? `ฮีโร่ทั้งหมด (${heroes.length})`
              : `แนะนำ (${suggestedHeroes.length} จาก ${heroes.length})`}
        </span>
        <span
          className={cn(
            "px-2 py-0.5 rounded-full font-medium",
            styles.counterBg,
          )}
        >
          {selectedHeroes.length}/{maxSelection}
        </span>
      </div>

      {/* Hero grid */}
      {displayedHeroes.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {displayedHeroes.map((hero) => {
            const selected = isSelected(hero.id);
            const canSelect = selected || selectedHeroes.length < maxSelection;

            return (
              <button
                key={hero.id}
                onClick={() => toggleHeroSelection(hero)}
                disabled={disabled || (!selected && !canSelect)}
                className={cn(
                  "relative flex flex-col items-center p-2 md:p-3 rounded-[var(--radius-md)] border transition-all duration-200",
                  "bg-bg-card/50 hover:bg-bg-card/80",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  selected
                    ? cn(styles.selectedBorder, styles.selectedBg)
                    : "border-border-dim hover:border-border-bright",
                )}
              >
                {selected && (
                  <div
                    className={cn(
                      "absolute top-1 right-1 md:top-2 md:right-2 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center z-10",
                      variant === "allied" ? "bg-cyan" : "bg-accent",
                    )}
                  >
                    <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                )}

                <div className="w-16 h-[85px] md:w-20 md:h-[106px] lg:w-24 lg:h-32 rounded-[var(--radius-sm)] overflow-hidden bg-bg-surface mb-2">
                  {hero.imageUrl ? (
                    <img
                      src={hero.imageUrl}
                      alt={hero.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 md:w-10 md:h-10 text-text-muted" />
                    </div>
                  )}
                </div>

                <span className="text-xs md:text-sm font-medium text-text-primary text-center line-clamp-1 w-full px-1">
                  {hero.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Show all / collapse */}
      {!isSearching && hasMoreHeroes && (
        <button
          onClick={() => setShowAllHeroes(!showAllHeroes)}
          disabled={disabled}
          className={cn(
            "w-full py-2 px-4 rounded-[var(--radius-md)] border border-dashed transition-all",
            "text-sm font-medium flex items-center justify-center gap-2",
            "border-border-default text-text-muted hover:border-border-bright hover:text-text-primary hover:bg-bg-card/30",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {showAllHeroes ? (
            <>
              <ChevronUp className="w-4 h-4" />
              แสดงน้อยลง
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              แสดงทั้งหมด {heroes.length} ฮีโร่
            </>
          )}
        </button>
      )}

      {/* Empty state */}
      {displayedHeroes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <User className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">
            {isSearching ? "ไม่พบฮีโร่ที่ค้นหา" : "ไม่มีฮีโร่"}
          </p>
        </div>
      )}
    </div>
  );
}
