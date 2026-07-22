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

export function Footer() {
  return (
    <footer className="border-t border-black/5">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <Image src="/Logo.png" alt="C.Electronics" width={32} height={32} className="rounded-lg" />
              <span className="text-lg font-extrabold tracking-tight">
                C.<span className="text-primary">Electronics</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted">
              ร้านอะไหล่อิเล็กทรอนิกส์และรับติดตั้ง ให้บริการในจังหวัดเชียงรายและใกล้เคียง
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-subtle">บริการ</h4>
            {services.map((s) => (
              <Link key={s} href="/services" className="mt-2 block text-sm text-muted transition-colors hover:text-ink">
                {s}
              </Link>
            ))}
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-subtle">เมนู</h4>
            {menu.map((m) => (
              <Link key={m.href} href={m.href} className="mt-2 block text-sm text-muted transition-colors hover:text-ink">
                {m.label}
              </Link>
            ))}
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-subtle">ติดต่อ</h4>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted">
              <MapPin className="size-4 shrink-0 text-primary" /> เชียงราย
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted">
              <Phone className="size-4 shrink-0 text-primary" /> 0XX-XXX-XXXX
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted">
              <MessageCircle className="size-4 shrink-0 text-primary" /> LINE @celectronics
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted">
              <Clock className="size-4 shrink-0 text-primary" /> จ-สา 8:00-18:00
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-black/5 pt-6 text-xs text-subtle">
          © 2025 C.Electronics — จังหวัดเชียงราย
        </div>
      </div>
    </footer>
  );
}
