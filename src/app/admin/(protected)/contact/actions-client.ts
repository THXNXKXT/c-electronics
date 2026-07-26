"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
  await requireAdmin();
  const phone = (formData.get("phone") as string) || null;
  const line = (formData.get("line") as string) || null;
  const email = (formData.get("email") as string) || null;
  const address = (formData.get("address") as string) || null;
  const mondayFriday = (formData.get("mondayFriday") as string) || null;
  const saturday = (formData.get("saturday") as string) || null;
  const sunday = (formData.get("sunday") as string) || null;
  const mapsEmbed = (formData.get("mapsEmbed") as string) || null;

  const existing = await db.select().from(settings).limit(1);
  if (existing.length > 0) {
    await db.update(settings).set({
      phone, line, email, address, mondayFriday, saturday, sunday, mapsEmbed,
      updatedAt: new Date(),
    }).where(eq(settings.id, "singleton"));
  } else {
    await db.insert(settings).values({
      id: "singleton", phone, line, email, address, mondayFriday, saturday, sunday, mapsEmbed,
    });
  }
  revalidatePath("/contact");
  revalidatePath("/admin/contact");
}
