"use server";

import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createServiceAction(formData: FormData) {
  const name = formData.get("name") as string;
  const price = (formData.get("price") as string) || null;
  const icon = (formData.get("icon") as string) || "Wrench";
  const description = (formData.get("description") as string) || null;
  const image = (formData.get("image") as string) || null;
  const features = (formData.get("features") as string) || null;
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9ก-๙-]/g, "") + "-" + crypto.randomUUID().slice(0, 6);

  await db.insert(services).values({ name, slug, price, icon, description, image, features });
  revalidatePath("/admin/services");
}

export async function deleteServiceAction(id: string) {
  await db.delete(services).where(eq(services.id, id));
  revalidatePath("/admin/services");
}
