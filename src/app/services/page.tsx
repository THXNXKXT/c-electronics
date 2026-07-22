"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Snowflake, Camera, Zap, Satellite, Wrench, Plug, type LucideIcon } from "lucide-react";

type Service = {
  slug: string;
  title: string;
  desc: string;
  price: string;
  image: string | null;
  icon: LucideIcon;
  features: string[];
};

const services: Service[] = [
  { slug: "aircon", title: "ติดตั้งแอร์", desc: "ติดตั้ง ย้าย และล้างแอร์ทุกยี่ห้อ ทั้งบ้านและออฟฟิศ", price: "เริ่มต้น 1,500 ฿", image: "/services/aircon.jpg", icon: Snowflake, features: ["ติดตั้งแอร์ใหม่", "ย้ายตำแหน่งแอร์", "ล้างแอร์บำรุงรักษา", "ซ่อมแอร์ไม่เย็น"] },
  { slug: "cctv", title: "กล้องวงจรปิด", desc: "ออกแบบและติดตั้งระบบ CCTV คุณภาพ HD/4K ครบระบบ", price: "เริ่มต้น 3,500 ฿", image: "/services/cctv.jpg", icon: Camera, features: ["ติดตั้งกล้องใหม่", "ตั้งค่า DVR/NVR", "เชื่อมมือถือดูสด", "ซ่อมระบบเดิม"] },
  { slug: "electrical", title: "ระบบไฟฟ้าบ้าน", desc: "ติดตั้ง เดินไฟ และซ่อมระบบไฟฟ้าภายในบ้านและอาคาร", price: "ตามงานประเมิน", image: "/services/electrical.jpg", icon: Zap, features: ["เดินสายไฟใหม่", "ติดตั้งตู้ไฟ", "ตรวจสอบระบบไฟ", "ติดตั้งเต้ารับ"] },
  { slug: "satellite", title: "จานดาวเทียม", desc: "ติดตั้งและปรับจานดาวเทียม รับสัญญาณคมชัด", price: "เริ่มต้น 1,200 ฿", image: "/services/satellite.jpg", icon: Satellite, features: ["ติดตั้งจานใหม่", "ปรับทิศทางจาน", "ตั้งค่ารีซีฟเวอร์", "เพิ่มช่องรายการ"] },
  { slug: "repair", title: "ซ่อมเครื่องใช้ไฟฟ้า", desc: "ซ่อมทีวี พัดลม เตารีด หม้อหุงข้าว และเครื่องใช้ไฟฟ้าทั่วไป", price: "ตามอาการ", image: "/services/repair.jpg", icon: Wrench, features: ["ซ่อมทีวี LED/LCD", "ซ่อมพัดลม", "ซ่อมเตารีด", "ซ่อมเครื่องใช้ไฟฟ้าอื่นๆ"] },
  { slug: "parts", title: "อะไหล่อิเล็กทรอนิกส์", desc: "จำหน่ายอะไหล่และอุปกรณ์อิเล็กทรอนิกส์หลากหลายประเภท", price: "ดูแคตตาล็อก", image: null, icon: Plug, features: ["อะไหล่แอร์", "อุปกรณ์ไฟฟ้า", "บอร์ดอิเล็กทรอนิกส์", "อุปกรณ์เครือข่าย"] },
];

export default function ServicesPage() {
  return (
    <>
      <section className="border-b border-black/5 bg-canvas-muted">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">บริการของเรา</h1>
          <p className="mt-2 text-muted">ติดตั้งและซ่อมครบทุกอย่างในที่เดียว — โดยช่างผู้เชี่ยวชาญในเชียงราย</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "0px 0px 300px 0px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="overflow-hidden rounded-[20px] border border-black/5 bg-white sm:flex"
              >
                {s.image ? (
                  <div className="relative h-56 shrink-0 overflow-hidden bg-surface-tint sm:h-auto sm:w-72">
                    <Image src={s.image} alt={s.title} fill sizes="(max-width: 640px) 100vw, 288px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-56 shrink-0 items-center justify-center bg-surface-tint sm:h-auto sm:w-72">
                    <Icon className="size-16 text-primary" strokeWidth={1.5} />
                  </div>
                )}
                <div className="flex-1 p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{s.title}</h2>
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-primary-tint px-3 py-1 text-xs font-semibold text-primary">{s.price}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted sm:text-base">{s.desc}</p>
                  <ul className="mt-4 grid grid-cols-2 gap-2">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted">
                        <span className="size-1.5 shrink-0 rounded-full bg-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/booking"
                    className="mt-5 inline-block whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                  >
                    จองบริการ →
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </>
  );
}
