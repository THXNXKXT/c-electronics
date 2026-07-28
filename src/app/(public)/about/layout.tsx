import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา — C.Electronics ร้านอะไหล่อิเล็กทรอนิกส์เชียงราย 10+ ปี",
  description: "C.Electronics ร้านอะไหล่อิเล็กทรอนิกส์และรับติดตั้งในเชียงราย ประสบการณ์กว่า 10 ปี ติดตั้งแอร์ กล้องวงจรปิด ระบบไฟฟ้า จานดาวเทียม",
  alternates: { canonical: "/about" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
