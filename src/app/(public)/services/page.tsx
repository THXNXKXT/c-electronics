import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ServicesClient } from "./services-client";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const allServices = await db
    .select()
    .from(services)
    .where(eq(services.archived, false))
    .orderBy(services.createdAt);

  return <ServicesClient services={allServices} />;
}
