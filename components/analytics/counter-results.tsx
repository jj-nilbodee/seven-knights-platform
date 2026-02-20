"use client";

import { Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CounterRecommendationResult,
  CounterComposition,
  EnemyComposition,
} from "@/lib/db/queries/analytics";

function winRateColor(rate: number) {
  if (rate >= 60) return "text-green";
  if (rate >= 40) return "text-gold";
  return "text-accent";
}

function CounterCard({ counter }: { counter: CounterComposition }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-border-dim bg-bg-elevated p-3">
      <div className="flex flex-wrap gap-1.5">
        {counter.heroNames.map((name, i) => (
          <span
            key={i}
            className="inline-block rounded-[var(--radius-sm)] bg-cyan/10 border border-cyan/20 px-2 py-0.5 text-xs text-cyan"
          >
            {name}
          </span>
        ))}
        {counter.formation && (
          <span className="inline-block rounded-[var(--radius-sm)] bg-gold/10 border border-gold/20 px-2 py-0.5 text-xs text-gold">
            {counter.formation}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="h-1.5 flex-1 rounded-full bg-bg-input overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              counter.winRate >= 60
                ? "bg-green/40"
                : counter.winRate >= 40
                  ? "bg-gold/40"
                  : "bg-accent/40",
            )}
            style={{ width: `${counter.winRate}%` }}
          />
        </div>
        <span className={cn("text-xs font-medium shrink-0", winRateColor(counter.winRate))}>
          {counter.winRate}% ({counter.wins}/{counter.total})
        </span>
      </div>
    </div>
  );
}

function CompositionSection({
  title,
  icon: Icon,
  borderColor,
  composition,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  borderColor: string;
  composition: EnemyComposition;
}) {
  return (
    <div className={cn("rounded-[var(--radius-md)] border p-4", borderColor)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4" />
        <h4 className="text-sm font-medium text-text-primary">{title}</h4>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {composition.heroNames.map((name, i) => (
          <span
            key={i}
            className="inline-block rounded-[var(--radius-sm)] bg-accent/10 border border-accent/20 px-2 py-0.5 text-xs text-accent"
          >
            {name}
          </span>
        ))}
      </div>
      <p className="text-xs text-text-muted">
        พบ {composition.seenCount} ครั้ง · ชนะ {composition.winAgainst} · แพ้{" "}
        {composition.lossAgainst} ·{" "}
        <span className={winRateColor(composition.winRate)}>
          {composition.winRate}%
        </span>
      </p>
    </div>
  );
}

export function CounterResults({
  result,
}: {
  result: CounterRecommendationResult;
}) {
  const hasData =
    result.exactMatch ||
    result.similarCompositions.length > 0 ||
    result.recommendedCounters.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Shield className="h-10 w-10 text-text-muted mb-3 opacity-50" />
        <p className="text-sm text-text-muted">
          ไม่พบข้อมูลเคาน์เตอร์
        </p>
        <p className="text-xs text-text-muted mt-1">
          บันทึกการต่อสู้เพิ่มเติมเพื่อให้ระบบแนะนำได้
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exact match */}
      {result.exactMatch && (
        <CompositionSection
          title="ตรงกันแน่นอน"
          icon={CheckCircle}
          borderColor="border-green/30"
          composition={result.exactMatch}
        />
      )}

      {/* Recommended counters */}
      {result.recommendedCounters.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gold mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            เคาน์เตอร์แนะนำ
          </h4>
          <div className="space-y-2">
            {result.recommendedCounters.map((c, i) => (
              <CounterCard key={i} counter={c} />
            ))}
          </div>
        </div>
      )}

      {/* Similar compositions */}
      {result.similarCompositions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-cyan mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            ทีมที่คล้ายกัน
          </h4>
          <div className="space-y-2">
            {result.similarCompositions.map((comp) => (
              <CompositionSection
                key={comp.compositionId}
                title={comp.heroNames.join(", ")}
                icon={Shield}
                borderColor="border-cyan/20"
                composition={comp}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
