"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createGuide, updateGvgGuide } from "@/actions/gvg-guides";
import type { SkillStep, GuideStatus } from "@/lib/validations/guide";

interface Hero {
  id: string;
  name: string;
  imageUrl: string | null;
}

interface Guide {
  id: string;
  title: string;
  defenseHeroes: string[];
  attackHeroes: string[];
  attackPriority: number;
  attackSkillOrder: unknown;
  defenseSkillOrder: unknown;
  strategyNotes: string | null;
  mediaUrls: string[] | null;
  patchVersion: string;
  status: string | null;
}

/* ── Hero Autocomplete ──────────────────── */

function HeroAutocomplete({
  heroes,
  selected,
  onSelect,
  onRemove,
  label,
  teamColor,
}: {
  heroes: Hero[];
  selected: string[];
  onSelect: (name: string) => void;
  onRemove: (name: string) => void;
  label: string;
  teamColor: "cyan" | "green";
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const color = teamColor === "cyan" ? "var(--cyan)" : "var(--green)";

  const filtered = heroes.filter(
    (h) => h.name.toLowerCase().includes(query.toLowerCase()) && !selected.includes(h.name),
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div>
      <label
        className="block text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color }}
      >
        {label}
      </label>

      {/* Selected heroes */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map((name) => {
          const hero = heroes.find((h) => h.name === name);
          return (
            <div
              key={name}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm"
              style={{
                background: "var(--bg-elevated)",
                border: `1px solid ${color}`,
                color: "var(--text-primary)",
              }}
            >
              {hero?.imageUrl ? (
                <img
                  src={hero.imageUrl}
                  alt=""
                  className="w-5 h-5 rounded"
                />
              ) : null}
              {name}
              <button
                type="button"
                onClick={() => onRemove(name)}
                className="ml-1 text-xs cursor-pointer text-text-muted hover:text-accent"
              >
                x
              </button>
            </div>
          );
        })}
      </div>

      {/* Search input */}
      {selected.length < 3 && (
        <div ref={wrapperRef} className="relative">
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={`ค้นหาฮีโร่... (เหลือ ${3 - selected.length} ตัว)`}
          />
          {open && filtered.length > 0 && (
            <div className="absolute z-30 w-full mt-1 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-bg-card border border-border-default">
              {filtered.map((hero) => (
                <button
                  key={hero.id}
                  type="button"
                  onClick={() => {
                    onSelect(hero.name);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors cursor-pointer text-text-primary hover:bg-bg-card-hover"
                >
                  {hero.imageUrl ? (
                    <img
                      src={hero.imageUrl}
                      alt=""
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs bg-bg-input text-text-muted">
                      ?
                    </div>
                  )}
                  {hero.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Skill Order Builder ─────────────────── */

function SkillOrderBuilder({
  heroes,
  selectedHeroNames,
  steps,
  onChange,
  label,
  required,
}: {
  heroes: Hero[];
  selectedHeroNames: string[];
  steps: SkillStep[];
  onChange: (steps: SkillStep[]) => void;
  label: string;
  required?: boolean;
}) {
  const selectedHeroes = selectedHeroNames
    .map((name) => heroes.find((h) => h.name === name))
    .filter(Boolean) as Hero[];

  function addStep() {
    if (selectedHeroes.length === 0) return;
    onChange([
      ...steps,
      { hero_id: selectedHeroes[0].id, skill_number: 1, note: "" },
    ]);
  }

  function updateStep(index: number, updates: Partial<SkillStep>) {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    onChange(newSteps);
  }

  function removeStep(index: number) {
    onChange(steps.filter((_, i) => i !== index));
  }

  function moveStep(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [
      newSteps[newIndex],
      newSteps[index],
    ];
    onChange(newSteps);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="text-accent"> *</span>}
        </label>
        <button
          type="button"
          onClick={addStep}
          disabled={selectedHeroes.length === 0}
          className="px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-bg-elevated border border-border-default text-text-secondary"
        >
          + เพิ่มขั้นตอน
        </button>
      </div>

      {steps.length === 0 ? (
        <p className="text-xs py-3 text-text-muted">
          {selectedHeroes.length === 0
            ? "เลือกฮีโร่ก่อน แล้วเพิ่มลำดับสกิล"
            : 'ยังไม่มีขั้นตอน คลิก "+ เพิ่มขั้นตอน" เพื่อเริ่ม'}
        </p>
      ) : (
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-3 rounded-xl bg-bg-elevated border border-border-dim"
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 font-display"
                style={{
                  background:
                    i === 0 ? "var(--accent)" : "var(--bg-card)",
                  color:
                    i === 0 ? "white" : "var(--text-secondary)",
                  border:
                    i === 0
                      ? "none"
                      : "1px solid var(--border-default)",
                }}
              >
                {i + 1}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex gap-2">
                  <select
                    value={step.hero_id}
                    onChange={(e) =>
                      updateStep(i, { hero_id: e.target.value })
                    }
                    className="flex-1 h-9 rounded-md border border-border-default bg-bg-input px-3 text-sm text-text-primary"
                  >
                    {selectedHeroes.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={step.skill_number}
                    onChange={(e) =>
                      updateStep(i, {
                        skill_number: Number(e.target.value) as
                          | 1
                          | 2,
                      })
                    }
                    className="h-9 rounded-md border border-border-default bg-bg-input px-3 text-sm text-text-primary"
                  >
                    <option value={1}>Skill 1</option>
                    <option value={2}>Skill 2</option>
                  </select>
                </div>
                <Input
                  type="text"
                  value={step.note || ""}
                  onChange={(e) =>
                    updateStep(i, { note: e.target.value })
                  }
                  placeholder="หมายเหตุ (เช่น ตีเชนก่อน)"
                  className="text-xs"
                />
              </div>

              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => moveStep(i, -1)}
                  disabled={i === 0}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs cursor-pointer disabled:opacity-30 bg-bg-card text-text-muted"
                >
                  &uarr;
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(i, 1)}
                  disabled={i === steps.length - 1}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs cursor-pointer disabled:opacity-30 bg-bg-card text-text-muted"
                >
                  &darr;
                </button>
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs cursor-pointer bg-accent/10 text-accent"
                >
                  x
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Guide Form ──────────────────────────── */

export function GuideForm({
  heroes,
  guide,
}: {
  heroes: Hero[];
  guide?: Guide;
}) {
  const router = useRouter();
  const isNew = !guide;
  const [isSaving, startSave] = useTransition();
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState(guide?.title ?? "");
  const [defenseHeroes, setDefenseHeroes] = useState<string[]>(
    guide?.defenseHeroes ?? [],
  );
  const [attackHeroes, setAttackHeroes] = useState<string[]>(
    guide?.attackHeroes ?? [],
  );
  const [attackPriority, setAttackPriority] = useState(
    guide?.attackPriority ?? 1,
  );
  const [attackSkillOrder, setAttackSkillOrder] = useState<SkillStep[]>(
    (guide?.attackSkillOrder as SkillStep[]) ?? [],
  );
  const [defenseSkillOrder, setDefenseSkillOrder] = useState<SkillStep[]>(
    (guide?.defenseSkillOrder as SkillStep[]) ?? [],
  );
  const [strategyNotes, setStrategyNotes] = useState(
    guide?.strategyNotes ?? "",
  );
  const [patchVersion, setPatchVersion] = useState(
    guide?.patchVersion ?? "",
  );
  const [status, setStatus] = useState<GuideStatus>(
    (guide?.status as GuideStatus) ?? "draft",
  );
  const [mediaUrls, setMediaUrls] = useState<string[]>(
    guide?.mediaUrls ?? [],
  );
  const [youtubeInput, setYoutubeInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (defenseHeroes.length !== 3) {
      setError("ต้องเลือกฮีโร่ป้องกัน 3 ตัว");
      return;
    }
    if (attackHeroes.length !== 3) {
      setError("ต้องเลือกฮีโร่โจมตี 3 ตัว");
      return;
    }
    if (attackSkillOrder.length === 0) {
      setError("ต้องเพิ่มลำดับสกิลอย่างน้อย 1 ขั้นตอน");
      return;
    }

    const body = {
      title,
      defenseHeroes,
      attackHeroes,
      attackPriority,
      attackSkillOrder,
      defenseSkillOrder:
        defenseSkillOrder.length > 0 ? defenseSkillOrder : null,
      strategyNotes,
      mediaUrls,
      patchVersion,
      status,
    };

    startSave(async () => {
      const result = isNew
        ? await createGuide(body)
        : await updateGvgGuide(guide!.id, body);

      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        router.push("/admin/gvg-guides");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg text-sm bg-accent/10 border border-accent text-accent-bright">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-secondary">
          ชื่อคู่มือ <span className="text-accent">*</span>
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="เคาน์เตอร์: ทีมระเบิดน้ำ เอลีน + เชน + คาริน"
          required
        />
      </div>

      {/* Defense + Attack heroes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-bg-elevated border border-border-dim">
          <HeroAutocomplete
            heroes={heroes}
            selected={defenseHeroes}
            onSelect={(name) =>
              setDefenseHeroes([...defenseHeroes, name])
            }
            onRemove={(name) =>
              setDefenseHeroes(defenseHeroes.filter((h) => h !== name))
            }
            label="ทีมป้องกัน (3 ฮีโร่)"
            teamColor="cyan"
          />
        </div>
        <div className="p-4 rounded-xl bg-bg-elevated border border-border-dim">
          <HeroAutocomplete
            heroes={heroes}
            selected={attackHeroes}
            onSelect={(name) =>
              setAttackHeroes([...attackHeroes, name])
            }
            onRemove={(name) =>
              setAttackHeroes(attackHeroes.filter((h) => h !== name))
            }
            label="ทีมโจมตี (3 ฮีโร่)"
            teamColor="green"
          />
        </div>
      </div>

      {/* Priority + Patch + Status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-secondary">
            ลำดับความสำคัญ <span className="text-accent">*</span>
          </label>
          <Input
            type="number"
            value={attackPriority}
            onChange={(e) => setAttackPriority(Number(e.target.value))}
            min={1}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-secondary">
            เวอร์ชันแพตช์ <span className="text-accent">*</span>
          </label>
          <Input
            type="text"
            value={patchVersion}
            onChange={(e) => setPatchVersion(e.target.value)}
            placeholder="v2.4.1"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-secondary">
            สถานะ
          </label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as GuideStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">ฉบับร่าง</SelectItem>
              <SelectItem value="published">เผยแพร่</SelectItem>
              <SelectItem value="archived">เก็บถาวร</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Attack skill order */}
      <div className="p-4 rounded-xl bg-bg-surface border border-border-dim">
        <SkillOrderBuilder
          heroes={heroes}
          selectedHeroNames={attackHeroes}
          steps={attackSkillOrder}
          onChange={setAttackSkillOrder}
          label="ลำดับสกิลโจมตี"
          required
        />
      </div>

      {/* Defense skill order */}
      <div className="p-4 rounded-xl bg-bg-surface border border-border-dim">
        <SkillOrderBuilder
          heroes={heroes}
          selectedHeroNames={defenseHeroes}
          steps={defenseSkillOrder}
          onChange={setDefenseSkillOrder}
          label="ลำดับสกิลป้องกัน (ไม่บังคับ)"
        />
      </div>

      {/* Strategy notes */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-secondary">
          หมายเหตุกลยุทธ์
        </label>
        <Textarea
          value={strategyNotes}
          onChange={(e) => setStrategyNotes(e.target.value)}
          rows={5}
          placeholder="เปิดด้วยเดลลอนส์ตีเชนก่อนเพื่อตัดดาเมจหลัก..."
        />
      </div>

      {/* Media */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">
          สื่อประกอบ (สกรีนช็อต &amp; YouTube)
        </label>

        {mediaUrls.length > 0 && (
          <div className="space-y-2 mb-3">
            {mediaUrls.map((url, i) => {
              const isYoutube =
                url.includes("youtube.com") || url.includes("youtu.be");
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-elevated border border-border-dim"
                >
                  {isYoutube ? (
                    <div className="w-10 h-10 rounded flex items-center justify-center text-xs flex-shrink-0 bg-bg-input text-accent">
                      YT
                    </div>
                  ) : (
                    <img
                      src={url}
                      alt=""
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <span className="text-xs truncate flex-1 min-w-0 text-text-muted">
                    {url}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setMediaUrls(mediaUrls.filter((_, j) => j !== i))
                    }
                    className="px-2 py-1 rounded text-xs cursor-pointer text-accent"
                  >
                    ลบ
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {mediaUrls.length < 3 && (
          <div className="flex gap-2">
            <Input
              type="text"
              value={youtubeInput}
              onChange={(e) => setYoutubeInput(e.target.value)}
              placeholder="YouTube URL..."
              className="flex-1 text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const url = youtubeInput.trim();
                if (
                  url &&
                  (url.includes("youtube.com") ||
                    url.includes("youtu.be"))
                ) {
                  setMediaUrls([...mediaUrls, url]);
                  setYoutubeInput("");
                }
              }}
              disabled={!youtubeInput.trim()}
            >
              เพิ่ม
            </Button>
          </div>
        )}

        {mediaUrls.length >= 3 && (
          <p className="text-xs text-text-muted">
            สื่อครบ 3 รายการแล้ว
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              กำลังบันทึก...
            </>
          ) : isNew ? (
            "สร้างคู่มือ"
          ) : (
            "บันทึกการเปลี่ยนแปลง"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/gvg-guides")}
        >
          ยกเลิก
        </Button>
      </div>
    </form>
  );
}
