"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { TEAM_SCENARIOS, TOTAL_CRITERIA } from "@/app/(public)/submit/equipment/team-scenarios";
import type { MemberEquipment } from "./page";

interface EquipmentSummaryClientProps {
  members: MemberEquipment[];
  submittedCount: number;
  totalCount: number;
  totalCriteria: number;
}

export function EquipmentSummaryClient({
  members,
  submittedCount,
  totalCount,
  totalCriteria,
}: EquipmentSummaryClientProps) {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  function toggleMember(ign: string) {
    setExpandedMember((prev) => (prev === ign ? null : ign));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">อุปกรณ์</h1>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span className="text-accent-bright font-semibold">
            {submittedCount}
          </span>
          <span>/</span>
          <span>{totalCount}</span>
          <span>ส่งแล้ว</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{
            width: `${totalCount > 0 ? (submittedCount / totalCount) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Member list */}
      <div className="rounded-lg border border-border-dim overflow-hidden">
        {members.map((member) => {
          const isExpanded = expandedMember === member.ign;
          const filledCount = Object.keys(member.imagesByCriterion).length;
          const hasSubmitted = filledCount > 0;

          return (
            <div
              key={member.memberId}
              className="border-b border-border-dim last:border-b-0"
            >
              <button
                type="button"
                onClick={() => toggleMember(member.ign)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-elevated cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
                )}

                {hasSubmitted ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                )}

                <span className="flex-1 text-sm font-medium text-text-primary">
                  {member.ign}
                </span>

                <span
                  className={`text-xs ${filledCount === totalCriteria ? "text-green-500" : hasSubmitted ? "text-text-muted" : "text-red-400"}`}
                >
                  {hasSubmitted
                    ? `${filledCount}/${totalCriteria}`
                    : "ยังไม่ส่ง"}
                </span>
              </button>

              {isExpanded && (
                <div className="border-t border-border-dim bg-bg-elevated px-4 py-4 space-y-4">
                  {TEAM_SCENARIOS.map((scenario) => {
                    const scenarioFilled = scenario.criteria.filter(
                      (c) => member.imagesByCriterion[c.id],
                    ).length;

                    return (
                      <div key={scenario.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-text-secondary">
                            {scenario.title}
                          </span>
                          <span
                            className={`text-[10px] ${scenarioFilled === scenario.criteria.length ? "text-green-500" : "text-text-muted"}`}
                          >
                            {scenarioFilled}/{scenario.criteria.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {scenario.criteria.map((criterion) => {
                            const image =
                              member.imagesByCriterion[criterion.id];
                            return (
                              <div key={criterion.id}>
                                {image ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLightboxImage(image.url)
                                    }
                                    className="group relative w-full aspect-square rounded-md overflow-hidden border border-border-dim hover:border-accent transition-colors cursor-pointer"
                                  >
                                    <img
                                      src={image.url}
                                      alt={criterion.heroName}
                                      className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                      <p className="text-[10px] text-white truncate">
                                        {criterion.heroName}
                                      </p>
                                    </div>
                                  </button>
                                ) : (
                                  <div className="w-full aspect-square rounded-md border-2 border-dashed border-red-400/30 bg-red-400/5 flex flex-col items-center justify-center gap-1">
                                    <XCircle className="h-4 w-4 text-red-400/50" />
                                    <span className="text-[10px] text-red-400/70">
                                      {criterion.heroName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {members.length === 0 && (
          <div className="flex items-center justify-center h-40 text-text-muted text-sm">
            ไม่มีสมาชิก
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxImage(null)}
          onKeyDown={(e) => e.key === "Escape" && setLightboxImage(null)}
          role="button"
          tabIndex={0}
        >
          <img
            src={lightboxImage}
            alt="Equipment"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
