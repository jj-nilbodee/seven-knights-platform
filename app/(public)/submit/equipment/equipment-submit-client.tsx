"use client";

import { useState, useRef } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

interface Member {
  id: string;
  ign: string;
}

interface Criterion {
  id: string;
  heroName: string;
  requirements: string;
}

interface TeamScenario {
  id: string;
  title: string;
  description: string;
  criteria: Criterion[];
}

const TEAM_SCENARIOS: TeamScenario[] = [
  {
    id: "team1-lipo",
    title: "1. ทีมบุก ลิโป้ที่ไม่มีเอมิเลีย",
    description: "ลิง/เกล/ธรูด",
    criteria: [
      {
        id: "t1-ling",
        heroName: "ลิง",
        requirements:
          "เซ็ตต้าน บล็อค 100 ลดความเสียหาย 1-2 ตัว (รวมคารัม)",
      },
      {
        id: "t1-gel",
        heroName: "เกล",
        requirements:
          "เซ็ตต้าน บล็อครวม 52 อาวุธป้อง 1650 เสื้อลด 2 ตัว (รวมคารัม)",
      },
      {
        id: "t1-thrud",
        heroName: "ธรูด",
        requirements:
          "เซ็ตจุดอ่อน ดาเมจ 3000+ บล็อค 40 จุดอ่อนร้อย ลดความเสียหาย 2 ตัว",
      },
    ],
  },
  {
    id: "team2-magic",
    title: "2. บุกทีมเวทย์",
    description:
      "พาลานอส อารากอน รีน่า (อารากอนต้องอัพตีธรรมดา ถ้ามันไม่มีมิเลีย ใส่เพลตันแทนรีน่าได้) สัตว์ ไพค์ เปิดสกิล อารากอน ล่างพาลานอส บนพาลานอส",
    criteria: [
      {
        id: "t2-palanos",
        heroName: "พาลานอส",
        requirements:
          "เซ็ตบอส ทำคริ 100 เกราะลดดาเมจ 2 ชิ้น atk กับ cri dmg เยอะๆ แหวนตายเกิด/ซอมบี้",
      },
      {
        id: "t2-aragon",
        heroName: "อารากอน",
        requirements:
          "เซ็ตบล็อค ทำบล็อค 100 อาวุธ def% เกราะลดดาเมจ 2 ตัว แหวนตายเกิด 5+",
      },
      {
        id: "t2-reena",
        heroName: "รีน่า",
        requirements:
          "เซ็ตบล็อค ทำบล็อค 100 อาวุธ hp% เกราะลดดาเมจ 2 ชิ้น แหวนตายเกิด 5+",
      },
    ],
  },
  {
    id: "team3-radgrid-solo",
    title: "3. บุกทีมแรดกริด",
    description:
      "ลิง เกล/เอลิเซีย สัตว์ไม่ยู และมันไม่ซ้อนเดท — ใช้แรดกริดตัวเดียว สัตว์ลู",
    criteria: [
      {
        id: "t3-radgrid",
        heroName: "แรดกริด",
        requirements:
          "เซ็ตบล็อค บล็อค 100 (รวมแหวน) อาวุธ def% 2 ชิ้น เกราะลดดาเมจ 2 ชิ้น แหวน block 10% ซ้อน def 10% ได้เลย ไว้เช็คของฝั่งนุ้นได้ ไม้แรกยอมให้แพ้เดทได้ ทำ def รวมให้ฮิวทีละ 2000+",
      },
    ],
  },
  {
    id: "team4-date",
    title: "4. บุก แรดกริด ลิง เอส",
    description:
      "ใช้ทีมเดท คริส น็อก พระแม่ สัตว์ เมลเปโร่",
    criteria: [
      {
        id: "t4-chris",
        heroName: "คริส",
        requirements:
          "เซ็ตหมอผี ทำบล็อค 50+ ต้าน 70+ ติดสปีด แหวนตายเกิด 4",
      },
      {
        id: "t4-nok",
        heroName: "น็อก",
        requirements:
          "เซ็ตหมอผี ทำบล็อค 60+ ต้าน 70+ ติดสปีด แหวนตายเกิด/ซอมบี้",
      },
      {
        id: "t4-goddess",
        heroName: "พระแม่",
        requirements:
          "เซ็ตบล็อค บล็อค 100 ลดดาเมจ 2 ชิ้น แหวนตายเกิด 5+",
      },
    ],
  },
  {
    id: "team5-radgrid-ling-s",
    title: "5. บุก แรดกริด ลิง เกล สัตว์ยู/สัตว์ปกติที่ซ้อนเดท",
    description:
      "ใช้ แรดกริด ลิง เอส สัตว์ยู ถ้าแหวนเหลือ ใส่ตายเกิดจัดเต็มทั้ง 3 ตัวเลย สกิล บนลิง ล่างเอส ล่างลิง (ถ้ารุ้สกิลฝั่งนุ้นแล้ว ให้ล่างเอสหลังลิงมันบน)",
    criteria: [
      {
        id: "t5-radgrid",
        heroName: "แรดกริด",
        requirements:
          "เซ็ตบล็อค บล็อค 100 อาวุธ def% เกราะลดดาเมจ 2 ชิ้น",
      },
      {
        id: "t5-ling",
        heroName: "ลิง",
        requirements:
          "เซ็ตจุดอ่อน บล็อค 100 อาวุธ atk% เกราะลดดาเมจ 2 ชิ้น จุดอ่อนสัก 50 ได้ก็ดี",
      },
      {
        id: "t5-s",
        heroName: "เอส",
        requirements: "เซ็ตบล็อค บล็อค 100 ลดดาเมจ 2 ชิ้น",
      },
    ],
  },
  {
    id: "team6-ryan",
    title: "6. บุก พาลานอส โรซี่ น็อก",
    description:
      "ใช้ ไรอัน เตียวเสี้ยน ไพร์ สัตว์ดาเมจอะไรก็ได้ (อีรีน รีเชล เดลโล่) *เงื่อนไขหลักคือต้องได้เปิดก่อนเท่านั้น สกิล บนไรอัน บนเตียว ล่างไรอัน",
    criteria: [
      {
        id: "t6-ryan",
        heroName: "ไรอัน",
        requirements:
          "เซ็ตจุดอ่อน ทำจุดอ่อน 100 คริ 90+ ติดสปีด แหวนซอมบี้/ตายเกิด",
      },
      {
        id: "t6-pyre",
        heroName: "ไพร์",
        requirements:
          "เซ็ตจุดอ่อน จุดอ่อน 100 คริเยอะๆ ติดสปีด แหวนซอมบี้",
      },
      {
        id: "t6-tiao",
        heroName: "เตียว",
        requirements: "เซ็ตบล็อค บล็อค 100 ติดสปีด",
      },
    ],
  },
  {
    id: "team7-emilia",
    title: "7. บุก แรดกริด ลิง เอลิเซีย สัตว์ยู/มันซ้อนเดท",
    description:
      "ใช้ โป้ แฝด เอมิเลีย สัตว์อีรีน *เปิดก่อน เปิดบนเอมิเลีย บนแฝด ล่างโป้",
    criteria: [
      {
        id: "t7-po",
        heroName: "โป้",
        requirements:
          "เซ็ตจุดอ่อน จุดอ่อน 100 คริ 100 ติดสปีด",
      },
      {
        id: "t7-twins",
        heroName: "แฝด",
        requirements:
          "เซ็ตต้าน จุดอ่อน 100 คริ 90+ atk เยอะๆ สปีดต่ำสุดในทีม",
      },
      {
        id: "t7-emilia",
        heroName: "เอมิเลีย",
        requirements: "เข้าเป้า 51% ยำสปีด แหวนซอมบี้",
      },
    ],
  },
];

const TOTAL_CRITERIA = TEAM_SCENARIOS.reduce(
  (sum, s) => sum + s.criteria.length,
  0,
);

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
      const supabase = createBrowserClient();
      const safeName = selectedMember.ign
        .replace(/[^a-zA-Z0-9ก-๙-]/g, "")
        .slice(0, 50);

      const entries = Object.entries(images);
      for (let i = 0; i < entries.length; i++) {
        const [criterionId, slot] = entries[i];
        const ext = (slot.file.name.split(".").pop() ?? "png").toLowerCase();
        const path = `equipment/${safeName}/${criterionId}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("hero-images")
          .upload(path, slot.file, { upsert: true });

        if (uploadError) {
          throw new Error(
            `อัปโหลด ${criterionId} ไม่สำเร็จ: ${uploadError.message}`,
          );
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
