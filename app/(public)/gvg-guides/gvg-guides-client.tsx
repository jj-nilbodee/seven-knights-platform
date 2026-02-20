"use client";

import { useState } from "react";
import { HeroSearch } from "@/components/gvg-guide/hero-search";
import { GuideCard } from "@/components/gvg-guide/guide-card";

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

function matchGuides(guides: Guide[], selectedHeroes: string[]): Guide[] {
  if (selectedHeroes.length === 0) return guides;
  return guides.filter((g) =>
    selectedHeroes.every((name) => g.defenseHeroes.includes(name)),
  );
}

export function GvgGuidesClient({
  heroes,
  allGuides,
}: {
  heroes: Hero[];
  allGuides: Guide[];
}) {
  const [selectedHeroes, setSelectedHeroes] = useState<string[]>([]);

  const isSearching = selectedHeroes.length > 0;
  const results = matchGuides(allGuides, selectedHeroes);

  return (
    <div className="min-h-screen relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background:
              "radial-gradient(ellipse at center top, rgba(230,57,70,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="absolute inset-0 tactical-grid opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="pt-12 pb-8 px-4 sm:pt-20 sm:pb-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-fade-in-up stagger-1">
              <div className="inline-flex items-center gap-2 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold font-display"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent), var(--accent-dim))",
                    boxShadow: "0 0 20px var(--accent-glow)",
                  }}
                >
                  7K
                </div>
                <span className="font-display font-bold text-sm tracking-wider text-text-secondary uppercase">
                  GVG Attack Guide
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold font-display leading-tight mb-3 animate-fade-in-up stagger-2">
              ค้นหาทีมป้องกันที่เจอ
            </h1>
            <p className="text-text-secondary text-sm sm:text-base mb-8 animate-fade-in-up stagger-3">
              เลือกฮีโร่ป้องกัน 1-3 ตัว
              เพื่อดูคู่มือทีมโจมตีแนะนำพร้อมลำดับสกิล
            </p>

            {/* Search */}
            <div className="animate-fade-in-up stagger-4">
              <HeroSearch
                heroes={heroes}
                selectedHeroes={selectedHeroes}
                onSelect={(name) =>
                  setSelectedHeroes((prev) =>
                    prev.length < 3 ? [...prev, name] : prev,
                  )
                }
                onRemove={(name) =>
                  setSelectedHeroes((prev) =>
                    prev.filter((h) => h !== name),
                  )
                }
              />
            </div>
          </div>
        </header>

        {/* Results */}
        <main className="px-4 pb-20">
          <div className="max-w-3xl mx-auto">
            {/* Results header */}
            {isSearching && (
              <div className="flex items-center justify-between mb-5 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-base text-text-primary">
                    ผลลัพธ์
                  </span>
                  <span className="text-sm text-text-muted bg-bg-elevated px-2.5 py-0.5 rounded-md border border-border-dim">
                    {results.length} รายการ
                  </span>
                </div>
                {results.length > 0 && (
                  <span className="text-sm text-text-muted">
                    เรียงตามลำดับแนะนำ
                  </span>
                )}
              </div>
            )}

            {/* Guide cards */}
            {results.length > 0 && (
              <div className="flex flex-col gap-4">
                {(isSearching ? results : []).map((guide, i) => (
                  <GuideCard
                    key={guide.id}
                    guide={guide}
                    heroes={heroes}
                    index={i}
                  />
                ))}
              </div>
            )}

            {/* No results */}
            {isSearching && results.length === 0 && (
              <div className="text-center py-16 animate-fade-in">
                <p className="text-text-secondary text-base mb-1">
                  ไม่พบคู่มือสำหรับทีมป้องกันนี้
                </p>
                <p className="text-text-muted text-sm">
                  ลองเลือกฮีโร่ตัวอื่น หรือค้นหาด้วยฮีโร่น้อยลง
                </p>
              </div>
            )}

            {/* Default state — show all guides */}
            {!isSearching && (
              <div className="animate-fade-in-up stagger-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-base text-text-primary">
                      คู่มือทั้งหมด
                    </span>
                    <span className="text-sm text-text-muted bg-bg-elevated px-2.5 py-0.5 rounded-md border border-border-dim">
                      {allGuides.length} รายการ
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  {allGuides.map((guide, i) => (
                    <GuideCard
                      key={guide.id}
                      guide={guide}
                      heroes={heroes}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
