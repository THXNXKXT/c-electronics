import { db } from "@/db";
import { bookings } from "@/db/schema";
import { desc } from "drizzle-orm";
import { updateBookingStatus } from "../../actions";
import { ClipboardList, Phone, MapPin, Calendar, Clock, FileText, Home } from "lucide-react";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  contacted: "bg-blue-100 text-blue-700",
  scheduled: "bg-violet-100 text-violet-700",
  done: "bg-emerald-100 text-emerald-700",
};

const statusLabels: Record<string, string> = {
  pending: "รอติดต่อ",
  contacted: "ติดต่อแล้ว",
  scheduled: "นัดแล้ว",
  done: "เสร็จสิ้น",
};

const allStatuses = ["pending", "contacted", "scheduled", "done"];

export default async function AdminBookingsPage() {
  const allBookings = await db.select().from(bookings).orderBy(desc(bookings.createdAt));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">การจองบริการ</h1>
        <p className="mt-1 text-sm text-muted">{allBookings.length} คำขอ</p>
      </div>

      {allBookings.length === 0 ? (
        <div className="rounded-[20px] border border-black/5 bg-white py-16 text-center">
          <ClipboardList className="mx-auto size-12 text-subtle" strokeWidth={1} />
          <p className="mt-3 text-sm text-muted">ยังไม่มีคำขอจองบริการ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allBookings.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-[20px] border border-black/5 bg-white">
              {/* Header row — name + status + date */}
              <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold">{b.customerName}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[b.status] || statusStyles.pending}`}>
                    {statusLabels[b.status] || b.status}
                  </span>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-subtle">
                  <Clock className="size-3" /> {new Date(b.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>

              {/* Body — structured info grid */}
              <div className="px-5 py-4">
                {/* Service type — prominent */}
                <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-tint px-3 py-1.5 text-sm font-bold text-primary">
                  {b.serviceType}
                </p>

                {/* Info grid — 2 cols */}
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <a href={`tel:${b.phone}`} className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-primary">
                    <Phone className="size-4 shrink-0 text-subtle" /> {b.phone}
                  </a>
                  {b.district && (
                    <span className="flex items-center gap-2 text-sm text-muted">
                      <MapPin className="size-4 shrink-0 text-subtle" /> {b.district}
                    </span>
                  )}
                  {b.preferredDate && (
                    <span className="flex items-center gap-2 text-sm text-muted">
                      <Calendar className="size-4 shrink-0 text-subtle" /> {b.preferredDate}
                    </span>
                  )}
                  {b.address && (
                    <span className="flex items-center gap-2 text-sm text-muted">
                      <Home className="size-4 shrink-0 text-subtle" /> {b.address}
                    </span>
                  )}
                </div>

                {/* Description */}
                {b.description && (
                  <div className="mt-3 flex gap-2 rounded-lg bg-canvas-muted px-3 py-2.5">
                    <FileText className="size-4 shrink-0 text-subtle" />
                    <p className="text-sm text-muted">{b.description}</p>
                  </div>
                )}
              </div>

              {/* Footer — status changer */}
              <div className="flex flex-wrap gap-1.5 border-t border-black/5 px-5 py-3">
                {allStatuses.map((s) => (
                  <form key={s} action={updateBookingStatus.bind(null, b.id)}>
                    <button
                      type="submit"
                      name="status"
                      value={s}
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        b.status === s
                          ? "bg-primary text-white"
                          : "bg-canvas-muted text-muted hover:bg-black/5 hover:text-ink"
                      }`}
                    >
                      {statusLabels[s]}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
