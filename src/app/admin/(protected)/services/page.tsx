import { db } from "@/db";
import { services } from "@/db/schema";
import { AdminServicesClient } from "./client";

export default async function AdminServicesPage() {
  const allServices = await db.select().from(services).orderBy(services.createdAt);
  return <AdminServicesClient initialServices={allServices} />;
}
