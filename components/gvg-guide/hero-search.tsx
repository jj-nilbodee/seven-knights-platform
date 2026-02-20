"use client";

import { useState, useRef, useEffect } from "react";

interface Hero {
  id: string;
  name: string;
  imageUrl: string | null;
}

function HeroPortrait({
  hero,
  size = 36,
}: {
  hero: Hero | undefined;
  size?: number;
}) {
  if (!hero) {
    return (
      <div
        className="hero-portrait"
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
      className="hero-portrait"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        objectFit: "cover",
      }}
    />
  ) : (
    <div
      className="hero-portrait"
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

export function HeroSearch({
  heroes,
  selectedHeroes,
  onSelect,
  onRemove,
}: {
  heroes: Hero[];
  selectedHeroes: string[];
  onSelect: (name: string) => void;
  onRemove: (name: string) => void;
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

  return (
    <div className="w-full max-w-2xl mx-auto">
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
              : "ค้นหาชื่อฮีโร่ป้องกัน..."
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
        เลือกฮีโร่ป้องกัน{" "}
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
