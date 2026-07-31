import Link from "next/link";
import { Package, ClipboardList, LogOut, ExternalLink, Phone, Wrench, FileText } from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");

  const navItems = [
    { label: "สินค้า", href: "/admin/products", icon: Package },
    { label: "บริการ", href: "/admin/services", icon: Wrench },
    { label: "การจอง", href: "/admin/bookings", icon: ClipboardList },
    { label: "บทความ", href: "/admin/articles", icon: FileText },
  { label: "ติดต่อ", href: "/admin/contact", icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-canvas-muted">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight">
              Admin<span className="text-primary">.</span>
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-canvas-muted hover:text-ink sm:text-sm"
                >
                  <Icon className="size-4" /> <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-canvas-muted hover:text-ink sm:text-sm"
            >
              <ExternalLink className="size-4" /> <span className="hidden sm:inline">เว็บไซต์</span>
            </Link>
            <form
              action={async () => {
                "use server";
                await auth.api.signOut({ headers: await headers() });
                redirect("/admin/login");
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold text-negative transition-colors hover:bg-negative/5 sm:text-sm"
              >
                <LogOut className="size-4" /> <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
