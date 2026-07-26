import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminServiceEditClient } from "./client";

export default async function AdminServiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [service] = await db.select().from(services).where(eq(services.id, id));
  if (!service) notFound();
  return <AdminServiceEditClient service={service} />;
}
