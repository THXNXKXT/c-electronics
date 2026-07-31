"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { updateServiceAction } from "../../actions";
import {
  completeLegacyServiceFormData,
  type LegacyServiceMetadata,
} from "@/lib/service-input";

export function AdminServiceEditClient({
  service,
}: {
  service: LegacyServiceMetadata & {
    id: string;
    name: string;
    price: string | null;
    description: string | null;
    image: string | null;
    features: string | null;
  };
}) {
  const [image, setImage] = useState(service.image ?? "");
  const [features, setFeatures] = useState<string[]>(
    service.features ? service.features.split("|").filter(Boolean) : [""]
  );
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.set("image", image);
    fd.set("features", features.filter(Boolean).join("|"));
    completeLegacyServiceFormData(fd, service);
    await updateServiceAction(service.id, fd);
    setSaving(false);
    window.location.href = "/admin/services";
  }

  return (
    <div>
      <Link href="/admin/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink">
        <ArrowLeft className="size-4" /> กลับ
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight">แก้ไขบริการ</h1>
      <p className="mt-1 text-sm text-muted">{service.name}</p>

      <form onSubmit={handleSave} className="mt-6 rounded-[20px] border border-black/5 bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="name" defaultValue={service.name} required minLength={3} maxLength={120} placeholder="ชื่อบริการ" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <input name="price" defaultValue={service.price ?? ""} placeholder="ราคา เช่น เริ่มต้น 1,500 ฿" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
        </div>
        <textarea name="description" rows={2} required minLength={20} maxLength={500} defaultValue={service.description ?? ""} placeholder="คำอธิบาย" className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <div className="mt-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-subtle">คุณสมบัติ</p>
          <div className="space-y-2">
            {features.map((f, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={f}
                  onChange={(e) => setFeatures(features.map((v, j) => j === i ? e.target.value : v))}
                  placeholder={`คุณสมบัติข้อที่ ${i + 1}`}
                  className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                {features.length > 1 && (
                  <button type="button" onClick={() => setFeatures(features.filter((_, j) => j !== i))} className="rounded-lg p-2 text-subtle hover:bg-negative/5 hover:text-negative">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setFeatures([...features, ""])} className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            <Plus className="size-3.5" /> เพิ่มคุณสมบัติ
          </button>
        </div>

        <div className="mt-3 rounded-xl border border-black/5 bg-canvas-muted p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-subtle">รูปบริการ</p>
          <ImageUpload value={image} onChange={setImage} folder="c-electronics/services" />
        </div>

        <button type="submit" disabled={saving} className="mt-4 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </form>
    </div>
  );
}
