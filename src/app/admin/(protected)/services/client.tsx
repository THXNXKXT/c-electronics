"use client";

import { useState } from "react";
import { Wrench, Plus, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { createServiceAction, deleteServiceAction } from "./actions-client";

export function AdminServicesClient({
  initialServices,
}: {
  initialServices: Array<{
    id: string;
    name: string;
    price: string | null;
    icon: string | null;
    description: string | null;
    image: string | null;
    features: string | null;
  }>;
}) {
  const [items] = useState(initialServices);
  const [newImage, setNewImage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAdding(true);
    const fd = new FormData(e.currentTarget);
    fd.set("image", newImage);
    await createServiceAction(fd);
    setAdding(false);
    setNewImage("");
    window.location.reload();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">จัดการบริการ</h1>
        <p className="mt-1 text-sm text-muted">{items.length} บริการ</p>
      </div>

      {/* Add form toggle */}
      <button
        type="button"
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-4 flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        <Plus className={`size-4 transition-transform ${showAddForm ? "rotate-45" : ""}`} />
        {showAddForm ? "ย่อ" : "เพิ่มบริการ"}
      </button>

      {/* Add form */}
      {showAddForm && (
      <form onSubmit={handleAdd} className="mb-8 rounded-[20px] border border-black/5 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="size-5 text-primary" />
          <h2 className="text-sm font-bold">เพิ่มบริการใหม่</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input name="name" required placeholder="ชื่อบริการ เช่น ติดตั้งแอร์" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <input name="price" placeholder="ราคา เช่น เริ่มต้น 1,500 ฿" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
        </div>
        <textarea name="description" rows={2} placeholder="คำอธิบาย" className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <input name="features" placeholder="คุณสมบัติ เช่น ติดตั้งแอร์ใหม่, ย้ายตำแหน่ง, ล้างแอร์" className="mt-3 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <div className="mt-3 flex items-center gap-4 rounded-xl border border-black/5 bg-canvas-muted p-4">
          <ImageUpload value={newImage} onChange={setNewImage} folder="c-electronics/services" />
          {!newImage && <p className="text-xs text-muted">รูปบริการ</p>}
        </div>
        <button type="submit" disabled={adding} className="mt-3 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
          {adding ? "กำลังเพิ่ม..." : "เพิ่มบริการ"}
        </button>
      </form>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[20px] border border-black/5 bg-white">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <Wrench className="mx-auto size-12 text-subtle" strokeWidth={1} />
            <p className="mt-3 text-sm text-muted">ยังไม่มีบริการ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wider text-subtle">
                  <th className="px-4 py-3 font-semibold">รูป</th>
                  <th className="px-4 py-3 font-semibold">บริการ</th>
                  <th className="px-4 py-3 font-semibold">ราคา</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3">
                      {s.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image} alt={s.name} className="size-10 rounded-lg object-cover" />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-lg bg-canvas-muted">
                          <Wrench className="size-4 text-subtle" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{s.name}</p>
                      {s.description && <p className="mt-0.5 max-w-xs truncate text-xs text-muted">{s.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted">{s.price || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={async () => { if (confirm("ลบบริการนี้?")) { await deleteServiceAction(s.id); window.location.reload(); } }}
                        className="rounded-lg p-2 text-subtle transition-colors hover:bg-negative/5 hover:text-negative"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
