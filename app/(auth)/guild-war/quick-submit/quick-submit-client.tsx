"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fuzzyMatchMembers } from "@/lib/fuzzy-match";
import { quickSubmitBattles } from "@/actions/quick-submit";
import type {
  ExtractionResult,
  MemberSummary,
  IndividualBattle,
} from "@/lib/ai/extract-battle-results";

type Member = { id: string; ign: string };

type BattleDetail = {
  result: "win" | "loss";
  enemyPlayerName: string;
  battleType: "attack" | "defense";
  enemyCastleType: "main" | "inner" | "outer" | null;
  enemyCastleNumber: number | null;
};

type ReviewMember = {
  id: string;
  extractedName: string;
  memberId: string | null;
  matchConfidence: "high" | "medium" | "none";
  wins: number;
  losses: number;
  battleDetails: BattleDetail[];
};

function getLatestGuildWarDate() {
  const now = new Date();
  const day = now.getDay();
  const daysBack = [1, 0, 1, 0, 1, 1, 0];
  const target = new Date(now);
  target.setDate(target.getDate() - daysBack[day]);
  return target.toISOString().split("T")[0];
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function QuickSubmitClient({
  members,
  guildId,
  initialEnemyGuildName,
}: {
  members: Member[];
  guildId: string;
  initialEnemyGuildName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [date, setDate] = useState(getLatestGuildWarDate());
  const [enemyGuildName, setEnemyGuildName] = useState(initialEnemyGuildName);

  // Upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // Review table state
  const [reviewMembers, setReviewMembers] = useState<ReviewMember[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // File handling
  function handleFileSelect(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    setSelectedFiles((prev) => {
      const combined = [...prev, ...newFiles];
      return combined.slice(0, 10);
    });
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }

  // Resize image to fit within max dimensions and return base64 + mimeType
  async function resizeImage(
    file: File,
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.8,
  ): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({
          base64: dataUrl.split(",")[1],
          mimeType: "image/jpeg",
        });
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  // Extract from screenshots
  async function handleExtract() {
    if (selectedFiles.length === 0) {
      toast.error("กรุณาเลือกภาพก่อน");
      return;
    }

    setIsExtracting(true);
    try {
      const images = await Promise.all(
        selectedFiles.map((file) => resizeImage(file)),
      );

      const response = await fetch("/api/ai/extract-battle-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Extraction failed");
      }

      const result: ExtractionResult = await response.json();
      mergeExtractionResult(result);

      // Clear files after successful extraction
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

      const summaryCount = result.memberSummaries.length;
      const battleCount = result.individualBattles.length;
      toast.success(
        `พบข้อมูล ${summaryCount} สมาชิก, ${battleCount} รายการต่อสู้`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "ไม่สามารถวิเคราะห์ภาพได้",
      );
    } finally {
      setIsExtracting(false);
    }
  }

  // Merge extraction results into review table (upsert)
  function mergeExtractionResult(result: ExtractionResult) {
    setReviewMembers((prev) => {
      const updated = [...prev];

      // Process member summaries
      for (const summary of result.memberSummaries) {
        const matchResult = fuzzyMatchMembers([summary.memberName], members)[0];
        const existingIdx = updated.findIndex(
          (r) =>
            r.extractedName.toLowerCase() ===
              summary.memberName.toLowerCase() ||
            (matchResult.memberId && r.memberId === matchResult.memberId),
        );

        if (existingIdx >= 0) {
          // Update existing — use latest extracted values
          updated[existingIdx] = {
            ...updated[existingIdx],
            wins: summary.wins,
            losses: summary.losses,
          };
        } else {
          // Add new member
          updated.push({
            id: generateId(),
            extractedName: summary.memberName,
            memberId: matchResult.memberId,
            matchConfidence: matchResult.confidence,
            wins: summary.wins,
            losses: summary.losses,
            battleDetails: [],
          });
        }
      }

      // Process individual battles
      for (const battle of result.individualBattles) {
        const matchResult = fuzzyMatchMembers(
          [battle.memberName],
          members,
        )[0];

        // Find matching review member
        let memberRow = updated.find(
          (r) =>
            r.extractedName.toLowerCase() ===
              battle.memberName.toLowerCase() ||
            (matchResult.memberId && r.memberId === matchResult.memberId),
        );

        if (!memberRow) {
          // Create new member entry
          memberRow = {
            id: generateId(),
            extractedName: battle.memberName,
            memberId: matchResult.memberId,
            matchConfidence: matchResult.confidence,
            wins: 0,
            losses: 0,
            battleDetails: [],
          };
          updated.push(memberRow);
        }

        // Check for duplicate battle detail
        const isDuplicate = memberRow.battleDetails.some(
          (d) =>
            d.enemyPlayerName.toLowerCase() ===
            battle.enemyPlayerName.toLowerCase(),
        );

        if (!isDuplicate) {
          memberRow.battleDetails.push({
            result: battle.result,
            enemyPlayerName: battle.enemyPlayerName,
            battleType: battle.battleType,
            enemyCastleType: battle.enemyCastleType,
            enemyCastleNumber: battle.enemyCastleNumber,
          });
        }
      }

      // Sync wins/losses to match actual battle details when details
      // exceed the current summary counts (e.g. type 2 only uploads)
      for (const member of updated) {
        if (member.battleDetails.length === 0) continue;
        const detailWins = member.battleDetails.filter(
          (d) => d.result === "win",
        ).length;
        const detailLosses = member.battleDetails.filter(
          (d) => d.result === "loss",
        ).length;
        // Use the larger of summary vs detail counts
        member.wins = Math.max(member.wins, detailWins);
        member.losses = Math.max(member.losses, detailLosses);
      }

      return updated;
    });
  }

  // Row editing
  function updateMember(id: string, updates: Partial<ReviewMember>) {
    setReviewMembers((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    );
  }

  function removeMember(id: string) {
    setReviewMembers((prev) => prev.filter((r) => r.id !== id));
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function addEmptyMember() {
    const newMember: ReviewMember = {
      id: generateId(),
      extractedName: "",
      memberId: null,
      matchConfidence: "none",
      wins: 0,
      losses: 0,
      battleDetails: [],
    };
    setReviewMembers((prev) => [...prev, newMember]);
  }

  function toggleExpand(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateBattleDetail(
    memberId: string,
    detailIndex: number,
    updates: Partial<BattleDetail>,
  ) {
    setReviewMembers((prev) =>
      prev.map((r) => {
        if (r.id !== memberId) return r;
        const details = [...r.battleDetails];
        details[detailIndex] = { ...details[detailIndex], ...updates };
        return { ...r, battleDetails: details };
      }),
    );
  }

  function removeBattleDetail(memberId: string, detailIndex: number) {
    setReviewMembers((prev) =>
      prev.map((r) => {
        if (r.id !== memberId) return r;
        return {
          ...r,
          battleDetails: r.battleDetails.filter((_, i) => i !== detailIndex),
        };
      }),
    );
  }

  // Compute totals
  const totalBattles = reviewMembers.reduce(
    (sum, r) => sum + r.wins + r.losses,
    0,
  );
  const totalWins = reviewMembers.reduce((sum, r) => sum + r.wins, 0);
  const totalLosses = reviewMembers.reduce((sum, r) => sum + r.losses, 0);

  // Check if all members are mapped
  const unmappedMembers = reviewMembers.filter((r) => !r.memberId);

  // Submit handler
  function handleSubmit() {
    if (reviewMembers.length === 0) {
      toast.error("ไม่มีข้อมูลที่จะบันทึก");
      return;
    }
    if (unmappedMembers.length > 0) {
      toast.error(
        `มี ${unmappedMembers.length} สมาชิกที่ยังไม่ได้จับคู่ กรุณาเลือกสมาชิกให้ครบ`,
      );
      return;
    }
    if (!date) {
      toast.error("กรุณาเลือกวันที่");
      return;
    }

    // Expand each member into individual battle records
    const battleRecords: {
      memberId: string;
      result: string;
      battleType: string | null;
      enemyPlayerName: string;
      enemyCastleType: string | null;
      enemyCastleNumber: number | null;
    }[] = [];

    for (const member of reviewMembers) {
      if (!member.memberId) continue;

      const totalMemberBattles = member.wins + member.losses;

      // Build result array: wins first, then losses
      const results: ("win" | "loss")[] = [
        ...Array(member.wins).fill("win"),
        ...Array(member.losses).fill("loss"),
      ];

      for (let i = 0; i < totalMemberBattles; i++) {
        const detail = member.battleDetails[i];
        battleRecords.push({
          memberId: member.memberId,
          result: detail?.result ?? results[i],
          battleType: detail?.battleType ?? null,
          enemyPlayerName: detail?.enemyPlayerName ?? "",
          enemyCastleType: detail?.enemyCastleType ?? null,
          enemyCastleNumber: detail?.enemyCastleNumber ?? null,
        });
      }
    }

    if (battleRecords.length === 0) {
      toast.error("ไม่มีข้อมูลการต่อสู้ที่จะบันทึก");
      return;
    }

    startTransition(async () => {
      const res = await quickSubmitBattles({
        date,
        enemyGuildName,
        guildId,
        battles: battleRecords,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        const parts: string[] = [];
        if (res.inserted) parts.push(`เพิ่ม ${res.inserted}`);
        if (res.updated) parts.push(`อัปเดต ${res.updated}`);
        toast.success(`${parts.join(", ")} การต่อสู้สำเร็จ!`);
        router.push("/guild-war");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/guild-war">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-text-primary">
            <Camera className="inline h-6 w-6 mr-2 text-gold" />
            บันทึกด่วน
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            อัปโหลดภาพหน้าจอเพื่อบันทึกผลสงครามกิลด์อัตโนมัติ
          </p>
        </div>
      </div>

      {/* Date + Enemy guild */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-secondary">
            วันที่ <span className="text-accent">*</span>
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-secondary">
            กิลด์ศัตรู
          </label>
          <Input
            placeholder="ชื่อกิลด์ศัตรู"
            value={enemyGuildName}
            onChange={(e) => setEnemyGuildName(e.target.value)}
          />
        </div>
      </div>

      {/* Upload area */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium text-text-secondary">
          อัปโหลดภาพหน้าจอ
        </h2>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border-default rounded-[var(--radius-md)] p-8 text-center cursor-pointer hover:border-gold/50 hover:bg-gold/5 transition-colors"
        >
          <Upload className="h-8 w-8 mx-auto text-text-muted mb-2" />
          <p className="text-sm text-text-muted">
            ลากภาพมาวางที่นี่ หรือคลิกเพื่อเลือก
          </p>
          <p className="text-xs text-text-muted mt-1">
            รองรับสูงสุด 10 ภาพ (PNG, JPG)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>

        {/* Thumbnails */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="relative group w-16 h-16 rounded-[var(--radius-sm)] overflow-hidden border border-border-dim"
              >
                <Thumbnail file={file} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="absolute top-0 right-0 p-0.5 bg-bg-surface/80 rounded-bl-[var(--radius-sm)] text-text-muted hover:text-accent transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Extract button */}
        <div className="flex justify-end">
          <Button
            onClick={handleExtract}
            disabled={selectedFiles.length === 0 || isExtracting}
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังวิเคราะห์...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                วิเคราะห์ภาพ
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Review table */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border-dim">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            ตรวจสอบข้อมูล
          </h2>
          {reviewMembers.length > 0 && (
            <span className="text-sm text-text-muted">
              {reviewMembers.length} สมาชิก, {totalBattles} การต่อสู้ ({totalWins}W, {totalLosses}L)
            </span>
          )}
        </div>

        {reviewMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-dim bg-bg-surface">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    สมาชิก
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-20">
                    ชนะ
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-20">
                    แพ้
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-24">
                    รายละเอียด
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-16">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviewMembers.map((rm) => {
                  const totalMemberBattles = rm.wins + rm.losses;
                  const detailCount = rm.battleDetails.length;
                  const isExpanded = expandedRows.has(rm.id);
                  const isUnmapped = !rm.memberId;

                  return (
                    <ReviewRow
                      key={rm.id}
                      rm={rm}
                      members={members}
                      totalMemberBattles={totalMemberBattles}
                      detailCount={detailCount}
                      isExpanded={isExpanded}
                      isUnmapped={isUnmapped}
                      onUpdate={(updates) => updateMember(rm.id, updates)}
                      onRemove={() => removeMember(rm.id)}
                      onToggleExpand={() => toggleExpand(rm.id)}
                      onUpdateDetail={(idx, updates) =>
                        updateBattleDetail(rm.id, idx, updates)
                      }
                      onRemoveDetail={(idx) =>
                        removeBattleDetail(rm.id, idx)
                      }
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-text-muted">
            อัปโหลดภาพหน้าจอเพื่อเริ่มต้น หรือเพิ่มสมาชิกด้วยตนเอง
          </div>
        )}

        {/* Add member button */}
        <div className="p-4 border-t border-border-dim">
          <button
            type="button"
            onClick={addEmptyMember}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-gold transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            เพิ่มสมาชิก
          </button>
        </div>
      </div>

      {/* Unmapped warning */}
      {unmappedMembers.length > 0 && reviewMembers.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-[var(--radius-md)] bg-accent/10 border border-accent/30 text-sm text-accent">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            มี {unmappedMembers.length} สมาชิกที่ยังไม่ได้จับคู่ กรุณาเลือกสมาชิกให้ครบก่อนบันทึก
          </span>
        </div>
      )}

      {/* Submit buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={
            isPending || reviewMembers.length === 0 || unmappedMembers.length > 0
          }
          className="flex-1"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            `ยืนยันและบันทึก ${totalBattles} การต่อสู้`
          )}
        </Button>
        <Link href="/guild-war">
          <Button variant="outline" disabled={isPending}>
            ยกเลิก
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ── Thumbnail Component (cleanup object URL) ── */

function Thumbnail({ file }: { file: File }) {
  const src = URL.createObjectURL(file);
  return (
    <img
      src={src}
      alt={file.name}
      className="w-full h-full object-cover"
      onLoad={() => URL.revokeObjectURL(src)}
    />
  );
}

/* ── Review Row Component ──────────────────── */

function ReviewRow({
  rm,
  members,
  totalMemberBattles,
  detailCount,
  isExpanded,
  isUnmapped,
  onUpdate,
  onRemove,
  onToggleExpand,
  onUpdateDetail,
  onRemoveDetail,
}: {
  rm: ReviewMember;
  members: Member[];
  totalMemberBattles: number;
  detailCount: number;
  isExpanded: boolean;
  isUnmapped: boolean;
  onUpdate: (updates: Partial<ReviewMember>) => void;
  onRemove: () => void;
  onToggleExpand: () => void;
  onUpdateDetail: (idx: number, updates: Partial<BattleDetail>) => void;
  onRemoveDetail: (idx: number) => void;
}) {
  const confidenceColor =
    rm.matchConfidence === "high"
      ? "border-green/40"
      : rm.matchConfidence === "medium"
        ? "border-gold/40"
        : "border-accent/40";

  return (
    <>
      <tr
        className={`border-b border-border-dim last:border-b-0 hover:bg-bg-elevated transition-colors ${isUnmapped ? "bg-accent/5" : ""}`}
      >
        {/* Member select */}
        <td className="px-4 py-3">
          <div className="space-y-1">
            {rm.extractedName && (
              <p className="text-xs text-text-muted">
                AI: {rm.extractedName}
                {rm.matchConfidence !== "none" && (
                  <span
                    className={`ml-1 ${rm.matchConfidence === "high" ? "text-green" : "text-gold"}`}
                  >
                    ({rm.matchConfidence === "high" ? "แม่นยำ" : "ใกล้เคียง"})
                  </span>
                )}
              </p>
            )}
            <Select
              value={rm.memberId ?? ""}
              onValueChange={(val) =>
                onUpdate({
                  memberId: val || null,
                  matchConfidence: val ? "high" : "none",
                })
              }
            >
              <SelectTrigger
                className={`w-[180px] h-8 text-sm border ${confidenceColor}`}
              >
                <SelectValue placeholder="เลือกสมาชิก..." />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.ign}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </td>

        {/* Wins */}
        <td className="px-4 py-3 text-center">
          <Input
            type="number"
            min={0}
            max={5}
            value={rm.wins}
            onChange={(e) =>
              onUpdate({ wins: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) })
            }
            className="w-16 h-8 text-center text-sm mx-auto text-green"
          />
        </td>

        {/* Losses */}
        <td className="px-4 py-3 text-center">
          <Input
            type="number"
            min={0}
            max={5}
            value={rm.losses}
            onChange={(e) =>
              onUpdate({ losses: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) })
            }
            className="w-16 h-8 text-center text-sm mx-auto text-accent"
          />
        </td>

        {/* Details count */}
        <td className="px-4 py-3 text-center">
          {totalMemberBattles > 0 ? (
            <button
              type="button"
              onClick={onToggleExpand}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] text-xs cursor-pointer transition-colors ${
                detailCount >= totalMemberBattles
                  ? "bg-green/10 text-green"
                  : "bg-bg-surface text-text-muted hover:text-text-secondary"
              }`}
            >
              {detailCount}/{totalMemberBattles}
              {detailCount >= totalMemberBattles && " ✓"}
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          ) : (
            <span className="text-xs text-text-muted">—</span>
          )}
        </td>

        {/* Delete */}
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-[var(--radius-sm)] text-text-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </td>
      </tr>

      {/* Expanded battle details */}
      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-4 py-3 bg-bg-surface/50">
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                รายละเอียดการต่อสู้
              </p>
              {rm.battleDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-bg-card border border-border-dim"
                >
                  {/* Result badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      detail.result === "win"
                        ? "bg-green/15 text-green"
                        : "bg-accent/15 text-accent"
                    }`}
                  >
                    {detail.result === "win" ? "ชนะ" : "แพ้"}
                  </span>

                  {/* Enemy player name */}
                  <Input
                    value={detail.enemyPlayerName}
                    onChange={(e) =>
                      onUpdateDetail(idx, {
                        enemyPlayerName: e.target.value,
                      })
                    }
                    placeholder="ชื่อศัตรู"
                    className="h-7 text-xs w-32"
                  />

                  {/* Battle type */}
                  <Select
                    value={detail.battleType}
                    onValueChange={(val: "attack" | "defense") =>
                      onUpdateDetail(idx, { battleType: val })
                    }
                  >
                    <SelectTrigger className="w-20 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attack">บุก</SelectItem>
                      <SelectItem value="defense">รับ</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Castle type */}
                  <Select
                    value={detail.enemyCastleType ?? "none"}
                    onValueChange={(val) =>
                      onUpdateDetail(idx, {
                        enemyCastleType:
                          val === "none" ? null : (val as "main" | "inner" | "outer"),
                      })
                    }
                  >
                    <SelectTrigger className="w-28 h-7 text-xs">
                      <SelectValue placeholder="ปราสาท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      <SelectItem value="main">ปราสาทหลัก</SelectItem>
                      <SelectItem value="inner">ด้านใน</SelectItem>
                      <SelectItem value="outer">รอบนอก</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Castle number */}
                  {detail.enemyCastleType && (
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={detail.enemyCastleNumber ?? ""}
                      onChange={(e) =>
                        onUpdateDetail(idx, {
                          enemyCastleNumber: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                      placeholder="#"
                      className="w-14 h-7 text-xs text-center"
                    />
                  )}

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => onRemoveDetail(idx)}
                    className="p-1 text-text-muted hover:text-accent transition-colors cursor-pointer shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {rm.battleDetails.length === 0 && (
                <p className="text-xs text-text-muted py-2">
                  ไม่มีรายละเอียดจากภาพหน้าจอ — จะบันทึกเฉพาะจำนวนชนะ/แพ้
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
