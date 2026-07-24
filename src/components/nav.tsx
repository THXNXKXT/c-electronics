"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Phone, Menu, X } from "lucide-react";

const navLinks = [
  { label: "สินค้า", href: "/products" },
  { label: "บริการ", href: "/services" },
  { label: "จองบริการ", href: "/booking" },
  { label: "เกี่ยวกับเรา", href: "/about" },
  { label: "ติดต่อ", href: "/contact" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-black/5 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/Logo.png" alt="C.Electronics" width={36} height={36} className="rounded-lg" priority />
          <span className="text-lg font-extrabold tracking-tight sm:text-xl">
            C.<span className="text-primary">Electronics</span>
            <span className="ml-1.5 hidden text-xs font-semibold text-muted sm:inline">ช.อิเล็กทรอนิกส์</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={`whitespace-nowrap text-sm font-semibold transition-colors hover:text-ink ${
                    active ? "text-ink" : "text-muted"
                  }`}
                >
                  {item.label}
                </Link>
                {active && (
                  <span className="absolute -bottom-[1.125rem] left-0 h-0.5 w-full rounded-full bg-primary" />
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="tel:0XX-XXX-XXXX"
            className="hidden items-center gap-2 whitespace-nowrap text-sm font-medium text-muted transition-colors hover:text-ink lg:flex"
          >
            <Phone className="size-4 text-primary" />
            0XX-XXX-XXXX
          </a>
          <Link
            href="/booking"
            className="hidden whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover md:inline-block"
          >
            จองบริการ
          </Link>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={open}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-ink transition-colors hover:bg-black/5 md:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown — opacity + translateY transition */}
      <div
        className={`overflow-hidden border-b border-black/5 bg-white md:hidden ${
          open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ transition: "max-height 200ms ease, opacity 200ms ease" }}
      >
        <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
          {navLinks.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                    active ? "bg-primary-tint text-primary" : "text-muted hover:bg-black/5 hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <a
              href="tel:0XX-XXX-XXXX"
              className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted"
            >
              <Phone className="size-4 text-primary" />
              0XX-XXX-XXXX
            </a>
          </li>
          <li className="py-2">
            <Link
              href="/booking"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              จองบริการ
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
