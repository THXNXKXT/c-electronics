"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Send, Loader2, User, Phone, Calendar, Home, Wrench, ShieldCheck, Clock4, PhoneCall } from "lucide-react";
import { createBooking } from "@/app/admin/actions";

const districts = ["เมืองเชียงราย","เวียงชัย","เชียงของ","เทิง","พาน","ป่าแดด","แม่จัน","เชียงแสน","แม่ฟ้าหลวง","แม่สรวย","เวียงป่าเป้า","ดอยหลวง","แม่อาย","ไชยปราการ","ขุนตาล","พญาเม็งราย","เวียงแก่น","อื่นๆ"];

const trustBadges = [{icon:ShieldCheck,label:"ฟรีประเมิน"},{icon:Clock4,label:"ตอบกลับ 24 ชม."},{icon:Wrench,label:"ช่างมืออาชีพ"}];

function genRef() { return "CE-" + Math.random().toString(36).slice(2, 8).toUpperCase(); }

export function BookingClient({ serviceTypes, phone }: { serviceTypes: string[]; phone: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refNo, setRefNo] = useState("");
  const [valid, setValid] = useState({ name: false, phone: false, serviceType: false, district: false });
  const checkPhone = (v: string) => /^0\d{8,9}$/.test(v.replace(/[-\s]/g, ""));

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
          <CheckCircle2 className="size-16 text-positive" strokeWidth={1.5} />
        </motion.div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">ส่งคำขอเรียบร้อยแล้ว</h1>
        <p className="mt-3 text-muted">ช่างของเราจะติดต่อกลับภายใน 24 ชั่วโมง — ขอบคุณที่ใช้บริการ C.Electronics</p>
        <div className="mt-6 rounded-2xl border border-black/5 bg-canvas-muted px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">หมายเลขคำขอ</p>
          <p className="mt-1 text-xl font-extrabold tabular-nums text-primary">{refNo}</p>
        </div>
        <p className="mt-4 text-sm text-muted">หากเร่งด่วน โทรแจ้งหมายเลขนี้ได้โดยตรง</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href={`tel:${phone}`} className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"><PhoneCall className="size-4" /> โทรเลย</a>
          <button onClick={() => setSubmitted(false)} className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink">ส่งคำขอใหม่</button>
        </div>
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
        <div className="mb-6 flex flex-wrap justify-center gap-3">
          {trustBadges.map((b) => { const Icon = b.icon; return (
            <div key={b.label} className="flex items-center gap-2 rounded-full border border-primary/15 bg-primary-tint px-4 py-2"><Icon className="size-4 text-primary" strokeWidth={2} /><span className="text-xs font-bold text-primary sm:text-sm">{b.label}</span></div>
          );})}
        </div>
        <div className="mb-6 flex items-center justify-center gap-2 text-sm font-semibold text-muted">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-white">1</span><span>ขั้นตอนที่ 1/1 — กรอกข้อมูล</span>
        </div>
        <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          onSubmit={async (e) => { e.preventDefault(); setSubmitting(true); const fd = new FormData(e.currentTarget); await createBooking(fd); setRefNo(genRef()); setSubmitting(false); setSubmitted(true); }}
          className="space-y-8">
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-subtle"><Wrench className="size-4 text-primary" /> รายละเอียดงาน</h2>
            <div className="space-y-5 border-l-2 border-primary/20 pl-5">
              <div><label className="mb-1.5 block text-sm font-semibold">ประเภทบริการ</label>
                <select name="serviceType" required onChange={(e) => setValid((v) => ({ ...v, serviceType: !!e.target.value }))} className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary">
                  <option value="">เลือกประเภทบริการ...</option>
                  {serviceTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div><label className="mb-1.5 block text-sm font-semibold">รายละเอียดปัญหา</label>
                <textarea name="description" rows={4} placeholder="อธิบายอาการหรือสิ่งที่ต้องการ..." className="w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary" />
              </div>
            </div>
          </div>
          <div className="border-t border-dashed border-black/10" />
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-subtle"><User className="size-4 text-primary" /> ข้อมูลส่วนตัว</h2>
            <div className="space-y-5 border-l-2 border-primary/20 pl-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-sm font-semibold">ชื่อ-นามสกุล</label>
                  <div className="relative"><User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
                    <input name="name" type="text" required placeholder="ชื่อของคุณ" onChange={(e) => setValid((v) => ({ ...v, name: e.target.value.trim().length >= 2 }))} className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-9 text-sm outline-none transition-colors focus:border-primary" />
                    {valid.name && <CheckCircle2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-positive" />}
                  </div>
                </div>
                <div><label className="mb-1.5 block text-sm font-semibold">เบอร์โทรศัพท์</label>
                  <div className="relative"><Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
                    <input name="phone" type="tel" required placeholder="08X-XXX-XXXX" onChange={(e) => setValid((v) => ({ ...v, phone: checkPhone(e.target.value) }))} className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-9 text-sm outline-none transition-colors focus:border-primary" />
                    {valid.phone && <CheckCircle2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-positive" />}
                  </div>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-sm font-semibold">อำเภอ/เขต</label>
                  <select name="district" required onChange={(e) => setValid((v) => ({ ...v, district: !!e.target.value }))} className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary">
                    <option value="">เลือกอำเภอ...</option>
                    {districts.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                </div>
                <div><label className="mb-1.5 block text-sm font-semibold">วันที่สะดวก</label>
                  <div className="relative"><Calendar className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
                    <input name="date" type="date" className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary" />
                  </div>
                </div>
              </div>
              <div><label className="mb-1.5 block text-sm font-semibold">ที่อยู่โดยประมาณ</label>
                <div className="relative"><Home className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
                  <input name="address" type="text" placeholder="บ้านเลขที่, หมู่บ้าน, ถนน..." className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary" />
                </div>
              </div>
            </div>
          </div>
          <button type="submit" className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70">
            {submitting ? (<><Loader2 className="size-4 animate-spin" /> กำลังส่ง...</>) : (<><Send className="size-4" /> ส่งคำขอจองบริการ</>)}
          </button>
        </motion.form>
      </section>
    </>
  );
}
