import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { db } from "@/db";
import { settings } from "@/db/schema";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [s] = await db.select().from(settings).limit(1);
  const phone = s?.phone || "0XX-XXX-XXXX";
  const line = s?.line || "@celectronics";

  return (
    <>
      <Nav phone={phone} />
      <main className="flex-1">{children}</main>
      <Footer phone={phone} line={line} address={s?.address || "เชียงราย"} hours={s?.mondayFriday || "จ-สา 8:00-18:00"} />
    </>
  );
}
