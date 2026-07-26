import { db } from "@/db";
import { settings } from "@/db/schema";
import { AdminContactClient } from "./client";

export default async function AdminContactPage() {
  const [setting] = await db.select().from(settings).limit(1);
  return <AdminContactClient initial={setting ?? null} />;
}
