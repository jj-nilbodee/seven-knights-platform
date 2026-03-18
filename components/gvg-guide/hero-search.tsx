"use client";

import { useState, useRef, useEffect } from "react";
import { HeroPortrait } from "@/components/ui/hero-portrait";

interface Hero {
  id: string;
  name: string;
  imageUrl: string | null;
}

export type HeroTeamFilter = "defense" | "attack";

export function HeroSearch({
  heroes,
  selectedHeroes,
  onSelect,
  onRemove,
  teamFilter,
  onTeamFilterChange,
}: {
  heroes: Hero[];
  selectedHeroes: string[];
  onSelect: (name: string) => void;
  onRemove: (name: string) => void;
  teamFilter?: HeroTeamFilter;
  onTeamFilterChange?: (team: HeroTeamFilter) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = !query.trim()
    ? heroes
    : heroes.filter((h) =>
        h.name.toLowerCase().includes(query.toLowerCase()),
      );

  function handleSelect(name: string) {
    if (selectedHeroes.length >= 3) return;
    if (selectedHeroes.includes(name)) return;
    onSelect(name);
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[activeIndex].name);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (
      e.key === "Backspace" &&
      query === "" &&
      selectedHeroes.length > 0
    ) {
      onRemove(selectedHeroes[selectedHeroes.length - 1]);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const heroByName = (name: string) => heroes.find((h) => h.name === name);

  const activeTeam = teamFilter ?? "defense";
  const teamLabel = activeTeam === "defense" ? "ป้องกัน" : "โจมตี";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Team toggle */}
      {onTeamFilterChange && (
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-1 rounded-[var(--radius-md)] bg-bg-elevated border border-border-dim p-1">
            <button
              type="button"
              onClick={() => onTeamFilterChange("defense")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold transition-all cursor-pointer ${
                activeTeam === "defense"
                  ? "bg-bg-card text-cyan border border-cyan/40 shadow-sm"
                  : "text-text-muted border border-transparent hover:text-text-secondary"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
              ทีมป้องกัน
            </button>
            <button
              type="button"
              onClick={() => onTeamFilterChange("attack")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold transition-all cursor-pointer ${
                activeTeam === "attack"
                  ? "bg-bg-card text-accent border border-accent/40 shadow-sm"
                  : "text-text-muted border border-transparent hover:text-text-secondary"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="m16 16 3.5 3.5"/><path d="M19 21.5 21.5 19"/></svg>
              ทีมโจมตี
            </button>
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="search-input-wrapper">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={
            selectedHeroes.length >= 3
              ? "เลือกครบ 3 ฮีโร่แล้ว"
              : `ค้นหาชื่อฮีโร่${teamLabel}...`
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={selectedHeroes.length >= 3}
          autoComplete="off"
        />

        {/* Autocomplete dropdown */}
        {isOpen && selectedHeroes.length < 3 && filtered.length > 0 && (
          <div
            ref={dropdownRef}
            className="autocomplete-dropdown animate-slide-down"
          >
            {filtered.map((hero, i) => {
              const isSelected = selectedHeroes.includes(hero.name);
              return (
                <div
                  key={hero.id}
                  className={`autocomplete-item ${i === activeIndex ? "autocomplete-item-active" : ""} ${isSelected ? "autocomplete-item-selected" : ""}`}
                  onClick={() => handleSelect(hero.name)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <HeroPortrait hero={hero} size={36} />
                  <span className="text-sm font-medium text-text-primary">
                    {hero.name}
                  </span>
                  {isSelected && (
                    <span className="ml-auto text-xs text-text-muted">
                      เลือกแล้ว
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isOpen && filtered.length === 0 && query.trim() !== "" && (
          <div className="autocomplete-dropdown animate-slide-down">
            <div className="px-4 py-6 text-center text-text-muted text-sm">
              ไม่พบฮีโร่ &ldquo;{query}&rdquo;
            </div>
          </div>
        )}
      </div>

      {/* 3 hero slots */}
      <div className="hero-slots-row">
        {[0, 1, 2].map((i) => {
          const name = selectedHeroes[i];
          const hero = name ? heroByName(name) : undefined;
          return (
            <div
              key={i}
              className={`hero-slot ${name ? "hero-slot-filled" : ""}`}
            >
              {name && hero ? (
                <button
                  className="hero-slot-inner"
                  onClick={() => onRemove(name)}
                  type="button"
                >
                  <HeroPortrait hero={hero} size={48} />
                  <span className="hero-slot-name">{name}</span>
                  <span className="hero-slot-remove">&times;</span>
                </button>
              ) : (
                <div className="hero-slot-empty">
                  <span className="hero-slot-number">{i + 1}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-text-muted mt-2 font-display text-center">
        เลือกฮีโร่{teamLabel}{" "}
        <span
          className={`font-bold ${selectedHeroes.length === 3 ? "text-green" : "text-accent"}`}
        >
          {selectedHeroes.length}/3
        </span>{" "}
        ตัว
      </p>
    </div>
  );
}
