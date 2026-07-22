import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "จองบริการ — ฟรีประเมิน ตอบกลับ 24 ชั่วโมง",
  description: "กรอกฟอร์มจองบริการติดตั้งแอร์ กล้องวงจรปิด ระบบไฟฟ้า จานดาวเทียม หรือซ่อมเครื่องใช้ไฟฟ้า ฟรีประเมินงานในเชียงราย",
  alternates: { canonical: "/booking" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
