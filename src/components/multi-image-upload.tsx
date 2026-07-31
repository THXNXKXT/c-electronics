"use client";

import { useState } from "react";
import { Loader2, X, Images, AlertCircle } from "lucide-react";

export function MultiImageUpload({
  value,
  onChange,
  folder = "c-electronics",
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError("");

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      setError("กรุณาตั้งค่า CLOUDINARY ใน .env.local");
      setUploading(false);
      return;
    }

    const uploaded: string[] = [];
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", preset);
        fd.append("folder", folder);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const optimized = data.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
        uploaded.push(optimized);
      } catch { /* skip failed file */ }
    }
    onChange([...value, ...uploaded]);
    setUploading(false);
    e.target.value = ""; // reset for re-select
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={i} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`รูปที่ ${i + 1}`} className="size-16 rounded-xl border border-black/10 object-cover" />
            <button type="button" onClick={() => remove(i)} className="absolute -right-1 -top-1 rounded-full bg-negative p-0.5 text-white">
              <X className="size-3" />
            </button>
          </div>
        ))}
        <label className="flex size-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-black/10 text-subtle transition-colors hover:border-primary hover:text-primary">
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Images className="size-4" />}
          <span className="text-[9px] font-semibold">เพิ่มรูป</span>
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" disabled={uploading} />
        </label>
      </div>
      {error && <p className="mt-1.5 flex items-center gap-1 text-xs text-negative"><AlertCircle className="size-3" /> {error}</p>}
    </div>
  );
}
