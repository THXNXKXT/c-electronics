import { listAdminServices } from "@/lib/service-queries";
import { Archive, Search, Wrench } from "lucide-react";
import { ServiceQuickCreate } from "./service-quick-create";
import { ServiceRowActions } from "./service-row-actions";

const statusOptions = [
  { value: "all", label: "ทั้งหมด" },
  { value: "draft", label: "ฉบับร่าง" },
  { value: "published", label: "เผยแพร่แล้ว" },
  { value: "archived", label: "เก็บถาวร" },
] as const;

type ServiceFilterStatus = (typeof statusOptions)[number]["value"];
type AdminServiceRow = Awaited<ReturnType<typeof listAdminServices>>[number];

function ServiceAdminHeader({ count }: { count: number }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">จัดการบริการ</h1>
        <p className="mt-1 text-sm text-muted">
          {count} รายการในมุมมองนี้
        </p>
      </div>
    </div>
  );
}

function ServiceFilters({
  query,
  status,
}: {
  query: string;
  status: ServiceFilterStatus;
}) {
  return (
    <form className="mb-5 grid gap-3 rounded-[20px] border border-black/5 bg-white p-4 sm:grid-cols-[1fr_180px_auto]">
      <label className="relative">
        <span className="sr-only">ค้นหาบริการ</span>
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="ค้นหาชื่อหรือ slug"
          className="w-full rounded-xl border border-black/10 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </label>
      <label>
        <span className="sr-only">กรองตามสถานะ</span>
        <select
          name="status"
          defaultValue={status}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-primary"
      >
        กรอง
      </button>
    </form>
  );
}

function ServiceTable({ rows }: { rows: AdminServiceRow[] }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-black/5 bg-white">
      {rows.length === 0 ? (
        <div className="py-16 text-center">
          <Wrench className="mx-auto size-12 text-subtle" strokeWidth={1} />
          <p className="mt-3 text-sm text-muted">
            ไม่พบบริการตามตัวกรอง
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wider text-subtle">
                <th className="px-4 py-3 font-semibold">รูป</th>
                <th className="px-4 py-3 font-semibold">บริการ</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="px-4 py-3 font-semibold">ราคา</th>
                <th className="px-4 py-3 font-semibold">แก้ไขล่าสุด</th>
                <th
                  scope="col"
                  aria-label="การดำเนินการ"
                  className="px-4 py-3"
                />
              </tr>
            </thead>
            <tbody>
              {rows.map((service) => (
                <tr
                  key={service.id}
                  className="border-b border-black/5 last:border-0"
                >
                  <td className="px-4 py-3">
                    {service.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={service.image}
                        alt={service.imageAlt || service.name}
                        className="size-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-lg bg-canvas-muted">
                        <Wrench className="size-4 text-subtle" />
                      </div>
                    )}
                  </td>
                  <td className="max-w-md px-4 py-3">
                    <p className="font-semibold">{service.name}</p>
                    <p className="mt-0.5 truncate font-mono text-xs text-muted">
                      /services/{service.slug}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        service.archived
                          ? "bg-canvas-muted text-muted"
                          : service.status === "published"
                            ? "bg-positive/10 text-positive"
                            : "bg-warning/10 text-warning"
                      }`}
                    >
                      {service.archived && <Archive className="size-3" />}
                      {service.archived
                        ? "เก็บถาวร"
                        : service.status === "published"
                          ? "เผยแพร่แล้ว"
                          : "ฉบับร่าง"}
                      {service.noIndex && " · noindex"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {service.price || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                    {service.updatedAt.toLocaleDateString("th-TH", {
                      dateStyle: "medium",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <ServiceRowActions service={service} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const allowed = new Set(["all", "draft", "published", "archived"]);
  const status = allowed.has(params.status ?? "")
    ? (params.status as ServiceFilterStatus)
    : "all";
  const rows = await listAdminServices({
    query: params.q,
    status,
  });

  return (
    <main>
      <ServiceAdminHeader count={rows.length} />
      <ServiceQuickCreate />
      <ServiceFilters query={params.q ?? ""} status={status} />
      <ServiceTable rows={rows} />
    </main>
  );
}
