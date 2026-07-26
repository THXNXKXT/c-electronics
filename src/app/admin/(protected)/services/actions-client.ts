"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createServiceAction(formData: FormData) {
  await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("invalid input");
  const price = (formData.get("price") as string) || null;
  const icon = (formData.get("icon") as string) || "Wrench";
  const description = (formData.get("description") as string) || null;
  const image = (formData.get("image") as string) || null;
  const features = (formData.get("features") as string) || null;
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9ก-๙-]/g, "") + "-" + crypto.randomUUID().slice(0, 6);

  await db.insert(services).values({ name, slug, price, icon, description, image, features });
  revalidatePath("/admin/services");
}

export async function archiveServiceAction(id: string, archived: boolean) {
  await requireAdmin();
  await db.update(services).set({ archived, updatedAt: new Date() }).where(eq(services.id, id));
  revalidatePath("/admin/services");
}

export async function updateServiceAction(id: string, formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const price = (formData.get("price") as string) || null;
  const description = (formData.get("description") as string) || null;
  const image = (formData.get("image") as string) || null;
  const features = (formData.get("features") as string) || null;

  await db.update(services).set({ name, price, description, image, features, updatedAt: new Date() }).where(eq(services.id, id));
  revalidatePath("/admin/services");
}

export async function deleteServiceAction(id: string) {
  await requireAdmin();
  await db.delete(services).where(eq(services.id, id));
  revalidatePath("/admin/services");
}
