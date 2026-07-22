import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { label: "สินค้า", href: "/products" },
  { label: "บริการ", href: "/services" },
  { label: "จองบริการ", href: "/booking" },
  { label: "เกี่ยวกับเรา", href: "/about" },
  { label: "ติดต่อ", href: "/contact" },
];

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-black/5 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/Logo.png" alt="C.Electronics" width={36} height={36} className="rounded-lg" priority />
          <span className="text-lg font-extrabold tracking-tight sm:text-xl">
            C.<span className="text-primary">Electronics</span>
          </span>
        </Link>
        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="whitespace-nowrap text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/booking"
          className="whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          จองบริการ
        </Link>
      </div>
    </nav>
  );
}
