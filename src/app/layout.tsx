import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "C.Electronics — อะไหล่อิเล็กทรอนิกส์และรับติดตั้ง เชียงราย",
  description:
    "ขายอะไหล่อิเล็กทรอนิกส์ รับติดตั้งแอร์ กล้องวงจรปิด ระบบไฟฟ้าบ้าน จานดาวเทียม และรับซ่อมเครื่องใช้ไฟฟ้า ในจังหวัดเชียงรายและใกล้เคียง",
  keywords: [
    "อะไหล่อิเล็กทรอนิกส์เชียงราย",
    "ติดตั้งแอร์เชียงราย",
    "กล้องวงจรปิดเชียงราย",
    "ระบบไฟฟ้าบ้านเชียงราย",
    "จานดาวเทียมเชียงราย",
    "ซ่อมเครื่องใช้ไฟฟ้าเชียงราย",
  ],
  openGraph: {
    title: "C.Electronics — อะไหล่อิเล็กทรอนิกส์และรับติดตั้ง เชียงราย",
    description:
      "ขายอะไหล่อิเล็กทรอนิกส์ รับติดตั้งแอร์ กล้องวงจรปิด ระบบไฟฟ้า จานดาวเทียม และซ่อมเครื่องใช้ไฟฟ้า ในเชียงราย",
    locale: "th_TH",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${inter.variable} antialiased`}>
      <body className="flex min-h-screen flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
