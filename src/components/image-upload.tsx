"use client";

import { useState } from "react";
import { Upload, Loader2, X, AlertCircle } from "lucide-react";

export function ImageUpload({
  value,
  onChange,
  folder = "c-electronics",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      setError("กรุณาตั้งค่า CLOUDINARY_CLOUD_NAME ใน .env.local");
      setUploading(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", preset);
      fd.append("folder", folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: fd }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      // ponytail: f_auto (WebP/AVIF by browser) + q_auto (auto quality)
      const optimized = data.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
      onChange(optimized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัพโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {value && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="preview" className="size-16 rounded-xl border border-black/10 object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -right-1 -top-1 rounded-full bg-negative p-0.5 text-white"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink">
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? "กำลังอัพโหลด..." : value ? "เปลี่ยนรูป" : "เลือกรูป"}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
        </label>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-negative">
          <AlertCircle className="size-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
