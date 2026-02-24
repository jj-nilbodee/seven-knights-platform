"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HeroData {
  id: string;
  name: string;
  imageUrl: string | null;
}

export function EnemyTeamBuilder({
  heroes,
  onSearch,
  loading,
}: {
  heroes: HeroData[];
  onSearch: (heroIds: string[]) => void;
  loading: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const filtered = heroes.filter(
    (h) =>
      !selectedIds.includes(h.id) &&
      h.name.toLowerCase().includes(search.toLowerCase()),
  );

  function toggleHero(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev,
    );
  }

  function removeHero(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  function handleSearch() {
    if (selectedIds.length === 0) return;
    onSearch(selectedIds);
  }

  function handleClear() {
    setSelectedIds([]);
    setSearch("");
  }

  return (
    <div className="space-y-4">
      {/* Selected heroes */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const hero = heroes.find((h) => h.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-accent/30 bg-accent/10 px-2.5 py-1 text-sm text-accent"
              >
                {hero?.name ?? id.slice(0, 8)}
                <button
                  onClick={() => removeHero(id)}
                  className="hover:text-accent-bright cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search + Hero grid */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาฮีโร่ศัตรู..."
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-60 overflow-y-auto">
        {filtered.slice(0, 40).map((hero) => (
          <button
            key={hero.id}
            onClick={() => toggleHero(hero.id)}
            disabled={selectedIds.length >= 5}
            className={cn(
              "flex flex-col items-center gap-1 rounded-[var(--radius-sm)] border p-2 text-center transition-colors cursor-pointer",
              selectedIds.includes(hero.id)
                ? "border-accent/40 bg-accent/10"
                : "border-border-default hover:border-border-bright",
              selectedIds.length >= 5 && !selectedIds.includes(hero.id)
                ? "opacity-40 cursor-not-allowed"
                : "",
            )}
          >
            {hero.imageUrl ? (
              <Image
                src={hero.imageUrl}
                alt={hero.name}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-text-muted" />
            )}
            <span className="text-[10px] text-text-secondary truncate w-full">
              {hero.name}
            </span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSearch}
          disabled={selectedIds.length === 0 || loading}
          className="cursor-pointer"
        >
          {loading ? "กำลังค้นหา..." : "ค้นหาเคาน์เตอร์"}
        </Button>
        <Button variant="outline" onClick={handleClear} className="cursor-pointer">
          ล้าง
        </Button>
      </div>
    </div>
  );
}
