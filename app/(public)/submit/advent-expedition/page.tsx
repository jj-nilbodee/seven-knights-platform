"use client";

import { useState, useEffect } from "react";
import { Mountain, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { submitAdventScore } from "@/actions/advent";

const BOSSES = [
  { id: "teo", name: "Teo", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/40", ring: "ring-red-500/50" },
  { id: "yeonhee", name: "Yeonhee", color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/40", ring: "ring-purple-500/50" },
  { id: "kyle", name: "Kyle", color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/40", ring: "ring-blue-500/50" },
  { id: "karma", name: "Karma", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/40", ring: "ring-green-500/50" },
] as const;

interface MemberOption {
  id: string;
  ign: string;
}

export default function PublicAdventSubmitPage() {
  // Guild ID for public access — comes from env
  const guildId = process.env.NEXT_PUBLIC_DEFAULT_GUILD_ID ?? "";

  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(!!guildId);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null);
  const [selectedBoss, setSelectedBoss] = useState<string | null>(null);
  const [score, setScore] = useState("");
  const [, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [useManual, setUseManual] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!guildId) return;

    let cancelled = false;
    fetch(`/api/public/members?guildId=${guildId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setMembers(data.members ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [guildId]);

  const filteredMembers = members.filter(
    (m) =>
      m.ign.toLowerCase().includes(search.toLowerCase()),
  );

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    // Auto-extract via AI
    extractScore(file);
  }

  async function extractScore(file: File) {
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "advent");

      const res = await fetch("/api/ai/extract-screenshot", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.score && data.score > 0) {
        setScore(data.score.toString());
        if (data.confidence < 0.8) {
          toast.info(
            `ดึงคะแนน: ${data.score.toLocaleString()} (ความมั่นใจ ${Math.round(data.confidence * 100)}%) — กรุณาตรวจสอบ`,
          );
        } else {
          toast.success(`ดึงคะแนน: ${data.score.toLocaleString()}`);
        }
      } else {
        toast.warning("ไม่สามารถดึงคะแนนจากรูปได้ — กรุณากรอกเอง");
        setUseManual(true);
      }
    } catch {
      toast.error("ไม่สามารถดึงข้อมูลจากรูปภาพได้");
      setUseManual(true);
    }
    setExtracting(false);
  }

  async function handleSubmit() {
    if (!selectedMember || !selectedBoss || !score) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setSubmitting(true);
    const result = await submitAdventScore({
      guildId,
      memberIgn: selectedMember.ign,
      boss: selectedBoss,
      score: parseInt(score) || 0,
    });
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      setSubmitted(true);
    }
  }

  function handleReset() {
    setSelectedMember(null);
    setSelectedBoss(null);
    setScore("");
    setImageFile(null);
    setImagePreview(null);
    setSubmitted(false);
    setUseManual(false);
    setSearch("");
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg-void flex items-center justify-center p-4">
        <div className="w-full max-w-md war-card p-8 text-center space-y-4 animate-fade-in-up">
          <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto" />
          <h2 className="font-display text-xl font-bold text-text-primary">
            ส่งคะแนนสำเร็จ!
          </h2>
          <div className="space-y-1 text-sm text-text-secondary">
            <p>{selectedMember?.ign}</p>
            <p className={BOSSES.find((b) => b.id === selectedBoss)?.color}>
              {BOSSES.find((b) => b.id === selectedBoss)?.name}
            </p>
            <p className="font-display text-lg font-bold text-text-primary">
              {parseInt(score).toLocaleString()}
            </p>
          </div>
          <Button onClick={handleReset} className="mt-4">
            ส่งคะแนนเพิ่ม
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-void flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-accent/10">
              <Mountain className="h-7 w-7 text-accent" />
            </div>
          </div>
          <h1 className="font-display text-xl font-bold text-text-primary">
            ส่งคะแนน Advent
          </h1>
          <p className="text-sm text-text-muted">เลือกสมาชิก → เลือกบอส → อัปโหลดรูป</p>
        </div>

        {/* Step 1: Select Member */}
        <div className="war-card p-4 space-y-3">
          <Label className="text-text-secondary">1. เลือกสมาชิก</Label>
          {selectedMember ? (
            <div className="flex items-center justify-between bg-bg-elevated rounded-[var(--radius-md)] p-3">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {selectedMember.ign}
                </p>
                <p className="text-xs text-text-muted">เลือกแล้ว</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>
                เปลี่ยน
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Input
                placeholder="ค้นหาชื่อ IGN..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                disabled={loading}
              />
              {showDropdown && search && (
                <div className="autocomplete-dropdown">
                  {filteredMembers.length === 0 ? (
                    <div className="p-3 text-sm text-text-muted text-center">ไม่พบสมาชิก</div>
                  ) : (
                    filteredMembers.slice(0, 10).map((m) => (
                      <button
                        key={m.id}
                        className="autocomplete-item w-full text-left cursor-pointer"
                        onClick={() => {
                          setSelectedMember(m);
                          setSearch("");
                          setShowDropdown(false);
                        }}
                      >
                        <div>
                          <p className="text-sm text-text-primary">{m.ign}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Select Boss */}
        <div className="war-card p-4 space-y-3">
          <Label className="text-text-secondary">2. เลือกบอส</Label>
          <div className="grid grid-cols-2 gap-2">
            {BOSSES.map((boss) => (
              <button
                key={boss.id}
                className={`p-3 rounded-[var(--radius-md)] border-2 text-center transition-all cursor-pointer ${
                  selectedBoss === boss.id
                    ? `${boss.bg} ${boss.border} ring-2 ${boss.ring}`
                    : "border-border-dim bg-bg-elevated hover:border-border-bright"
                }`}
                onClick={() => setSelectedBoss(boss.id)}
              >
                <p className={`text-sm font-semibold ${boss.color}`}>{boss.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Upload or Manual */}
        <div className="war-card p-4 space-y-3">
          <Label className="text-text-secondary">3. คะแนน</Label>

          {!useManual && (
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border-default rounded-[var(--radius-md)] bg-bg-elevated cursor-pointer hover:border-border-bright transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              {extracting ? (
                <div className="flex items-center gap-2 text-text-muted">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">กำลังดึงข้อมูล...</span>
                </div>
              ) : imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full object-contain rounded-[var(--radius-sm)]"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-text-muted">
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">อัปโหลดสกรีนช็อต</span>
                </div>
              )}
            </label>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useManual}
              onChange={(e) => setUseManual(e.target.checked)}
              className="accent-accent"
            />
            <span className="text-xs text-text-muted">กรอกคะแนนเอง</span>
          </label>

          <div className="space-y-1.5">
            <Input
              type="number"
              placeholder="คะแนนดาเมจ"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
            {score && (
              <p className="text-xs text-text-muted">
                = {parseInt(score).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting || !selectedMember || !selectedBoss || !score}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          ส่งคะแนน
        </Button>
      </div>
    </div>
  );
}
