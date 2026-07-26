"use server";

import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function updateBookingStatus(id: string, formData: FormData) {
  await requireAdmin();
  const allowed = ["pending", "contacted", "scheduled", "done"];
  const status = formData.get("status") as string;
  if (!allowed.includes(status)) throw new Error("invalid status");
  await db.update(bookings).set({ status }).where(eq(bookings.id, id));
  revalidatePath("/admin/bookings");
}

export async function createBooking(formData: FormData) {
  // ponytail: generate ref server-side — client can't fake it
  const ref = "CE-" + crypto.randomUUID().slice(0, 8).toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const serviceType = (formData.get("serviceType") as string)?.trim();
  if (!name || !phone || !serviceType) throw new Error("missing required fields");
  await db.insert(bookings).values({
    ref,
    serviceType,
    customerName: name,
    phone,
    district: (formData.get("district") as string) || null,
    address: (formData.get("address") as string) || null,
    preferredDate: (formData.get("date") as string) || null,
    description: (formData.get("description") as string) || null,
  });
  return ref;
}
