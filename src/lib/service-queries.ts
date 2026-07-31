import { db } from "@/db";
import {
  articles,
  services,
  serviceSlugRedirects,
} from "@/db/schema";
import type { PublishedArticleListItem } from "./article-queries";
import {
  and,
  desc,
  eq,
  ilike,
  isNotNull,
  or,
} from "drizzle-orm";

function publicServiceConditions() {
  return [
    eq(services.status, "published"),
    eq(services.archived, false),
    isNotNull(services.publishedAt),
  ];
}

export function buildPublicServiceCardsQuery() {
  return db
    .select()
    .from(services)
    .where(eq(services.archived, false))
    .orderBy(desc(services.featured), services.name);
}

export async function listPublicServiceCards(): Promise<
  Array<typeof services.$inferSelect>
> {
  return buildPublicServiceCardsQuery();
}

export async function listAdminServices(options?: {
  query?: string;
  status?: "all" | "draft" | "published" | "archived";
}): Promise<Array<typeof services.$inferSelect>> {
  const conditions = [];
  const query = options?.query?.trim();
  const status = options?.status ?? "all";

  if (query) {
    conditions.push(
      or(
        ilike(services.name, `%${query}%`),
        ilike(services.slug, `%${query}%`),
      )!,
    );
  }

  if (status === "archived") {
    conditions.push(eq(services.archived, true));
  } else {
    conditions.push(eq(services.archived, false));
    if (status === "draft" || status === "published") {
      conditions.push(eq(services.status, status));
    }
  }

  return db
    .select()
    .from(services)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(services.updatedAt));
}

export async function getAdminService(
  id: string,
): Promise<typeof services.$inferSelect | null> {
  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, id))
    .limit(1);
  return service ?? null;
}

export async function resolvePublishedServiceRoute(slug: string): Promise<
  | { kind: "service"; service: typeof services.$inferSelect }
  | { kind: "redirect"; service: typeof services.$inferSelect }
  | null
> {
  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.slug, slug), ...publicServiceConditions()))
    .limit(1);

  if (service) return { kind: "service", service };

  const [redirect] = await db
    .select({ service: services })
    .from(serviceSlugRedirects)
    .innerJoin(services, eq(serviceSlugRedirects.serviceId, services.id))
    .where(
      and(
        eq(serviceSlugRedirects.slug, slug),
        ...publicServiceConditions(),
      ),
    )
    .limit(1);

  return redirect
    ? { kind: "redirect", service: redirect.service }
    : null;
}

export async function listPublishedArticlesForService(
  serviceId: string,
  limit?: number,
): Promise<PublishedArticleListItem[]> {
  const query = db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      category: articles.category,
      tags: articles.tags,
      coverImage: articles.coverImage,
      coverImageAlt: articles.coverImageAlt,
      featured: articles.featured,
      publishedAt: articles.publishedAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(
      and(
        eq(articles.relatedServiceId, serviceId),
        eq(articles.status, "published"),
        eq(articles.archived, false),
        isNotNull(articles.publishedAt),
      ),
    )
    .orderBy(desc(articles.featured), desc(articles.publishedAt));

  return limit ? query.limit(limit) : query;
}

export async function listArticleSlugsForService(
  serviceId: string,
): Promise<string[]> {
  const rows = await db
    .select({ slug: articles.slug })
    .from(articles)
    .where(eq(articles.relatedServiceId, serviceId));
  return rows.map((row) => row.slug);
}

export async function getIndexableServicesForSitemap(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  return db
    .select({
      slug: services.slug,
      updatedAt: services.updatedAt,
    })
    .from(services)
    .where(
      and(
        ...publicServiceConditions(),
        eq(services.noIndex, false),
      ),
    )
    .orderBy(desc(services.updatedAt));
}
