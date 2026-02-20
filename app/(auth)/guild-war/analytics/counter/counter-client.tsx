"use client";

import { useState, useTransition } from "react";
import { EnemyTeamBuilder } from "@/components/analytics/enemy-team-builder";
import { CounterResults } from "@/components/analytics/counter-results";
import { searchCounterRecommendations } from "@/actions/analytics";
import type { CounterRecommendationResult } from "@/lib/db/queries/analytics";

interface HeroData {
  id: string;
  name: string;
  imageUrl: string | null;
}

export function CounterClient({ heroes, guildId }: { heroes: HeroData[]; guildId: string }) {
  const [result, setResult] = useState<CounterRecommendationResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch(heroIds: string[], formation: string | null) {
    setError(null);
    startTransition(async () => {
      const res = await searchCounterRecommendations(heroIds, formation, guildId);
      if ("error" in res && res.error) {
        setError(res.error);
        setResult(null);
      } else if ("data" in res && res.data) {
        setResult(res.data);
      }
    });
  }

  return (
    <div className="space-y-6">
      <EnemyTeamBuilder
        heroes={heroes}
        onSearch={handleSearch}
        loading={isPending}
      />

      {error && (
        <p className="text-sm text-accent">{error}</p>
      )}

      {result && <CounterResults result={result} />}
    </div>
  );
}
