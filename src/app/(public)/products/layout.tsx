import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "แคตตาล็อกสินค้า — อะไหล่และอุปกรณ์อิเล็กทรอนิกส์",
  description: "อะไหล่อิเล็กทรอนิกส์ อุปกรณ์ไฟฟ้า กล้องวงจรปิด เครือข่าย และอะไหล่แอร์ ครบครันในเชียงราย",
  alternates: { canonical: "/products" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
