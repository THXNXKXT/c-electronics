import { db } from "@/db";
import { products } from "@/db/schema";
import { createProduct, deleteProduct } from "../../actions";
import { Package, Plus, Trash2 } from "lucide-react";

export default async function AdminProductsPage() {
  const allProducts = await db.select().from(products).orderBy(products.createdAt);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">จัดการสินค้า</h1>
          <p className="mt-1 text-sm text-muted">{allProducts.length} รายการ</p>
        </div>
      </div>

      {/* Add product form */}
      <form action={createProduct} className="mb-8 rounded-[20px] border border-black/5 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="size-5 text-primary" />
          <h2 className="text-sm font-bold">เพิ่มสินค้าใหม่</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input name="name" required placeholder="ชื่อสินค้า" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <input name="category" required placeholder="หมวดหมู่" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <input name="price" type="number" required placeholder="ราคา (฿)" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm tabular-nums outline-none focus:border-primary" />
          <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm">
            <input type="checkbox" name="stock" defaultChecked className="peer sr-only" />
            <span className="relative h-5 w-9 rounded-full bg-black/15 transition-colors peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
            มีสินค้า
          </label>
        </div>
        <textarea name="description" rows={2} placeholder="คำอธิบาย (ไม่บังคับ)" className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <button type="submit" className="mt-3 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
          เพิ่มสินค้า
        </button>
      </form>

      {/* Products table */}
      <div className="overflow-hidden rounded-[20px] border border-black/5 bg-white">
        {allProducts.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto size-12 text-subtle" strokeWidth={1} />
            <p className="mt-3 text-sm text-muted">ยังไม่มีสินค้า</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wider text-subtle">
                  <th className="px-4 py-3 font-semibold">ชื่อ</th>
                  <th className="px-4 py-3 font-semibold">หมวดหมู่</th>
                  <th className="px-4 py-3 text-right font-semibold">ราคา</th>
                  <th className="px-4 py-3 text-center font-semibold">สต็อก</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {allProducts.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                    <td className="px-4 py-3 text-muted">{p.category}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary">฿{p.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${p.stock ? "text-positive" : "text-negative"}`}>
                        {p.stock ? "● มี" : "● หมด"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={() => deleteProduct(p.id)}>
                        <button type="submit" className="rounded-lg p-2 text-subtle transition-colors hover:bg-negative/5 hover:text-negative">
                          <Trash2 className="size-4" />
                        </button>
                      </form>
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
