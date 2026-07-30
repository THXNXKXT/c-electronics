import { db } from "@/db";
import { services, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BookingClient } from "./booking-client";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const allServices = await db.select().from(services).where(eq(services.archived, false)).orderBy(services.createdAt);
  const [s] = await db.select().from(settings).limit(1);

  const serviceTypes = allServices.map((s) => s.name);
  const phone = s?.phone || "0XX-XXX-XXXX";

  return <BookingClient serviceTypes={serviceTypes} phone={phone} />;
}
