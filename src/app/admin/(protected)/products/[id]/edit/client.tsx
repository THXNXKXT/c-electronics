"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { MultiImageUpload } from "@/components/multi-image-upload";
import { updateProduct } from "../../actions-client";

export function AdminProductEditClient({
  product,
}: {
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    compareAtPrice: number | null;
    stock: boolean;
    description: string | null;
    image: string | null;
    images: string | null;
  };
}) {
  const [cover, setCover] = useState(product.image ?? "");
  // ponytail: images stored as comma-sep string in db — multi-upload replaces fixed slots
  const [gallery, setGallery] = useState<string[]>(
    product.images ? product.images.split(",").map(s => s.trim()).filter(Boolean) : []
  );
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.set("image", cover);
    fd.set("images", gallery.join("|"));
    // ponytail: keep existing publicId — edit form doesn't manage it
    if (product.image) fd.set("publicId", product.image);
    await updateProduct(product.id, fd);
    setSaving(false);
    window.location.href = "/admin/products";
  }

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        กลับ
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight">แก้ไขสินค้า</h1>
      <p className="mt-1 text-sm text-muted">{product.name}</p>

      <form
        onSubmit={handleSave}
        className="mt-6 rounded-[20px] border border-black/5 bg-white p-5"
      >
        {/* Cover image */}
        <div className="rounded-xl border border-black/5 bg-canvas-muted p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-subtle">
            รูปหลัก
          </p>
          <ImageUpload value={cover} onChange={setCover} folder="c-electronics/products" />
        </div>

        {/* Gallery — multi upload */}
        <div className="mt-4 rounded-xl border border-black/5 bg-canvas-muted p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-subtle">รูปเพิ่มเติม</p>
          <MultiImageUpload value={gallery} onChange={setGallery} folder="c-electronics/products" />
        </div>

        {/* Fields */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            name="name"
            defaultValue={product.name}
            required
            placeholder="ชื่อสินค้า"
            className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            name="category"
            defaultValue={product.category}
            required
            placeholder="หมวดหมู่"
            className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            name="price"
            type="number"
            defaultValue={product.price}
            required
            placeholder="ราคา (฿)"
            className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm tabular-nums outline-none focus:border-primary"
          />
          <input
            name="compareAtPrice"
            type="number"
            defaultValue={product.compareAtPrice ?? ""}
            min={0}
            placeholder="ราคาปกติ (฿) — ไม่บังคับ"
            className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm tabular-nums outline-none focus:border-primary line-through decoration-black/30"
          />
          <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm">
            <input type="checkbox" name="stock" defaultChecked={product.stock} className="peer sr-only" />
            <span className="relative h-5 w-9 rounded-full bg-black/15 transition-colors peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
            มีสินค้า
          </label>
        </div>
        <textarea
          name="description"
          rows={3}
          defaultValue={product.description ?? ""}
          placeholder="คำอธิบาย"
          className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
        />

        <button
          type="submit"
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </form>
    </div>
  );
}
