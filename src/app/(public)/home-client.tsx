"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { MapPin, Award, Gift, ShieldCheck, Clock, ArrowRight, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const reveal = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { margin: "0px 0px 400px 0px" },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  icon: string | null;
  image: string | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  stock: boolean;
  image: string | null;
};

function getIcon(name: string | null): LucideIcon {
  if (!name) return Icons.Wrench;
  return (Icons as Record<string, LucideIcon>)[name] ?? Icons.Wrench;
}

export function HomeClient({ services, products }: { services: Service[]; products: Product[] }) {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="bg-gradient-to-b from-canvas-muted to-canvas">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
          <div className="flex items-center justify-between gap-8">
            <div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-4 py-2 text-xs font-semibold text-primary sm:text-sm">
                <MapPin className="size-3.5" /> ให้บริการในจังหวัดเชียงรายและใกล้เคียง
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                อะไหล่อิเล็กทรอนิกส์<br />และ<span className="text-primary">ติดตั้งทุกระบบ</span><br />ในเชียงราย
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-5 max-w-xl text-base text-muted sm:text-lg">
                ขายอะไหล่อิเล็กทรอนิกส์ครบครัน รับติดตั้งแอร์ กล้องวงจรปิด ระบบไฟฟ้าบ้าน จานดาวเทียม และรับซ่อมเครื่องใช้ไฟฟ้า โดยช่างผู้เชี่ยวชาญ
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="mt-8 flex flex-wrap gap-3">
                <Link href="/booking" className="whitespace-nowrap rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:text-base">จองบริการ →</Link>
                <Link href="/products" className="whitespace-nowrap rounded-full border border-black/10 bg-white px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink sm:text-base">ดูสินค้า</Link>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1.5 text-xs font-bold shadow-sm sm:text-sm"><Award className="size-4 text-primary" strokeWidth={2} /> 10+ ปี</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1.5 text-xs font-bold shadow-sm sm:text-sm"><Gift className="size-4 text-primary" strokeWidth={2} /> ฟรีประเมิน</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1.5 text-xs font-bold shadow-sm sm:text-sm"><ShieldCheck className="size-4 text-primary" strokeWidth={2} /> รับประกันงาน</span>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }} transition={{ opacity: { duration: 0.6, delay: 0.2 }, scale: { duration: 0.6, delay: 0.2 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }} className="hidden shrink-0 lg:block">
              <Image src="/Logo.png" alt="C.Electronics" width={280} height={280} priority />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div {...reveal}>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary sm:text-sm">บริการของเรา</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">ติดตั้งและซ่อมครบทุกอย่างในที่เดียว</h2>
        </motion.div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const Icon = getIcon(s.icon);
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ margin: "0px 0px 300px 0px" }} transition={{ duration: 0.4, delay: i * 0.05 }} className="group cursor-pointer overflow-hidden rounded-[20px] border border-black/5 bg-white transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(56,113,193,0.1)]">
                {s.image ? (
                  <div className="relative h-48 overflow-hidden bg-surface-tint">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.image} alt={s.name} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center bg-surface-tint">
                    <Icon className="size-12 text-primary" strokeWidth={1.5} />
                  </div>
                )}
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold tracking-tight">{s.name}</h3>
                    <span className="text-xs font-bold tabular-nums text-subtle">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  {s.description && <p className="mt-1.5 text-sm text-muted">{s.description}</p>}
                  {s.price && <p className="mt-3 text-sm font-semibold text-primary">{s.price}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ===== PRODUCTS ===== */}
      <section className="bg-canvas-muted py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div {...reveal}>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary sm:text-sm">สินค้าแนะนำ</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">อะไหล่และอุปกรณ์ยอดนิยม</h2>
          </motion.div>
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ margin: "0px 0px 300px 0px" }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                <Link href={`/products/${p.slug}`} className="group flex h-full flex-col rounded-[20px] bg-white p-4 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
                  <div className="mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-surface-tint">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.name} className="size-full object-cover" />
                    ) : (
                      <Package className="size-8 text-primary sm:size-10" strokeWidth={1.5} />
                    )}
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle sm:text-xs">{p.category}</p>
                  <p className="mt-1 flex-1 text-sm font-semibold leading-snug">{p.name}</p>
                  <div className="mt-2 flex flex-col">
                    {p.compareAtPrice && <span className="text-xs text-subtle line-through tabular-nums">฿{p.compareAtPrice.toLocaleString()}</span>}
                    <span className="text-base font-bold tabular-nums text-primary sm:text-lg">฿{p.price.toLocaleString()}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/products" className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
              ดูสินค้าทั้งหมด <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== BOOKING CTA ===== */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="flex flex-col items-center justify-between gap-6 rounded-[32px] bg-ink px-6 py-12 sm:px-10 sm:py-14 lg:flex-row lg:gap-12">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">ต้องการให้ช่างประเมินงานใช่ไหม?</h2>
            <p className="mt-3 text-sm text-white/60 sm:text-base">กรอกข้อมูลแล้วช่างของเราจะติดต่อกลับภายใน 24 ชั่วโมง — ฟรี! ไม่มีค่าบริการประเมิน</p>
          </div>
          <Link href="/booking" className="shrink-0 whitespace-nowrap rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:text-base">จองบริการ →</Link>
          <p className="flex items-center gap-1.5 text-xs text-white/50"><Clock className="size-3.5" /> ตอบกลับภายใน 24 ชั่วโมง</p>
        </motion.div>
      </section>
    </>
  );
}
