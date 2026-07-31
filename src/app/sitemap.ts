import type { MetadataRoute } from "next";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getIndexableArticlesForSitemap } from "@/lib/article-queries";
import { getIndexableServicesForSitemap } from "@/lib/service-queries";
import { buildSitemapEntries } from "@/lib/sitemap-entries";

// ponytail: dynamic sitemap — pulls canonical product, service, and article URLs from DB
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.c-electronics.online";
  const now = new Date();

  const [productRows, serviceRows, articleRows] = await Promise.all([
    db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.archived, false)),
    getIndexableServicesForSitemap(),
    getIndexableArticlesForSitemap(),
  ]);

  return buildSitemapEntries({
    baseUrl: base,
    now,
    products: productRows,
    services: serviceRows,
    articles: articleRows,
  });
}
