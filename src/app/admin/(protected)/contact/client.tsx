"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { updateSettings } from "./actions-client";

type Settings = {
  phone: string | null;
  line: string | null;
  email: string | null;
  address: string | null;
  mondayFriday: string | null;
  saturday: string | null;
  sunday: string | null;
  mapsEmbed: string | null;
};

export function AdminContactClient({ initial }: { initial: Settings | null }) {
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await updateSettings(fd);
    setSaving(false);
    window.location.reload();
  }

  const s = initial ?? { phone: "", line: "", email: "", address: "", mondayFriday: "", saturday: "", sunday: "", mapsEmbed: "" };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">ข้อมูลติดต่อ</h1>
        <p className="mt-1 text-sm text-muted">แก้ไขข้อมูลที่แสดงในหน้าติดต่อและส่วนต่างๆ ของเว็บ</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 rounded-[20px] border border-black/5 bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-subtle">เบอร์โทร</label>
            <input name="phone" defaultValue={s.phone ?? ""} placeholder="0XX-XXX-XXXX" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-subtle">LINE</label>
            <input name="line" defaultValue={s.line ?? ""} placeholder="@celectronics" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-subtle">อีเมล</label>
            <input name="email" defaultValue={s.email ?? ""} placeholder="contact@celectronics.com" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-subtle">ที่อยู่</label>
            <input name="address" defaultValue={s.address ?? ""} placeholder="เชียงราย" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
        </div>

        <div className="border-t border-black/5 pt-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-subtle">เวลาทำการ</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="mondayFriday" defaultValue={s.mondayFriday ?? ""} placeholder="จ-ศ 8:00-18:00" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
            <input name="saturday" defaultValue={s.saturday ?? ""} placeholder="ส 8:00-17:00" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
            <input name="sunday" defaultValue={s.sunday ?? ""} placeholder="อา 9:00-16:00" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
        </div>

        <div className="border-t border-black/5 pt-4">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-subtle">Google Maps Embed URL</label>
          <textarea name="mapsEmbed" rows={2} defaultValue={s.mapsEmbed ?? ""} placeholder="https://maps.google.com/maps?q=..." className="w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <p className="mt-1 text-xs text-subtle">คัดลอก URL จาก Google Maps → Share → Embed a map → คัดลอกส่วน src เท่านั้น</p>
        </div>

        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </form>
    </div>
  );
}
