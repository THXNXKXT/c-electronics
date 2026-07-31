import { db } from "@/db";
import { products, services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { HomeClient } from "./home-client";
import { listPublishedArticles } from "@/lib/article-queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [allServices, featuredProducts, latestArticles] = await Promise.all([
    db.select().from(services).where(eq(services.archived, false)).orderBy(services.createdAt),
    db.select().from(products).where(eq(products.archived, false)).orderBy(products.createdAt).limit(4),
    listPublishedArticles({ limit: 3 }),
  ]);

  return <HomeClient services={allServices} products={featuredProducts} articles={latestArticles} />;
}
