"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const price = parseInt(formData.get("price") as string);
  const stock = formData.get("stock") === "on";
  const description = (formData.get("description") as string) || null;
  const image = (formData.get("image") as string) || null;
  const compareAtPrice = formData.get("compareAtPrice") ? parseInt(formData.get("compareAtPrice") as string) : null;
  // ponytail: extract public_id from Cloudinary URL for delete
  const publicId = image ? image.match(/\/upload\/(?:f_auto,q_auto\/)?v\d+\/(.+?)\./)?.[1] || null : null;
  const images = (formData.get("images") as string) || null;
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9ก-๙-]/g, "") + "-" + crypto.randomUUID().slice(0, 6);

  await db.insert(products).values({ name, slug, category, price, compareAtPrice, stock, description, image, publicId, images });
  revalidatePath("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const price = parseInt(formData.get("price") as string);
  if (!name || !category || !Number.isFinite(price)) throw new Error("invalid input");
  const stock = formData.get("stock") === "on";
  const description = (formData.get("description") as string) || null;
  const image = (formData.get("image") as string) || null;
  // ponytail: optional product fields — set only if the edit form sends them
  const compareAtPrice = formData.get("compareAtPrice") ? parseInt(formData.get("compareAtPrice") as string) : null;
  const publicId = (formData.get("publicId") as string) || null;
  const images = (formData.get("images") as string) || null;

  await db
    .update(products)
    .set({ name, category, price, stock, description, image, compareAtPrice, publicId, images, updatedAt: new Date() })
    .where(eq(products.id, id));
  revalidatePath("/admin/products");
}

export async function archiveProduct(id: string, archived: boolean) {
  await requireAdmin();
  await db.update(products).set({ archived, updatedAt: new Date() }).where(eq(products.id, id));
  revalidatePath("/admin/products");
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  const [product] = await db.select({ publicId: products.publicId }).from(products).where(eq(products.id, id));
  // ponytail: best-effort image cleanup — never block row deletion on a Cloudinary failure
  if (product?.publicId) await deleteCloudinaryImage(product.publicId).catch((e) => console.warn("cloudinary delete failed:", e.message));
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
}
