import type { Metadata } from "next";
import { Bai_Jamjuree } from "next/font/google";
import { db } from "@/db";
import { settings } from "@/db/schema";
import "./globals.css";

const SITE_URL = "https://www.c-electronics.online";

const baiJamjuree = Bai_Jamjuree({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-bai-jamjuree",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "C.Electronics (ช.อิเล็กทรอนิกส์) — อะไหล่อิเล็กทรอนิกส์และรับติดตั้ง เชียงราย",
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
  other: {
    "geo.region": "TH-57",
    "geo.placename": "เชียงราย",
    "geo.position": "19.9105;99.8406",
    ICBM: "19.9105, 99.8406",
  },
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
  telephone: "+66-82-047-4073", // ponytail: update when real number available
  makesOffer: [
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "ติดตั้งแอร์" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "ติดตั้งกล้องวงจรปิด" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "ติดตั้งระบบไฟฟ้าบ้าน" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "ติดตั้งจานดาวเทียม" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "ซ่อมเครื่องใช้ไฟฟ้า" } },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [s] = await db.select().from(settings).limit(1);
  const schema = {
    ...localBusinessSchema,
    telephone: s?.phone || undefined,
    email: s?.email || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: s?.address || undefined,
      addressLocality: "เชียงราย",
      addressRegion: "เชียงราย",
      addressCountry: "TH",
    },
    openingHours: [
      s?.mondayFriday && `Mo-Fr ${s.mondayFriday.replace(" - ", "-")}`,
      s?.saturday && `Sa ${s.saturday.replace(" - ", "-")}`,
      s?.sunday && `Su ${s.sunday.replace(" - ", "-")}`,
    ].filter(Boolean),
  };
  return (
    <html lang="th" className={`${baiJamjuree.variable} antialiased`}>
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        {children}
      </body>
    </html>
  );
}
