import { Wrench, ShieldCheck, MapPin, Users } from "lucide-react";

const stats = [
  { icon: Users, label: "ประสบการณ์", value: "10+ ปี" },
  { icon: ShieldCheck, label: "การรับประกัน", value: "งานคุณภาพ" },
  { icon: MapPin, label: "พื้นที่ให้บริการ", value: "เชียงรายและใกล้เคียง" },
  { icon: Wrench, label: "บริการ", value: "ครบทุกด้าน" },
];

const values = [
  { title: "ช่างผู้เชี่ยวชาญ", desc: "ทีมงานมีประสบการณ์ติดตั้งและซ่อมแซมระบบไฟฟ้าและอิเล็กทรอนิกส์มาอย่างยาวนาน" },
  { title: "ราคายุติธรรม", desc: "ใบเสนอราคาโปร่งใส ไม่มีค่าซ่อนเร้น ประเมินงานฟรี" },
  { title: "บริการรวดเร็ว", desc: "ตอบกลับภายใน 24 ชั่วโมง พร้อมให้บริการทั่วจังหวัดเชียงราย" },
  { title: "อะไหล่คุณภาพ", desc: "จำหน่ายอะไหล่และอุปกรณ์อิเล็กทรอนิกส์จากแบรนด์ชั้นนำ" },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-black/5 bg-canvas-muted">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">เกี่ยวกับเรา</h1>
          <p className="mt-2 max-w-2xl text-muted">
            C.Electronics — ร้านอะไหล่อิเล็กทรอนิกส์และรับติดตั้ง ใจกลางจังหวัดเชียงราย
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-[20px] border border-black/5 bg-white p-5 text-center sm:p-6">
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary-tint">
                  <Icon className="size-6 text-primary" strokeWidth={1.5} />
                </div>
                <p className="mt-3 text-lg font-bold tracking-tight">{s.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight">เรื่องของเรา</h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-muted">
          <p>
            C.Electronics เริ่มต้นจากร้านขายอะไหล่อิเล็กทรอนิกส์ขนาดเล็กในจังหวัดเชียงราย
            ด้วยความตั้งใจที่จะให้บริการที่ดีและซื่อสัตย์ต่อลูกค้าในท้องถิ่น
          </p>
          <p>
            ตลอดกว่า 10 ปีที่ผ่านมา เราได้ขยายบริการครอบคลุมการติดตั้งแอร์
            กล้องวงจรปิด ระบบไฟฟ้าบ้าน จานดาวเทียม และรับซ่อมเครื่องใช้ไฟฟ้า
            ครบทุกด้านในที่เดียว เพื่ออำนวยความสะดวกให้ลูกค้า
          </p>
          <p>
            ปัจจุบันเราให้บริการทั่วจังหวัดเชียงรายและพื้นที่ใกล้เคียง
            ด้วยทีมช่างผู้เชี่ยวชาญและอะไหล่คุณภาพ
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-canvas-muted py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight">ทำไมต้องเลือกเรา</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="rounded-[20px] border border-black/5 bg-white p-6">
                <h3 className="text-lg font-bold tracking-tight">{v.title}</h3>
                <p className="mt-2 text-sm text-muted">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
