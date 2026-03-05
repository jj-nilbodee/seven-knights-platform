"use client";

import { useState, useRef } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

interface Member {
  id: string;
  ign: string;
}

export function EquipmentSubmitClient({
  members,
}: {
  members: Member[];
}) {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [uploadedCount, setUploadedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const imageFiles = Array.from(newFiles).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (imageFiles.length === 0) return;

    setFiles((prev) => [...prev, ...imageFiles]);

    for (const file of imageFiles) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!selectedMember || files.length === 0) return;

    setUploading(true);
    setError("");
    setUploadedCount(0);

    try {
      const supabase = createBrowserClient();
      const safeName = selectedMember.ign
        .replace(/[^a-zA-Z0-9ก-๙-]/g, "")
        .slice(0, 50);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
        const path = `equipment/${safeName}/${Date.now()}-${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("hero-images")
          .upload(path, file, { upsert: true });

        if (uploadError) {
          throw new Error(`อัปโหลดรูปที่ ${i + 1} ไม่สำเร็จ: ${uploadError.message}`);
        }

        setUploadedCount(i + 1);
      }

      setDone(true);
      setFiles([]);
      setPreviews([]);
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
          ส่งรูปอุปกรณ์ของ {selectedMember?.ign} เรียบร้อยแล้ว
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
          onChange={(e) => setSelectedMemberId(e.target.value)}
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

      {/* File upload area */}
      {selectedMemberId && (
        <>
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              รูปอุปกรณ์ (เลือกได้หลายรูป)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFiles(e.dataTransfer.files);
              }}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-default bg-bg-input/50 p-8 cursor-pointer hover:border-accent/50 transition-colors"
            >
              <svg
                className="w-10 h-10 text-text-muted mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-text-secondary text-sm">
                กดเพื่อเลือกรูป หรือลากไฟล์มาวาง
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div>
              <p className="text-sm text-text-secondary mb-2">
                รูปที่เลือก ({previews.length} รูป)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={src}
                      alt={`equipment-${i}`}
                      className="w-full aspect-square object-cover rounded-md border border-border-dim"
                    />
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-bg-void/80 text-accent text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-accent text-sm">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={files.length === 0 || uploading}
            className="w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-bright disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {uploading
              ? `กำลังอัปโหลด... (${uploadedCount}/${files.length})`
              : `อัปโหลด ${files.length} รูป`}
          </button>
        </>
      )}
    </div>
  );
}
