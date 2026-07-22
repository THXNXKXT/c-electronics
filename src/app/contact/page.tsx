import { MapPin, Phone, MessageCircle, Clock, Mail } from "lucide-react";

const contactItems = [
  { icon: MapPin, label: "ที่อยู่", value: "เชียงราย (ระบุพิกัดบนแผนที่)" },
  { icon: Phone, label: "โทรศัพท์", value: "0XX-XXX-XXXX", href: "tel:0XX-XXX-XXXX" },
  { icon: MessageCircle, label: "LINE", value: "@celectronics", href: "https://line.me" },
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
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact info */}
          <div>
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

            {/* Hours */}
            <h2 className="mt-8 text-xl font-bold tracking-tight">เวลาทำการ</h2>
            <div className="mt-5 rounded-[16px] border border-black/5 bg-white p-5">
              {hours.map((h) => (
                <div key={h.day} className="flex items-center justify-between border-b border-black/5 py-2.5 last:border-0">
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <Clock className="size-4 text-primary" /> {h.day}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{h.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map */}
          <div>
            <h2 className="text-xl font-bold tracking-tight">แผนที่</h2>
            <div className="mt-5 overflow-hidden rounded-[20px] border border-black/5">
              <iframe
                src="https://maps.google.com/maps?q=Chiang%20Rai&t=&z=12&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="450"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="แผนที่ C.Electronics เชียงราย"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
