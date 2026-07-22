import { MapPin, Phone, MessageCircle, Clock, Mail, PhoneCall, Navigation, QrCode } from "lucide-react";

const PHONE = "0XX-XXX-XXXX";
const LINE_URL = "https://line.me";
const MAPS_DIR_URL = "https://www.google.com/maps/dir/?api=1&destination=Chiang+Rai";

const contactItems = [
  { icon: MapPin, label: "ที่อยู่", value: "เชียงราย (ระบุพิกัดบนแผนที่)" },
  { icon: Phone, label: "โทรศัพท์", value: "0XX-XXX-XXXX", href: `tel:${PHONE}` },
  { icon: MessageCircle, label: "LINE", value: "@celectronics", href: LINE_URL },
  { icon: Mail, label: "อีเมล", value: "contact@celectronics.com", href: "mailto:contact@celectronics.com" },
];

const hours = [
  { day: "จันทร์ - ศุกร์", time: "8:00 - 18:00" },
  { day: "เสาร์", time: "8:00 - 17:00" },
  { day: "อาทิตย์", time: "9:00 - 16:00" },
];

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-black/5 bg-canvas-muted">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">ติดต่อเรา</h1>
          <p className="mt-2 text-muted">ติดต่อสอบถามหรือเข้ามาที่ร้านได้ในเวลาทำการ</p>
          {/* Prominent call button */}
          <a
            href={`tel:${PHONE}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:shadow-xl"
          >
            <PhoneCall className="size-5" /> โทรเลย {PHONE}
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-8 lg:grid-cols-2">
          {/* Contact info column */}
          <div className="flex flex-col">
            <h2 className="text-xl font-bold tracking-tight">ช่องทางติดต่อ</h2>
            <div className="mt-5 space-y-4">
              {contactItems.map((item) => {
                const Icon = item.icon;
                const content = (
                  <div className="flex items-center gap-4 rounded-[16px] border border-black/5 bg-white p-4 transition-colors hover:border-primary/20">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint">
                      <Icon className="size-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{item.label}</p>
                      <p className="text-sm font-semibold text-ink">{item.value}</p>
                    </div>
                  </div>
                );
                return item.href ? (
                  <a key={item.label} href={item.href} className="block">{content}</a>
                ) : (
                  <div key={item.label}>{content}</div>
                );
              })}
            </div>

            {/* LINE QR placeholder */}
            <div className="mt-5 flex items-center gap-4 rounded-[16px] border border-black/5 bg-white p-5">
              <div className="flex size-24 shrink-0 flex-col items-center justify-center rounded-xl bg-canvas-muted">
                <QrCode className="size-10 text-primary" strokeWidth={1} />
                <span className="mt-1 text-[10px] font-semibold text-subtle">QR Code</span>
              </div>
              <div>
                <p className="text-sm font-bold text-ink">สแกนเพิ่มเพื่อน LINE</p>
                <p className="mt-1 text-sm text-muted">แสกน QR Code เพื่อเพิ่มเพื่อนและสอบถามได้ทันที</p>
                <a href={LINE_URL} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
                  <MessageCircle className="size-4" /> @celectronics
                </a>
              </div>
            </div>

            {/* Hours — table-like with alternating rows */}
            <h2 className="mt-8 text-xl font-bold tracking-tight">เวลาทำการ</h2>
            <div className="mt-5 overflow-hidden rounded-[16px] border border-black/5">
              {hours.map((h, i) => (
                <div
                  key={h.day}
                  className={`flex items-center justify-between px-5 py-3.5 ${i % 2 === 0 ? "bg-white" : "bg-canvas-muted"}`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Clock className="size-4 text-primary" /> {h.day}
                  </span>
                  <span className="text-sm font-bold tabular-nums">{h.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map column — full height, equal to info column */}
          <div className="flex flex-col">
            <h2 className="text-xl font-bold tracking-tight">แผนที่มาที่ร้าน</h2>
            <div className="mt-5 flex flex-1 flex-col overflow-hidden rounded-[20px] border border-black/5">
              <iframe
                src="https://maps.google.com/maps?q=Chiang%20Rai&t=&z=12&ie=UTF8&iwloc=&output=embed"
                width="100%"
                className="min-h-[400px] flex-1 lg:min-h-[600px]"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="แผนที่ C.Electronics เชียงราย"
              />
              {/* Directions link */}
              <a
                href={MAPS_DIR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-primary px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
              >
                <Navigation className="size-4" /> นำทางมาที่ร้าน (Google Maps)
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
