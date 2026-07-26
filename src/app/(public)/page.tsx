import { db } from "@/db";
import { products, services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { HomeClient } from "./home-client";

export default async function Home() {
  const allServices = await db.select().from(services).where(eq(services.archived, false)).orderBy(services.createdAt);
  const featuredProducts = await db.select().from(products).where(eq(products.archived, false)).orderBy(products.createdAt).limit(4);

  return <HomeClient services={allServices} products={featuredProducts} />;
}
