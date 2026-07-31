import type { MetadataRoute } from "next";
import { sanitizeCanonical } from "./articles";

type SitemapRow = {
  slug: string;
  updatedAt: Date;
};

type ServiceSitemapRow = SitemapRow & {
  canonicalUrl?: string | null;
};

function normalizePathPercentEncoding(pathname: string): string {
  return pathname.replace(/%([0-9a-fA-F]{2})/g, (_, hex: string) => {
    const byte = Number.parseInt(hex, 16);
    const character = String.fromCharCode(byte);
    return /^[A-Za-z0-9._~-]$/.test(character)
      ? character
      : `%${hex.toUpperCase()}`;
  });
}

export function normalizeSitemapUrlIdentity(
  input: string,
  baseUrl: string,
): string {
  try {
    const base = new URL(baseUrl);
    const candidate = new URL(input, base);
    if (
      !["http:", "https:"].includes(candidate.protocol) ||
      candidate.origin !== base.origin
    ) {
      return input;
    }

    candidate.pathname = normalizePathPercentEncoding(candidate.pathname);
    const normalized = candidate.toString();
    return candidate.pathname === "/" && !candidate.search && !candidate.hash
      ? normalized.slice(0, -1)
      : normalized;
  } catch {
    return input;
  }
}

function lastModifiedTimestamp(
  value: MetadataRoute.Sitemap[number]["lastModified"],
): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

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

  const deduplicated: MetadataRoute.Sitemap = [];
  const indexes = new Map<string, number>();

  for (const entry of entries) {
    const identity = normalizeSitemapUrlIdentity(entry.url, baseUrl);
    const existingIndex = indexes.get(identity);
    if (existingIndex === undefined) {
      indexes.set(identity, deduplicated.length);
      deduplicated.push({ ...entry, url: identity });
      continue;
    }

    const existing = deduplicated[existingIndex];
    if (
      lastModifiedTimestamp(entry.lastModified) >
      lastModifiedTimestamp(existing.lastModified)
    ) {
      existing.lastModified = entry.lastModified;
    }
  }

  return deduplicated;
}
