import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "บริการติดตั้งและซ่อม — แอร์ กล้องวงจรปิด ไฟฟ้า จานดาวเทียม",
  description: "รับติดตั้งแอร์ กล้องวงจรปิด ระบบไฟฟ้าบ้าน จานดาวเทียม และซ่อมเครื่องใช้ไฟฟ้า โดยช่างผู้เชี่ยวชาญในเชียงราย",
  alternates: { canonical: "/services" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
