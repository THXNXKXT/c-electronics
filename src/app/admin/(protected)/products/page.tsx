import { db } from "@/db";
import { products } from "@/db/schema";
import { AdminProductsClient } from "./client";

export default async function AdminProductsPage() {
  const allProducts = await db.select().from(products).orderBy(products.createdAt);
  return <AdminProductsClient initialProducts={allProducts} />;
}
