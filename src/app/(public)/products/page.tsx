"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Snowflake,
  Camera,
  Zap,
  Wifi,
  Cpu,
  Search,
  Phone,
  ArrowUpDown,
  MessageCircle,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";

type Product = {
  name: string;
  category: string;
  price: number;
  stock: boolean;
  icon: LucideIcon;
};

const PHONE = "0XX-XXX-XXXX";
const LINE_URL = "https://line.me";

const categories = [
  { label: "ทั้งหมด", value: "all" },
  { label: "อะไหล่แอร์", value: "ac" },
  { label: "กล้องวงจรปิด", value: "cctv" },
  { label: "อุปกรณ์ไฟฟ้า", value: "elec" },
  { label: "เครือข่าย", value: "net" },
  { label: "อิเล็กทรอนิกส์", value: "parts" },
] as const;

const products: Product[] = [
  { name: "Router WiFi 6 Dual Band", category: "net", price: 1290, stock: true, icon: Wifi },
  { name: "Router WiFi 5 AC1200", category: "net", price: 690, stock: true, icon: Wifi },
  { name: "CCTV Camera 4K POE", category: "cctv", price: 2450, stock: true, icon: Camera },
  { name: "CCTV Dome 1080p", category: "cctv", price: 890, stock: true, icon: Camera },
  { name: "DVR 8 Channel", category: "cctv", price: 3200, stock: true, icon: Camera },
  { name: "คอมเพรสเซอร์แอร์ 12,000 BTU", category: "ac", price: 3800, stock: true, icon: Snowflake },
  { name: "พัดลมแอร์ Indoor", category: "ac", price: 650, stock: false, icon: Snowflake },
  { name: "แผงวงจรแอร์ (PCB)", category: "ac", price: 1200, stock: true, icon: Snowflake },
  { name: "เบรกเกอร์ 1P 32A Schneider", category: "elec", price: 350, stock: true, icon: Zap },
  { name: "ตู้ไฟ 8 ช่อง", category: "elec", price: 850, stock: true, icon: Zap },
  { name: "ดินสอไฟ 30mA", category: "elec", price: 450, stock: true, icon: Zap },
  { name: "สายไฟ VAF 2.5mm (เส้น)", category: "elec", price: 28, stock: true, icon: Zap },
  { name: "Arduino UNO R3", category: "parts", price: 320, stock: true, icon: Cpu },
  { name: "ESP32 DevKit", category: "parts", price: 180, stock: true, icon: Cpu },
  { name: "Relay Module 4CH", category: "parts", price: 85, stock: true, icon: Cpu },
  { name: "Power Supply 12V 5A", category: "parts", price: 250, stock: true, icon: Cpu },
];

const catLabel = (v: string) => categories.find((c) => c.value === v)?.label ?? v;

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");
  const [sort, setSort] = useState<"default" | "asc" | "desc">("default");

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchCat = active === "all" || p.category === active;
      const matchQuery = !query || p.name.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
    if (sort === "asc") result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "desc") result = [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [query, active, sort]);

  return (
    <>
      {/* ===== HEADER ===== */}
      <section className="border-b border-black/5 bg-canvas-muted">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            แคตตาล็อกสินค้า
          </h1>
          <p className="mt-2 text-muted">
            อะไหล่และอุปกรณ์อิเล็กทรอนิกส์ครบครัน — {products.length} รายการ
          </p>
        </div>
      </section>

      {/* ===== SEARCH + FILTER (sticky below nav) ===== */}
      <section className="sticky top-16 z-40 border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาสินค้า..."
                className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              {/* Sort dropdown */}
              <div className="relative shrink-0">
                <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="appearance-none rounded-full border border-black/10 bg-white py-2 pl-8 pr-8 text-xs font-semibold outline-none transition-colors hover:border-ink/20 focus:border-primary sm:text-sm"
                >
                  <option value="default">เรียงตาม</option>
                  <option value="asc">ราคาน้อย→มาก</option>
                  <option value="desc">ราคามาก→น้อย</option>
                </select>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                {categories.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setActive(c.value)}
                    className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                      active === c.value
                        ? "bg-primary text-white"
                        : "bg-canvas-muted text-muted hover:text-ink"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRODUCT GRID ===== */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {filtered.length === 0 ? (
          /* Empty state with CTA */
          <div className="flex flex-col items-center py-20 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-canvas-muted">
              <Search className="size-8 text-subtle" strokeWidth={1.5} />
            </div>
            <p className="mt-6 text-lg font-semibold text-ink">ไม่พบสินค้าที่ค้นหา</p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              ลองเปลี่ยนคำค้นหรือหมวดหมู่ หรือโทรสอบถามเราได้โดยตรง — มีทีมงานพร้อมแนะนำ
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={`tel:${PHONE}`}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                <PhoneCall className="size-4" /> โทรสอบถาม
              </a>
              <a
                href={LINE_URL}
                className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
              >
                <MessageCircle className="size-4 text-primary" /> แชท LINE
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Result count with smooth transition */}
            <div className="mb-4 h-5">
              <motion.p
                key={filtered.length}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-muted"
              >
                พบ <span className="font-bold text-ink">{filtered.length}</span> รายการ
              </motion.p>
            </div>
            {/* ponytail: Tailwind grid-cols-N already emits minmax(0,1fr) — no inline override needed (Hallmark gate 50) */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                    className="group flex flex-col rounded-[20px] border border-black/5 border-l-[3px] border-l-transparent bg-white p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-l-primary hover:shadow-md sm:p-5"
                  >
                    <div className="mb-4 flex aspect-square items-center justify-center rounded-xl bg-surface-tint">
                      <Icon className="size-8 text-primary sm:size-10" strokeWidth={1.5} />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle sm:text-xs">
                      {catLabel(p.category)}
                    </p>
                    <p className="mt-1 flex-1 text-sm font-semibold leading-snug">{p.name}</p>
                    <div className="mt-3 flex items-end justify-between">
                      <p className="text-base font-extrabold tabular-nums text-primary sm:text-xl">
                        ฿{p.price.toLocaleString()}
                      </p>
                      <span className={`text-xs font-medium ${p.stock ? "text-positive" : "text-negative"}`}>
                        {p.stock ? "● มีสินค้า" : "● สินค้าหมด"}
                      </span>
                    </div>
                    {/* Inquire button */}
                    <a
                      href={LINE_URL}
                      className="mt-3 flex items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary-tint py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                      <MessageCircle className="size-3.5" /> สอบถาม
                    </a>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 rounded-[24px] bg-ink px-6 py-8 sm:flex-row sm:px-10">
          <p className="text-center text-sm text-white/70 sm:text-left sm:text-base">
            ไม่พบสินค้าที่ต้องการ? โทรสอบถามได้เลย
          </p>
          <a
            href={`tel:${PHONE}`}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Phone className="size-4" /> โทรสอบถาม
          </a>
        </div>
      </section>
    </>
  );
}
