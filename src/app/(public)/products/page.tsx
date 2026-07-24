import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProductsClient } from "./products-client";

export default async function ProductsPage() {
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.archived, false))
    .orderBy(products.createdAt);

  return <ProductsClient products={allProducts} />;
}
