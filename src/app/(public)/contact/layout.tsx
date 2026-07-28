import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ติดต่อเรา — โทร แชท LINE แผนที่ร้าน เชียงราย",
  description: "ติดต่อ C.Electronics เชียงราย โทร แชท LINE หรือดูแผนที่ร้าน เวลาทำการ และที่ตั้งร้านอะไหล่อิเล็กทรอนิกส์",
  alternates: { canonical: "/contact" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
