import { db } from "@/db";
import { services } from "@/db/schema";
import { createService, deleteService } from "../../actions";
import { Plus, Trash2 } from "lucide-react";

export default async function AdminServicesPage() {
  const allServices = await db.select().from(services).orderBy(services.createdAt);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">จัดการบริการ</h1>
        <p className="mt-1 text-sm text-muted">{allServices.length} บริการ</p>
      </div>

      <form action={createService} className="mb-8 rounded-[20px] border border-black/5 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="size-5 text-primary" />
          <h2 className="text-sm font-bold">เพิ่มบริการใหม่</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input name="name" required placeholder="ชื่อบริการ" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <input name="price" placeholder="ราคา เช่น เริ่มต้น 1,500 ฿" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <input name="icon" placeholder="ชื่อ icon (Lucide)" defaultValue="Wrench" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
        </div>
        <textarea name="description" rows={2} placeholder="คำอธิบาย" className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <input name="image" placeholder="URL รูปภาพ (ไม่บังคับ)" className="mt-3 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <input name="features" placeholder="คุณสมบัติ (คั่นด้วยจุลภาค)" className="mt-3 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <button type="submit" className="mt-3 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
          เพิ่มบริการ
        </button>
      </form>

      <div className="overflow-hidden rounded-[20px] border border-black/5 bg-white">
        {allServices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted">ยังไม่มีบริการ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wider text-subtle">
                  <th className="px-4 py-3 font-semibold">ชื่อ</th>
                  <th className="px-4 py-3 font-semibold">ราคา</th>
                  <th className="px-4 py-3 font-semibold">icon</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {allServices.map((s) => (
                  <tr key={s.id} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{s.name}</p>
                      {s.description && <p className="mt-0.5 text-xs text-muted line-clamp-1">{s.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted">{s.price || "—"}</td>
                    <td className="px-4 py-3 text-muted">{s.icon}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={() => deleteService(s.id)}>
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
