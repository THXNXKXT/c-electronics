import { db } from "@/db";
import { bookings } from "@/db/schema";
import { updateBookingStatus } from "../../actions";
import { ClipboardList, Phone, MapPin, Calendar } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-warning",
  contacted: "bg-blue-50 text-primary",
  scheduled: "bg-violet-50 text-violet-600",
  done: "bg-emerald-50 text-positive",
};

const statusLabels: Record<string, string> = {
  pending: "รอติดต่อ",
  contacted: "ติดต่อแล้ว",
  scheduled: "นัดแล้ว",
  done: "เสร็จสิ้น",
};

const allStatuses = ["pending", "contacted", "scheduled", "done"];

export default async function AdminBookingsPage() {
  const allBookings = await db.select().from(bookings).orderBy(bookings.createdAt);

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
            <div key={b.id} className="rounded-[20px] border border-black/5 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold">{b.customerName}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[b.status] || statusColors.pending}`}>
                      {statusLabels[b.status] || b.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-primary">{b.serviceType}</p>
                </div>
                <span className="text-xs text-subtle">{new Date(b.createdAt).toLocaleDateString("th-TH")}</span>
              </div>

              <div className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-3">
                <span className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0 text-subtle" /> {b.phone}
                </span>
                {b.district && (
                  <span className="flex items-center gap-2">
                    <MapPin className="size-3.5 shrink-0 text-subtle" /> {b.district}
                  </span>
                )}
                {b.preferredDate && (
                  <span className="flex items-center gap-2">
                    <Calendar className="size-3.5 shrink-0 text-subtle" /> {b.preferredDate}
                  </span>
                )}
              </div>

              {b.description && (
                <p className="mt-2 rounded-lg bg-canvas-muted px-3 py-2 text-sm text-muted">{b.description}</p>
              )}
              {b.address && <p className="mt-2 text-sm text-muted">ที่อยู่: {b.address}</p>}

              {/* Status changer */}
              <form action={updateBookingStatus.bind(null, b.id)} className="mt-3 flex flex-wrap gap-2">
                {allStatuses.map((s) => (
                  <button
                    key={s}
                    type="submit"
                    name="status"
                    value={s}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      b.status === s
                        ? "bg-primary text-white"
                        : "bg-canvas-muted text-muted hover:text-ink"
                    }`}
                  >
                    {statusLabels[s]}
                  </button>
                ))}
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
