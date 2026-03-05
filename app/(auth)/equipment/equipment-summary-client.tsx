"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ImageIcon, CheckCircle2, XCircle } from "lucide-react";
import type { MemberEquipment } from "./page";

interface EquipmentSummaryClientProps {
  members: MemberEquipment[];
  submittedCount: number;
  totalCount: number;
}

export function EquipmentSummaryClient({
  members,
  submittedCount,
  totalCount,
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
          <span className="text-accent-bright font-semibold">{submittedCount}</span>
          <span>/</span>
          <span>{totalCount}</span>
          <span>ส่งแล้ว</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${totalCount > 0 ? (submittedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {/* Member list */}
      <div className="rounded-lg border border-border-dim overflow-hidden">
        {members.map((member) => {
          const isExpanded = expandedMember === member.ign;
          const hasSubmitted = member.images.length > 0;

          return (
            <div key={member.memberId} className="border-b border-border-dim last:border-b-0">
              <button
                type="button"
                onClick={() => hasSubmitted && toggleMember(member.ign)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  hasSubmitted
                    ? "hover:bg-bg-elevated cursor-pointer"
                    : "cursor-default opacity-70"
                }`}
              >
                {hasSubmitted ? (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
                  )
                ) : (
                  <div className="h-4 w-4 shrink-0" />
                )}

                {hasSubmitted ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                )}

                <span className="flex-1 text-sm font-medium text-text-primary">
                  {member.ign}
                </span>

                {hasSubmitted ? (
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <ImageIcon className="h-3 w-3" />
                    {member.images.length} รูป
                  </span>
                ) : (
                  <span className="text-xs text-red-400">ยังไม่ส่ง</span>
                )}
              </button>

              {isExpanded && hasSubmitted && (
                <div className="border-t border-border-dim bg-bg-elevated px-4 py-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {member.images.map((image) => (
                      <button
                        key={image.name}
                        type="button"
                        onClick={() => setLightboxImage(image.url)}
                        className="group relative aspect-square rounded-md overflow-hidden border border-border-dim hover:border-accent transition-colors cursor-pointer"
                      >
                        <img
                          src={image.url}
                          alt={image.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                          <p className="text-[10px] text-white truncate">
                            {new Date(image.createdAt).toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
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
