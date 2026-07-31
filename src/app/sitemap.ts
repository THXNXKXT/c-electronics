import type { MetadataRoute } from "next";
import { db } from "@/db";
import { products, services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getIndexableArticlesForSitemap } from "@/lib/article-queries";

// ponytail: dynamic sitemap — pulls live product + service slugs from DB
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.c-electronics.online";
  const now = new Date();

  const [prods, svcs, articleRows] = await Promise.all([
    db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.archived, false)),
    db.select({ slug: services.slug, updatedAt: services.updatedAt }).from(services).where(eq(services.archived, false)),
    getIndexableArticlesForSitemap(),
  ]);

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/products`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/articles`, lastModified: articleRows[0]?.updatedAt ?? now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/booking`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
    ...prods.map((p) => ({
      url: `${base}/products/${encodeURIComponent(p.slug)}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...svcs.map((s) => ({
      url: `${base}/services#${encodeURIComponent(s.slug)}`,
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...articleRows.map((article) => ({
      url: `${base}/articles/${encodeURIComponent(article.slug)}`,
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
