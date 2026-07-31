"use client";

import {
  createUploadActivityTracker,
  type UploadActivityTracker,
} from "@/lib/upload-activity";
import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, X, AlertCircle } from "lucide-react";

export function ImageUpload({
  value,
  onChange,
  folder = "c-electronics",
  onUploadingChange,
}: {
  value: string;
  onChange: (url: string, publicId?: string) => void;
  folder?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const uploadingCallbackRef = useRef(onUploadingChange);
  const trackerRef = useRef<UploadActivityTracker | null>(null);

  useEffect(() => {
    uploadingCallbackRef.current = onUploadingChange;
  }, [onUploadingChange]);

  useEffect(() => {
    mountedRef.current = true;
    trackerRef.current = createUploadActivityTracker((nextUploading) =>
      uploadingCallbackRef.current?.(nextUploading),
    );
    return () => {
      mountedRef.current = false;
      trackerRef.current?.dispose();
      trackerRef.current = null;
    };
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    trackerRef.current?.start();
    setUploading(true);
    setError("");

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      if (!cloudName || !preset) {
        throw new Error("กรุณาตั้งค่า CLOUDINARY_CLOUD_NAME ใน .env.local");
      }

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
      if (mountedRef.current) onChange(optimized, data.public_id);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "อัพโหลดไม่สำเร็จ");
      }
    } finally {
      trackerRef.current?.finish();
      if (mountedRef.current) setUploading(false);
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
              aria-label="ลบรูปที่อัปโหลด"
              disabled={uploading}
              onClick={() => onChange("", "")}
              className="absolute -right-1 -top-1 rounded-full bg-negative p-0.5 text-white outline-none focus-visible:ring-2 focus-visible:ring-negative focus-visible:ring-offset-2 disabled:opacity-40"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
        <button
          type="button"
          aria-label={value ? "เปลี่ยนรูป" : "เลือกรูป"}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none transition-colors hover:border-ink focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-50"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? "กำลังอัพโหลด..." : value ? "เปลี่ยนรูป" : "เลือกรูป"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleFile}
          className="hidden"
          disabled={uploading}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-negative">
          <AlertCircle className="size-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
