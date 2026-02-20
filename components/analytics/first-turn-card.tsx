"use client";

import { Zap, TrendingUp, Minus } from "lucide-react";
import type { FirstTurnAnalysis } from "@/lib/db/queries/analytics";

export function FirstTurnCard({ analysis }: { analysis: FirstTurnAnalysis }) {
  const hasData = analysis.alliedFirstTotal > 0 || analysis.enemyFirstTotal > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Zap className="h-10 w-10 text-text-muted mb-3 opacity-50" />
        <p className="text-sm text-text-muted">ยังไม่มีข้อมูลลำดับตา</p>
        <p className="text-xs text-text-muted mt-1">
          บันทึกข้อมูล &quot;ลงมือก่อน&quot; เพื่อดูสถิติ
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Allied first */}
        <div className="rounded-[var(--radius-md)] border border-cyan/20 bg-cyan/5 p-4">
          <p className="text-xs font-medium text-cyan uppercase tracking-wider">
            ฝ่ายเราลงมือก่อน
          </p>
          <p className="font-display text-3xl font-bold text-text-primary mt-2">
            {analysis.alliedFirstWinRate}%
          </p>
          <p className="text-xs text-text-muted mt-1">
            ชนะ {analysis.alliedFirstWins} / {analysis.alliedFirstTotal} ครั้ง
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-bg-input overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan/40"
              style={{ width: `${analysis.alliedFirstWinRate}%` }}
            />
          </div>
        </div>

        {/* Enemy first */}
        <div className="rounded-[var(--radius-md)] border border-accent/20 bg-accent/5 p-4">
          <p className="text-xs font-medium text-accent uppercase tracking-wider">
            ศัตรูลงมือก่อน
          </p>
          <p className="font-display text-3xl font-bold text-text-primary mt-2">
            {analysis.enemyFirstWinRate}%
          </p>
          <p className="text-xs text-text-muted mt-1">
            ชนะ {analysis.enemyFirstWins} / {analysis.enemyFirstTotal} ครั้ง
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-bg-input overflow-hidden">
            <div
              className="h-full rounded-full bg-accent/40"
              style={{ width: `${analysis.enemyFirstWinRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Advantage delta */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-4 text-center">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
          ข้อได้เปรียบลงมือก่อน
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          {analysis.advantageDelta > 0 ? (
            <TrendingUp className="h-5 w-5 text-green" />
          ) : analysis.advantageDelta < 0 ? (
            <TrendingUp className="h-5 w-5 text-accent rotate-180" />
          ) : (
            <Minus className="h-5 w-5 text-text-muted" />
          )}
          <span
            className={`font-display text-2xl font-bold ${
              analysis.advantageDelta > 0
                ? "text-green"
                : analysis.advantageDelta < 0
                  ? "text-accent"
                  : "text-text-muted"
            }`}
          >
            {analysis.advantageDelta > 0 ? "+" : ""}
            {analysis.advantageDelta}%
          </span>
        </div>
        <p className="text-xs text-text-muted mt-1">
          {analysis.advantageDelta > 5
            ? "การลงมือก่อนมีข้อได้เปรียบอย่างมาก"
            : analysis.advantageDelta > 0
              ? "การลงมือก่อนมีข้อได้เปรียบเล็กน้อย"
              : analysis.advantageDelta < -5
                ? "การลงมือทีหลังมีข้อได้เปรียบมากกว่า"
                : analysis.advantageDelta < 0
                  ? "การลงมือทีหลังมีข้อได้เปรียบเล็กน้อย"
                  : "ไม่มีข้อได้เปรียบชัดเจน"}
        </p>
      </div>
    </div>
  );
}
