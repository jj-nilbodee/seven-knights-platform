"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Upload,
  Loader2,
  Pencil,
  Trash2,
  ImageIcon,
  CheckCircle,
  XCircle,
  Search,
  ListPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getHeroTypeBadgeClasses, getRarityBadgeClasses } from "@/lib/badge-utils";
import { heroTypes, rarities } from "@/lib/validations/hero";
import {
  createHero,
  updateHero,
  deleteHero,
  bulkAddHeroes,
} from "@/actions/heroes";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

// --- Types ---

type Hero = {
  id: string;
  name: string;
  heroType: string;
  rarity: string;
  imageUrl: string | null;
  isActive: boolean | null;
  skill1Name: string;
  skill1Type: string;
  skill2Name: string;
  skill2Type: string;
  skill3Name: string;
  skill3Type: string;
};

interface FormState {
  name: string;
  heroType: string;
  rarity: string;
  skill1Name: string;
  skill2Name: string;
  skill3Name: string;
  imageFile: File | null;
  imagePreview: string;
  existingImageUrl: string;
}

const emptyForm: FormState = {
  name: "",
  heroType: "",
  rarity: "",
  skill1Name: "",
  skill2Name: "",
  skill3Name: "",
  imageFile: null,
  imagePreview: "",
  existingImageUrl: "",
};

// --- Toast ---

function Toast({
  message,
  type,
  onDone,
}: {
  message: string;
  type: "success" | "error";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] shadow-lg border backdrop-blur-md ${
          type === "success"
            ? "bg-green/20 border-green/30 text-green"
            : "bg-accent/20 border-accent/30 text-accent"
        }`}
      >
        {type === "success" ? (
          <CheckCircle className="h-5 w-5 shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 shrink-0" />
        )}
        <span className="font-medium text-sm">{message}</span>
      </div>
    </div>
  );
}

// --- Image Upload Zone ---

function ImageUploadZone({
  preview,
  existingUrl,
  onFile,
  disabled,
}: {
  preview: string;
  existingUrl: string;
  onFile: (file: File) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) return;
    onFile(file);
  };

  const src = preview || existingUrl;

  if (src) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className={`relative w-full h-64 bg-bg-input rounded-[var(--radius-md)] overflow-hidden border-2 transition-all ${
          dragging
            ? "border-accent border-dashed bg-accent/10"
            : "border-border-default"
        }`}
      >
        <Image src={src} alt="Preview" fill className="object-contain" />
        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            <Upload className="h-4 w-4 mr-2" />
            เปลี่ยนรูป
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        className="hidden"
      />
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className={`flex flex-col items-center justify-center p-6 rounded-[var(--radius-md)] border-2 border-dashed transition-all cursor-pointer min-h-[160px] ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${
          dragging
            ? "border-accent bg-accent/10"
            : "border-border-default hover:border-accent/50 hover:bg-bg-elevated"
        }`}
      >
        <Upload className="w-10 h-10 text-text-muted mb-3" />
        <p className="text-sm text-text-primary font-medium">
          วางรูปที่นี่ หรือคลิกเพื่ออัปโหลด
        </p>
        <p className="text-xs text-text-muted mt-1">
          สูงสุด 2MB &bull; JPG / PNG &bull; Ctrl+V วาง
        </p>
      </div>
    </>
  );
}

// --- Skill Input ---

function SkillInput({
  slot,
  label,
  isPassive,
  value,
  onChange,
  disabled,
}: {
  slot: number;
  label: string;
  isPassive?: boolean;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div
      className={`space-y-2 p-3 rounded-[var(--radius-md)] border ${
        isPassive
          ? "bg-gold/5 border-gold/30"
          : "bg-bg-elevated border-border-dim"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            isPassive ? "bg-gold" : "bg-text-secondary"
          }`}
        />
        <label className={`text-sm font-semibold ${isPassive ? "text-gold" : "text-text-primary"}`}>
          {label}
        </label>
      </div>
      <Input
        placeholder={`ชื่อสกิล ${slot} (ภาษาไทย)`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

// --- Main Component ---

export function HeroesAdmin({ initialHeroes }: { initialHeroes: Hero[] }) {
  const router = useRouter();
  const [isCreating, startCreate] = useTransition();
  const [isEditing, startEdit] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [isBulking, startBulk] = useTransition();
  // Dialog states
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  // Form
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingHero, setDeletingHero] = useState<Hero | null>(null);
  const [bulkText, setBulkText] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Clipboard paste for image
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      if (!addOpen && !editOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleImageFile(file);
            break;
          }
        }
      }
    };
    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, [addOpen, editOpen]);

  // --- Helpers ---

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setToast({ message: "กรุณาเลือกไฟล์รูปภาพ", type: "error" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: "รูปต้องไม่เกิน 2MB", type: "error" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((f) => ({
        ...f,
        imageFile: file,
        imagePreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function uploadImage(file: File, heroName: string): Promise<string> {
    const supabase = createBrowserClient();
    const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
    const rawExt = (file.name.split(".").pop() ?? "").toLowerCase();
    const ext = ALLOWED_EXT.has(rawExt) ? rawExt : "png";
    const safeName = heroName
      .replace(/[^a-zA-Z0-9\u0E00-\u0E7F-]/g, "")
      .slice(0, 50);
    const path = `heroes/${Date.now()}-${safeName}.${ext}`;

    const { error } = await supabase.storage
      .from("hero-images")
      .upload(path, file, { upsert: true });

    if (error) throw new Error("อัปโหลดรูปไม่สำเร็จ");

    const {
      data: { publicUrl },
    } = supabase.storage.from("hero-images").getPublicUrl(path);

    return publicUrl;
  }

  // --- Filtered heroes ---

  const filtered = initialHeroes.filter((h) => {
    if (filterType !== "all" && h.heroType !== filterType) return false;
    if (filterRarity !== "all" && h.rarity !== filterRarity) return false;
    if (search && !h.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  // --- Handlers ---

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      setToast({ message: "กรุณากรอกชื่อฮีโร่", type: "error" });
      return;
    }
    if (!form.heroType) {
      setToast({ message: "กรุณาเลือกประเภทฮีโร่", type: "error" });
      return;
    }
    if (!form.rarity) {
      setToast({ message: "กรุณาเลือกความหายาก", type: "error" });
      return;
    }
    if (!form.skill1Name || !form.skill2Name || !form.skill3Name) {
      setToast({ message: "กรุณากรอกชื่อสกิลทั้ง 3", type: "error" });
      return;
    }

    let imageUrl = "";
    if (form.imageFile) {
      try {
        imageUrl = await uploadImage(form.imageFile, form.name);
      } catch {
        setToast({ message: "อัปโหลดรูปไม่สำเร็จ", type: "error" });
        return;
      }
    }

    const fd = new FormData();
    fd.set("name", form.name);
    fd.set("heroType", form.heroType);
    fd.set("rarity", form.rarity);
    fd.set("imageUrl", imageUrl);
    fd.set("skill1Name", form.skill1Name);
    fd.set("skill1Type", "ACTIVE");
    fd.set("skill2Name", form.skill2Name);
    fd.set("skill2Type", "ACTIVE");
    fd.set("skill3Name", form.skill3Name);
    fd.set("skill3Type", "PASSIVE");

    startCreate(async () => {
      const result = await createHero(fd);
      if (result.error) {
        setToast({ message: result.error, type: "error" });
      } else {
        setToast({ message: "สร้างฮีโร่สำเร็จ!", type: "success" });
        setAddOpen(false);
        resetForm();
        router.refresh();
      }
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    if (!form.name.trim()) {
      setToast({ message: "กรุณากรอกชื่อฮีโร่", type: "error" });
      return;
    }

    let imageUrl = form.existingImageUrl;
    if (form.imageFile) {
      try {
        imageUrl = await uploadImage(form.imageFile, form.name);
      } catch {
        setToast({ message: "อัปโหลดรูปไม่สำเร็จ", type: "error" });
        return;
      }
    }

    const fd = new FormData();
    fd.set("name", form.name);
    fd.set("heroType", form.heroType);
    fd.set("rarity", form.rarity);
    fd.set("imageUrl", imageUrl);
    if (form.skill1Name) fd.set("skill1Name", form.skill1Name);
    if (form.skill2Name) fd.set("skill2Name", form.skill2Name);
    if (form.skill3Name) fd.set("skill3Name", form.skill3Name);
    fd.set("skill1Type", "ACTIVE");
    fd.set("skill2Type", "ACTIVE");
    fd.set("skill3Type", "PASSIVE");

    startEdit(async () => {
      const result = await updateHero(editingId, fd);
      if (result.error) {
        setToast({ message: result.error, type: "error" });
      } else {
        setToast({ message: "อัปเดตฮีโร่สำเร็จ!", type: "success" });
        setEditOpen(false);
        resetForm();
        router.refresh();
      }
    });
  }

  function openEdit(hero: Hero) {
    setEditingId(hero.id);
    setForm({
      name: hero.name,
      heroType: hero.heroType,
      rarity: hero.rarity,
      skill1Name: hero.skill1Name,
      skill2Name: hero.skill2Name,
      skill3Name: hero.skill3Name,
      imageFile: null,
      imagePreview: "",
      existingImageUrl: hero.imageUrl || "",
    });
    setEditOpen(true);
  }

  function openDelete(hero: Hero) {
    setDeletingHero(hero);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deletingHero) return;
    startDelete(async () => {
      const result = await deleteHero(deletingHero.id);
      if (result.error) {
        setToast({ message: result.error, type: "error" });
      } else {
        setToast({ message: "ลบฮีโร่สำเร็จ!", type: "success" });
        setDeleteOpen(false);
        setDeletingHero(null);
        router.refresh();
      }
    });
  }

  async function handleBulkAdd() {
    if (!bulkText.trim()) {
      setToast({ message: "กรุณากรอกชื่อฮีโร่", type: "error" });
      return;
    }
    startBulk(async () => {
      const result = await bulkAddHeroes(bulkText);
      if ("error" in result && result.error) {
        setToast({ message: result.error, type: "error" });
      } else if ("added" in result) {
        setToast({
          message: `นำเข้าสำเร็จ! เพิ่ม: ${result.added}, ข้าม: ${result.skipped}`,
          type: "success",
        });
        setBulkOpen(false);
        setBulkText("");
        router.refresh();
      }
    });
  }

  const bulkParsed = bulkText
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            จัดการฮีโร่
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            เพิ่ม แก้ไข หรือลบฮีโร่ในฐานข้อมูล
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <ListPlus className="h-4 w-4 mr-2" />
            เพิ่มหลายตัว
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มฮีโร่
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="ค้นหาชื่อฮีโร่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="ประเภททั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ประเภททั้งหมด</SelectItem>
              {heroTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterRarity} onValueChange={setFilterRarity}>
            <SelectTrigger>
              <SelectValue placeholder="ความหายากทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {rarities.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Heroes Grid */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            รายชื่อฮีโร่
          </h2>
          <span className="text-xs text-text-muted">
            {filtered.length} ตัว
          </span>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((hero) => (
              <div
                key={hero.id}
                className="rounded-[var(--radius-md)] border border-border-dim bg-bg-surface hover:border-border-bright transition-all duration-200 hover:scale-[1.02] overflow-hidden"
              >
                {/* Image */}
                {hero.imageUrl ? (
                  <div className="relative w-full h-48 bg-bg-input">
                    <Image
                      src={hero.imageUrl}
                      alt={hero.name}
                      fill
                      className="object-contain"
                      sizes="(max-width:640px) 50vw,(max-width:1024px) 25vw,16vw"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-bg-input flex items-center justify-center border-b border-border-dim">
                    <ImageIcon className="h-12 w-12 text-text-muted/30" />
                  </div>
                )}

                {/* Info */}
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-sm font-semibold text-text-primary leading-tight truncate flex-1">
                      {hero.name}
                    </h3>
                    <div className="flex shrink-0">
                      <button
                        onClick={() => openEdit(hero)}
                        className="p-1 rounded-[var(--radius-sm)] text-text-muted hover:text-cyan hover:bg-cyan/10 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openDelete(hero)}
                        className="p-1 rounded-[var(--radius-sm)] text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <span className={getHeroTypeBadgeClasses(hero.heroType)}>
                      {hero.heroType}
                    </span>
                    <span className={getRarityBadgeClasses(hero.rarity)}>
                      {hero.rarity}
                    </span>
                  </div>

                  <div className="space-y-1 pt-1">
                    <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">
                      Skills
                    </p>
                    {[
                      { name: hero.skill1Name, type: hero.skill1Type },
                      { name: hero.skill2Name, type: hero.skill2Type },
                      { name: hero.skill3Name, type: hero.skill3Type },
                    ].map((skill, i) => (
                      <div key={i} className="text-xs text-text-secondary flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            skill.type === "PASSIVE"
                              ? "bg-gold"
                              : "bg-text-muted"
                          }`}
                        />
                        <span className="truncate">{skill.name}</span>
                        {skill.type === "PASSIVE" && (
                          <span className="text-[10px] text-gold/70">
                            (Passive)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-text-muted bg-bg-input/30 rounded-[var(--radius-md)] border border-border-dim border-dashed">
            ไม่พบฮีโร่ — คลิก &ldquo;เพิ่มฮีโร่&rdquo; เพื่อเริ่มต้น
          </div>
        )}
      </div>

      {/* --- Dialogs --- */}

      {/* Add Hero */}
      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>เพิ่มฮีโร่ใหม่</DialogTitle>
            <DialogDescription>
              สร้างฮีโร่พร้อมรูปภาพและสกิล 3 ตัว (2 Active + 1 Passive)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <ImageUploadZone
                preview={form.imagePreview}
                existingUrl=""
                onFile={handleImageFile}
                disabled={isCreating}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">
                  ชื่อฮีโร่ *
                </label>
                <Input
                  placeholder="เช่น เดลลอนส์"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  disabled={isCreating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">
                    ประเภท *
                  </label>
                  <Select
                    value={form.heroType}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, heroType: v }))
                    }
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      {heroTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">
                    ความหายาก *
                  </label>
                  <Select
                    value={form.rarity}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, rarity: v }))
                    }
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกความหายาก" />
                    </SelectTrigger>
                    <SelectContent>
                      {rarities.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-border-dim">
                <h3 className="text-sm font-semibold text-text-primary">
                  สกิล (3 ตัว)
                </h3>
                <SkillInput
                  slot={1}
                  label="สกิล 1 (Active) *"
                  value={form.skill1Name}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, skill1Name: v }))
                  }
                  disabled={isCreating}
                />
                <SkillInput
                  slot={2}
                  label="สกิล 2 (Active) *"
                  value={form.skill2Name}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, skill2Name: v }))
                  }
                  disabled={isCreating}
                />
                <SkillInput
                  slot={3}
                  label="สกิล 3 (Passive) *"
                  isPassive
                  value={form.skill3Name}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, skill3Name: v }))
                  }
                  disabled={isCreating}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddOpen(false);
                  resetForm();
                }}
                disabled={isCreating}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังสร้าง...
                  </>
                ) : (
                  "สร้างฮีโร่"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Hero */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขฮีโร่</DialogTitle>
            <DialogDescription>
              อัปเดตข้อมูลฮีโร่ รูปภาพ และสกิล
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-4">
              <ImageUploadZone
                preview={form.imagePreview}
                existingUrl={form.existingImageUrl}
                onFile={handleImageFile}
                disabled={isEditing}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">
                  ชื่อฮีโร่ *
                </label>
                <Input
                  placeholder="เช่น เดลลอนส์"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  disabled={isEditing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">
                    ประเภท *
                  </label>
                  <Select
                    value={form.heroType}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, heroType: v }))
                    }
                    disabled={isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {heroTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">
                    ความหายาก *
                  </label>
                  <Select
                    value={form.rarity}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, rarity: v }))
                    }
                    disabled={isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rarities.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-border-dim">
                <h3 className="text-sm font-semibold text-text-primary">
                  สกิล (3 ตัว)
                </h3>
                <SkillInput
                  slot={1}
                  label="สกิล 1 (Active)"
                  value={form.skill1Name}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, skill1Name: v }))
                  }
                  disabled={isEditing}
                />
                <SkillInput
                  slot={2}
                  label="สกิล 2 (Active)"
                  value={form.skill2Name}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, skill2Name: v }))
                  }
                  disabled={isEditing}
                />
                <SkillInput
                  slot={3}
                  label="สกิล 3 (Passive)"
                  isPassive
                  value={form.skill3Name}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, skill3Name: v }))
                  }
                  disabled={isEditing}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  resetForm();
                }}
                disabled={isEditing}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึก"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeletingHero(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ลบฮีโร่</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold text-text-primary">
                {deletingHero?.name}
              </span>
              ? การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeletingHero(null);
              }}
              disabled={isDeleting}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="bg-accent hover:bg-accent-bright"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบฮีโร่"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add */}
      <Dialog
        open={bulkOpen}
        onOpenChange={(open) => {
          setBulkOpen(open);
          if (!open) setBulkText("");
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มฮีโร่หลายตัว</DialogTitle>
            <DialogDescription>
              วางรายชื่อฮีโร่ คั่นด้วยคอมม่าหรือขึ้นบรรทัดใหม่
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Textarea
              rows={8}
              placeholder={"เดลลอนส์\nราเชล\nจูโน\nเอลีน"}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              disabled={isBulking}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted">
                ตรวจพบ{" "}
                <span className="text-text-primary font-semibold">
                  {bulkParsed.length}
                </span>{" "}
                ชื่อ
              </p>
              <p className="text-xs text-text-muted">
                ค่าเริ่มต้น: PHYSICAL / LEGEND
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setBulkOpen(false);
                setBulkText("");
              }}
              disabled={isBulking}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={handleBulkAdd}
              disabled={isBulking || bulkParsed.length === 0}
            >
              {isBulking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังนำเข้า...
                </>
              ) : (
                `นำเข้า ${bulkParsed.length} ฮีโร่`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
