import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://celectronics.com"; // ponytail: update when domain is live

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "C.Electronics — อะไหล่อิเล็กทรอนิกส์และรับติดตั้ง เชียงราย",
    template: "%s — C.Electronics เชียงราย",
  },
  description:
    "ขายอะไหล่อิเล็กทรอนิกส์ รับติดตั้งแอร์ กล้องวงจรปิด ระบบไฟฟ้าบ้าน จานดาวเทียม และรับซ่อมเครื่องใช้ไฟฟ้า ในจังหวัดเชียงรายและใกล้เคียง",
  keywords: [
    "อะไหล่อิเล็กทรอนิกส์เชียงราย",
    "ติดตั้งแอร์เชียงราย",
    "กล้องวงจรปิดเชียงราย",
    "ระบบไฟฟ้าบ้านเชียงราย",
    "จานดาวเทียมเชียงราย",
    "ซ่อมเครื่องใช้ไฟฟ้าเชียงราย",
    "ช่างไฟฟ้าเชียงราย",
    "อิเล็กทรอนิกส์เชียงราย",
  ],
  openGraph: {
    title: "C.Electronics — อะไหล่อิเล็กทรอนิกส์และรับติดตั้ง เชียงราย",
    description:
      "ขายอะไหล่อิเล็กทรอนิกส์ รับติดตั้งแอร์ กล้องวงจรปิด ระบบไฟฟ้า จานดาวเทียม และซ่อมเครื่องใช้ไฟฟ้า ในเชียงราย",
    locale: "th_TH",
    type: "website",
    siteName: "C.Electronics",
    images: [{ url: "/Logo.png", width: 512, height: 512, alt: "C.Electronics Logo" }],
  },
  icons: {
    icon: [{ url: "/Logo.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/Logo.png", sizes: "512x512" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: "/" },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "C.Electronics",
  description:
    "ร้านอะไหล่อิเล็กทรอนิกส์และรับติดตั้ง ติดตั้งแอร์ กล้องวงจรปิด ระบบไฟฟ้าบ้าน จานดาวเทียม และรับซ่อมเครื่องใช้ไฟฟ้า ในเชียงราย",
  address: {
    "@type": "PostalAddress",
    addressLocality: "เชียงราย",
    addressRegion: "เชียงราย",
    addressCountry: "TH",
  },
  areaServed: "จังหวัดเชียงราย",
  openingHours: "Mo-Fr 08:00-18:00",
  priceRange: "฿",
  image: "/Logo.png",
  url: SITE_URL,
  makesOffer: [
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "ติดตั้งแอร์" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "ติดตั้งกล้องวงจรปิด" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "ติดตั้งระบบไฟฟ้าบ้าน" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "ติดตั้งจานดาวเทียม" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "ซ่อมเครื่องใช้ไฟฟ้า" } },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className="antialiased">
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
