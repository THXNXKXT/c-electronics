import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, MessageCircle, Clock } from "lucide-react";

const services = ["ติดตั้งแอร์", "กล้องวงจรปิด", "ระบบไฟฟ้า", "จานดาวเทียม"];
const menu = [
  { label: "สินค้า", href: "/products" },
  { label: "จองบริการ", href: "/booking" },
  { label: "เกี่ยวกับเรา", href: "/about" },
  { label: "ติดต่อ", href: "/contact" },
];

const linkHover = "relative inline-block w-fit bg-[length:0_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-200 hover:bg-[length:100%_2px] hover:text-ink";
const underlineStyle = { backgroundImage: "linear-gradient(var(--color-primary), var(--color-primary))" } as const;

export function Footer({ phone, line, address, hours }: { phone: string; line: string; address: string; hours: string }) {
  return (
    <footer className="relative border-t border-black/5">
      <div className="h-1 w-full" style={{ background: "linear-gradient(to right, var(--color-primary), transparent)" }} />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <Image src="/Logo.png" alt="C.Electronics" width={40} height={40} className="rounded-lg" />
              <span className="text-lg font-extrabold tracking-tight">C.<span className="text-primary">Electronics</span></span>
              <p className="text-xs font-semibold text-muted">ช.อิเล็กทรอนิกส์</p>
            </div>
            <p className="mt-1 text-sm font-medium text-muted">อะไหล่อิเล็กทรอนิกส์ & ติดตั้งมืออาชีพ</p>
            <p className="mt-3 max-w-xs text-sm text-muted">ร้านอะไหล่อิเล็กทรอนิกส์และรับติดตั้ง ให้บริการในจังหวัดเชียงรายและใกล้เคียง</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-subtle">บริการ</h4>
            <div className="mt-2 flex flex-col gap-1">
              {services.map((s) => (<Link key={s} href="/services" className={`mt-1 block min-h-11 py-2 text-sm text-muted transition-colors hover:text-ink ${linkHover}`} style={underlineStyle}>{s}</Link>))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-subtle">เมนู</h4>
            <div className="mt-2 flex flex-col gap-1">
              {menu.map((m) => (<Link key={m.href} href={m.href} className={`mt-1 block min-h-11 py-2 text-sm text-muted transition-colors hover:text-ink ${linkHover}`} style={underlineStyle}>{m.label}</Link>))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-subtle">ติดต่อ</h4>
            <p className="mt-3 flex min-h-11 items-center gap-2 text-sm text-muted"><MapPin className="size-4 shrink-0 text-primary" /> {address}</p>
            <p className="flex min-h-11 items-center gap-2 text-sm text-muted"><Phone className="size-4 shrink-0 text-primary" /> {phone}</p>
            <p className="flex min-h-11 items-center gap-2 text-sm text-muted"><MessageCircle className="size-4 shrink-0 text-primary" /> LINE {line}</p>
            <p className="flex min-h-11 items-center gap-2 text-sm text-muted"><Clock className="size-4 shrink-0 text-primary" /> {hours}</p>
          </div>
        </div>
        <div className="mt-8 border-t border-black/5 pt-6 text-xs text-subtle">© 2026 C.Electronics · ช.อิเล็กทรอนิกส์ — {address}</div>
      </div>
    </footer>
  );
}
