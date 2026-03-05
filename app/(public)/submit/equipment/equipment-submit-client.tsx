"use client";

import { useState, useRef } from "react";
import { TEAM_SCENARIOS, TOTAL_CRITERIA } from "./team-scenarios";
import { uploadEquipmentImage } from "@/actions/equipment";

interface Member {
  id: string;
  ign: string;
}

interface ImageSlot {
  file: File;
  preview: string;
}

export function EquipmentSubmitClient({
  members,
}: {
  members: Member[];
}) {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [images, setImages] = useState<Record<string, ImageSlot>>({});
  const [expandedScenarios, setExpandedScenarios] = useState<
    Record<string, boolean>
  >(() => Object.fromEntries(TEAM_SCENARIOS.map((s) => [s.id, true])));
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [uploadedCount, setUploadedCount] = useState(0);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const filledCount = Object.keys(images).length;

  function toggleScenario(scenarioId: string) {
    setExpandedScenarios((prev) => ({
      ...prev,
      [scenarioId]: !prev[scenarioId],
    }));
  }

  function handleFile(criterionId: string, file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImages((prev) => ({
        ...prev,
        [criterionId]: { file, preview: e.target?.result as string },
      }));
    };
    reader.readAsDataURL(file);
  }

  function removeImage(criterionId: string) {
    setImages((prev) => {
      const next = { ...prev };
      delete next[criterionId];
      return next;
    });
  }

  async function handleSubmit() {
    if (!selectedMember || filledCount === 0) return;

    setUploading(true);
    setError("");
    setUploadedCount(0);

    try {
      const entries = Object.entries(images);
      for (let i = 0; i < entries.length; i++) {
        const [criterionId, slot] = entries[i];
        const formData = new FormData();
        formData.set("ign", selectedMember.ign);
        formData.set("criterionId", criterionId);
        formData.set("file", slot.file);

        const result = await uploadEquipmentImage(formData);
        if (result.error) {
          throw new Error(result.error);
        }

        setUploadedCount(i + 1);
      }

      setDone(true);
      setImages({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setUploading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-green/30 bg-green/5 p-6 text-center">
        <div className="text-3xl mb-2">&#10003;</div>
        <p className="text-green text-lg font-semibold mb-1">
          อัปโหลดสำเร็จ!
        </p>
        <p className="text-text-muted text-sm mb-4">
          ส่งรูปอุปกรณ์ของ {selectedMember?.ign} เรียบร้อยแล้ว ({filledCount}{" "}
          รูป)
        </p>
        <button
          onClick={() => {
            setDone(false);
            setSelectedMemberId("");
          }}
          className="rounded-md bg-bg-elevated px-4 py-2 text-sm text-text-primary hover:bg-bg-card transition-colors"
        >
          ส่งรูปอีกคน
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Member selector */}
      <div>
        <label className="block text-sm text-text-secondary mb-2">
          เลือกสมาชิก
        </label>
        <select
          value={selectedMemberId}
          onChange={(e) => {
            setSelectedMemberId(e.target.value);
            setImages({});
          }}
          className="w-full rounded-md border border-border-default bg-bg-input px-3 py-2.5 text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">-- เลือกชื่อ --</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.ign}
            </option>
          ))}
        </select>
      </div>

      {/* Team scenarios */}
      {selectedMemberId && (
        <>
          <p className="text-xs text-text-muted">
            อัปโหลดรูปอุปกรณ์ตามหัวข้อด้านล่าง ({filledCount}/{TOTAL_CRITERIA}{" "}
            รูป)
          </p>

          {TEAM_SCENARIOS.map((scenario) => {
            const scenarioFilled = scenario.criteria.filter(
              (c) => images[c.id],
            ).length;
            const isExpanded = expandedScenarios[scenario.id];

            return (
              <div
                key={scenario.id}
                className="rounded-lg border border-border-default bg-bg-card overflow-hidden"
              >
                {/* Scenario header */}
                <button
                  onClick={() => toggleScenario(scenario.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-elevated/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">
                        {scenario.title}
                      </span>
                      <span className="text-xs text-text-muted shrink-0">
                        {scenarioFilled}/{scenario.criteria.length}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 truncate">
                      {scenario.description}
                    </p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-text-muted shrink-0 ml-2 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Criteria list */}
                {isExpanded && (
                  <div className="border-t border-border-dim px-4 py-3 space-y-3">
                    {scenario.criteria.map((criterion) => {
                      const slot = images[criterion.id];
                      return (
                        <div
                          key={criterion.id}
                          className="flex gap-3 items-start"
                        >
                          {/* Upload slot */}
                          <div className="shrink-0">
                            {slot ? (
                              <div className="relative group">
                                <img
                                  src={slot.preview}
                                  alt={criterion.heroName}
                                  className="w-20 h-20 object-cover rounded-md border border-border-dim"
                                />
                                <button
                                  onClick={() => removeImage(criterion.id)}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  &times;
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() =>
                                  fileInputRefs.current[criterion.id]?.click()
                                }
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleFile(
                                    criterion.id,
                                    e.dataTransfer.files[0] ?? null,
                                  );
                                }}
                                className="w-20 h-20 flex items-center justify-center rounded-md border-2 border-dashed border-border-default bg-bg-input/50 cursor-pointer hover:border-accent/50 transition-colors"
                              >
                                <svg
                                  className="w-6 h-6 text-text-muted"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                              </div>
                            )}
                            <input
                              ref={(el) => {
                                fileInputRefs.current[criterion.id] = el;
                              }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFile(
                                  criterion.id,
                                  e.target.files?.[0] ?? null,
                                )
                              }
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary">
                              {criterion.heroName}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                              {criterion.requirements}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Error */}
          {error && <p className="text-accent text-sm">{error}</p>}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={filledCount === 0 || uploading}
            className="w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-bright disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {uploading
              ? `กำลังอัปโหลด... (${uploadedCount}/${filledCount})`
              : `อัปโหลด ${filledCount}/${TOTAL_CRITERIA} รูป`}
          </button>
        </>
      )}
    </div>
  );
}
