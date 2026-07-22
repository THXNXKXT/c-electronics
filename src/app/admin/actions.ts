"use server";

import { db } from "@/db";
import { products, services, bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9ก-๙-]/g, "");

// ===== Products =====
export async function createProduct(formData: FormData) {
  await db.insert(products).values({
    name: formData.get("name") as string,
    slug: slugify(formData.get("name") as string),
    category: formData.get("category") as string,
    price: parseInt(formData.get("price") as string),
    stock: formData.get("stock") === "on",
    description: (formData.get("description") as string) || null,
  });
  revalidatePath("/admin/products");
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
}

// ===== Services =====
export async function createService(formData: FormData) {
  await db.insert(services).values({
    name: formData.get("name") as string,
    slug: slugify(formData.get("name") as string),
    description: (formData.get("description") as string) || null,
    price: (formData.get("price") as string) || null,
    icon: (formData.get("icon") as string) || "Wrench",
    image: (formData.get("image") as string) || null,
    features: (formData.get("features") as string) || null,
  });
  revalidatePath("/admin/services");
}

export async function deleteService(id: string) {
  await db.delete(services).where(eq(services.id, id));
  revalidatePath("/admin/services");
}

// ===== Bookings =====
export async function updateBookingStatus(id: string, formData: FormData) {
  const status = formData.get("status") as string;
  await db.update(bookings).set({ status }).where(eq(bookings.id, id));
  revalidatePath("/admin/bookings");
}

export async function createBooking(formData: FormData) {
  await db.insert(bookings).values({
    serviceType: formData.get("serviceType") as string,
    customerName: formData.get("name") as string,
    phone: formData.get("phone") as string,
    district: (formData.get("district") as string) || null,
    address: (formData.get("address") as string) || null,
    preferredDate: (formData.get("date") as string) || null,
    description: (formData.get("description") as string) || null,
  });
}
