"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Send } from "lucide-react";

const serviceTypes = [
  "ติดตั้งแอร์",
  "กล้องวงจรปิด",
  "ระบบไฟฟ้าบ้าน",
  "จานดาวเทียม",
  "ซ่อมเครื่องใช้ไฟฟ้า",
  "สอบถามอะไหล่",
];

const districts = [
  "เมืองเชียงราย", "เวียงชัย", "เชียงของ", "เทิง", "พาน", "ป่าแดด",
  "แม่จัน", "เชียงแสน", "แม่ฟ้าหลวง", "แม่สรวย", "เวียงป่าเป้า", "ดอยหลวง",
  "แม่อาย", "ไชยปราการ", "ขุนตาล", "พญาเม็งราย", "เวียงแก่น", "อื่นๆ",
];

export default function BookingPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <CheckCircle2 className="size-16 text-positive" strokeWidth={1.5} />
        <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">ส่งคำขอเรียบร้อยแล้ว</h1>
        <p className="mt-3 text-muted">
          ช่างของเราจะติดต่อกลับภายใน 24 ชั่วโมง — ขอบคุณที่ใช้บริการ C.Electronics
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-8 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink"
        >
          ส่งคำขอใหม่
        </button>
      </div>
    );
  }

  return (
    <>
      <section className="border-b border-black/5 bg-canvas-muted">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">จองบริการ</h1>
          <p className="mt-2 text-muted">กรอกข้อมูลแล้วช่างจะติดต่อกลับภายใน 24 ชั่วโมง — ฟรี! ไม่มีค่าประเมิน</p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="space-y-5"
        >
          {/* Service type */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold">ประเภทบริการ</label>
            <select
              required
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            >
              <option value="">เลือกประเภทบริการ...</option>
              {serviceTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Name + Phone */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">ชื่อ-นามสกุล</label>
              <input
                type="text"
                required
                placeholder="ชื่อของคุณ"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                required
                placeholder="08X-XXX-XXXX"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          {/* District + Date */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">อำเภอ/เขต</label>
              <select
                required
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">เลือกอำเภอ...</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">วันที่สะดวก</label>
              <input
                type="date"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold">ที่อยู่โดยประมาณ</label>
            <input
              type="text"
              placeholder="บ้านเลขที่, หมู่บ้าน, ถนน..."
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold">รายละเอียดปัญหา</label>
            <textarea
              rows={4}
              placeholder="อธิบายอาการหรือสิ่งที่ต้องการ..."
              className="w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Send className="size-4" /> ส่งคำขอจองบริการ
          </button>
        </motion.form>
      </section>
    </>
  );
}
