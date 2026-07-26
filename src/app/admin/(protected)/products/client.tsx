"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Plus, Trash2, Archive, ArchiveRestore, Pencil } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { MultiImageUpload } from "@/components/multi-image-upload";
import { ConfirmModal } from "@/components/confirm-modal";
import { createProductAction, deleteProductAction, archiveProduct } from "./actions-client";

export function AdminProductsClient({
  initialProducts,
}: {
  initialProducts: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    price: number;
    compareAtPrice: number | null;
    stock: boolean;
    archived: boolean;
    description: string | null;
    image: string | null;
  }>;
}) {
  const [items] = useState(initialProducts);
  const [newImage, setNewImage] = useState("");
  const [newGallery, setNewGallery] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const visible = showArchived ? items : items.filter((p) => !p.archived);
  const archivedCount = items.filter((p) => p.archived).length;

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAdding(true);
    const fd = new FormData(e.currentTarget);
    fd.set("image", newImage);
    fd.set("images", newGallery.join("|"));
    await createProductAction(fd);
    setAdding(false);
    setNewImage("");
    setNewGallery([]);
    router.refresh();
  }

  async function handleArchive(id: string, archived: boolean) {
    await archiveProduct(id, archived);
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteProductAction(deleteTarget.id);
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">จัดการสินค้า</h1>
          <p className="mt-1 text-sm text-muted">{items.length} รายการ{archivedCount > 0 && ` · ${archivedCount} ที่ archived`}</p>
        </div>
        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
          >
            <Archive className="size-3.5" /> {showArchived ? "ซ่อน archived" : `แสดง archived (${archivedCount})`}
          </button>
        )}
      </div>

      {/* Add form toggle */}
      <button
        type="button"
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-4 flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        <Plus className={`size-4 transition-transform ${showAddForm ? "rotate-45" : ""}`} />
        {showAddForm ? "ย่อ" : "เพิ่มสินค้า"}
      </button>

      {/* Add form */}
      {showAddForm && (
      <form onSubmit={handleAdd} className="mb-8 rounded-[20px] border border-black/5 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="size-5 text-primary" />
          <h2 className="text-sm font-bold">เพิ่มสินค้าใหม่</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input name="name" required placeholder="ชื่อสินค้า" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <input name="category" required placeholder="หมวดหมู่" list="categories" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <datalist id="categories">
            {[...new Set(items.map((p) => p.category))].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <input name="price" type="number" required placeholder="ราคา (฿)" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm tabular-nums outline-none focus:border-primary" />
          <input name="compareAtPrice" type="number" placeholder="ราคาปกติ (ไม่บังคับ)" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm tabular-nums outline-none focus:border-primary" />
          <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm">
            <input type="checkbox" name="stock" defaultChecked className="peer sr-only" />
            <span className="relative h-5 w-9 rounded-full bg-black/15 transition-colors peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
            มีสินค้า
          </label>
        </div>
        <textarea name="description" rows={2} placeholder="คำอธิบาย (ไม่บังคับ)" className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <div className="mt-3 flex items-center gap-4 rounded-xl border border-black/5 bg-canvas-muted p-4">
          <ImageUpload value={newImage} onChange={setNewImage} folder="c-electronics/products" />
          {!newImage && <p className="text-xs text-muted">รูปปกสินค้า</p>}
        </div>
        <div className="mt-3 rounded-xl border border-black/5 bg-canvas-muted p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-subtle">รูปเพิ่มเติม</p>
          <MultiImageUpload value={newGallery} onChange={setNewGallery} folder="c-electronics/products" />
        </div>
        <button type="submit" disabled={adding} className="mt-3 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
          {adding ? "กำลังเพิ่ม..." : "เพิ่มสินค้า"}
        </button>
      </form>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[20px] border border-black/5 bg-white">
        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto size-12 text-subtle" strokeWidth={1} />
            <p className="mt-3 text-sm text-muted">ยังไม่มีสินค้า</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wider text-subtle">
                  <th className="px-4 py-3 font-semibold">รูป</th>
                  <th className="px-4 py-3 font-semibold">ชื่อ</th>
                  <th className="px-4 py-3 font-semibold">หมวดหมู่</th>
                  <th className="px-4 py-3 text-right font-semibold">ราคา</th>
                  <th className="px-4 py-3 text-center font-semibold">สต็อก</th>
                  <th className="px-4 py-3 text-right font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className={`border-b border-black/5 last:border-0 ${p.archived ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt={p.name} className="size-10 rounded-lg object-cover" />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-lg bg-canvas-muted">
                          <Package className="size-4 text-subtle" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold">{p.name}{p.archived && <span className="ml-1 text-xs text-warning">(archived)</span>}</td>
                    <td className="px-4 py-3 text-muted">{p.category}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary">
                      ฿{p.price.toLocaleString()}
                      {p.compareAtPrice && <span className="block text-xs text-subtle line-through">฿{p.compareAtPrice.toLocaleString()}</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${p.stock ? "text-positive" : "text-negative"}`}>
                        {p.stock ? "● มี" : "● หมด"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/products/${p.id}/edit`} className="rounded-lg p-2 text-subtle transition-colors hover:bg-primary/5 hover:text-primary">
                          <Pencil className="size-4" />
                        </Link>
                        <button onClick={() => handleArchive(p.id, !p.archived)} className="rounded-lg p-2 text-subtle transition-colors hover:bg-warning/5 hover:text-warning">
                          {p.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                        </button>
                        <button onClick={() => setDeleteTarget({ id: p.id, name: p.name })} className="rounded-lg p-2 text-subtle transition-colors hover:bg-negative/5 hover:text-negative">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="ลบสินค้า"
        message={`ต้องการลบ "${deleteTarget?.name}" ใช่ไหม?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
