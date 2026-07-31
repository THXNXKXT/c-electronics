import type { MetadataRoute } from "next";
import { sanitizeCanonical } from "./articles";

type SitemapRow = {
  slug: string;
  updatedAt: Date;
};

type ServiceSitemapRow = SitemapRow & {
  canonicalUrl?: string | null;
};

export function buildSitemapEntries({
  baseUrl,
  now,
  products,
  services,
  articles,
}: {
  baseUrl: string;
  now: Date;
  products: SitemapRow[];
  services: ServiceSitemapRow[];
  articles: SitemapRow[];
}): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: articles[0]?.updatedAt ?? now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/booking`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.8,
    },
    ...products.map((product) => ({
      url: `${baseUrl}/products/${encodeURIComponent(product.slug)}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...services.map((service) => ({
      url:
        sanitizeCanonical(service.canonicalUrl, baseUrl) ??
        `${baseUrl}/services/${encodeURIComponent(service.slug)}`,
      lastModified: service.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...articles.map((article) => ({
      url: `${baseUrl}/articles/${encodeURIComponent(article.slug)}`,
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
