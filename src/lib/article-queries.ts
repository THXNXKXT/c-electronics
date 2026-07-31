import { db } from "@/db";
import {
  articleProducts,
  articles,
  products,
  services,
} from "@/db/schema";
import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  ne,
  or,
  sql,
} from "drizzle-orm";

export type PublishedArticleListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage: string | null;
  coverImageAlt: string | null;
  featured: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
};

export async function listPublishedArticles(options?: {
  category?: string;
  limit?: number;
  excludeSlug?: string;
}): Promise<PublishedArticleListItem[]> {
  const conditions = [
    eq(articles.status, "published"),
    eq(articles.archived, false),
    isNotNull(articles.publishedAt),
  ];

  if (options?.category) {
    conditions.push(eq(articles.category, options.category));
  }
  if (options?.excludeSlug) {
    conditions.push(ne(articles.slug, options.excludeSlug));
  }

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
    .where(and(...conditions))
    .orderBy(desc(articles.featured), desc(articles.publishedAt));

  return options?.limit ? query.limit(options.limit) : query;
}

export async function listArticleCategories(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: articles.category })
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        eq(articles.archived, false),
        isNotNull(articles.publishedAt),
      ),
    )
    .orderBy(articles.category);

  return rows.map((row) => row.category);
}

export async function getPublishedArticleBySlug(slug: string) {
  const [article] = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.slug, slug),
        eq(articles.status, "published"),
        eq(articles.archived, false),
        isNotNull(articles.publishedAt),
      ),
    )
    .limit(1);

  return article;
}

export async function getArticleRelations(articleId: string) {
  const [serviceRows, productRows] = await Promise.all([
    db
      .select({
        id: services.id,
        name: services.name,
        slug: services.slug,
        description: services.description,
        price: services.price,
        image: services.image,
        status: services.status,
        publishedAt: services.publishedAt,
        archived: services.archived,
      })
      .from(articles)
      .innerJoin(services, eq(articles.relatedServiceId, services.id))
      .where(
        and(eq(articles.id, articleId), eq(services.archived, false)),
      )
      .limit(1),
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        image: products.image,
        category: products.category,
      })
      .from(articleProducts)
      .innerJoin(products, eq(articleProducts.productId, products.id))
      .where(
        and(
          eq(articleProducts.articleId, articleId),
          eq(products.archived, false),
        ),
      )
      .orderBy(products.name),
  ]);

  return {
    service: serviceRows[0] ?? null,
    products: productRows,
  };
}

export async function listAdminArticles(options?: {
  query?: string;
  status?: "all" | "draft" | "published" | "archived";
}) {
  const conditions = [];
  const query = options?.query?.trim();
  const status = options?.status ?? "all";

  if (query) {
    conditions.push(
      or(
        ilike(articles.title, `%${query}%`),
        ilike(articles.slug, `%${query}%`),
        ilike(articles.category, `%${query}%`),
      )!,
    );
  }

  if (status === "archived") {
    conditions.push(eq(articles.archived, true));
  } else {
    conditions.push(eq(articles.archived, false));
    if (status === "draft" || status === "published") {
      conditions.push(eq(articles.status, status));
    }
  }

  return db
    .select()
    .from(articles)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(articles.updatedAt));
}

export async function getAdminArticle(id: string) {
  const [article, productRows] = await Promise.all([
    db.select().from(articles).where(eq(articles.id, id)).limit(1),
    db
      .select({ productId: articleProducts.productId })
      .from(articleProducts)
      .where(eq(articleProducts.articleId, id)),
  ]);

  if (!article[0]) return null;
  return {
    ...article[0],
    productIds: productRows.map((row) => row.productId),
  };
}

export async function listArticleEditorOptions() {
  const [serviceRows, productRows] = await Promise.all([
    db
      .select({ id: services.id, name: services.name })
      .from(services)
      .where(eq(services.archived, false))
      .orderBy(services.name),
    db
      .select({
        id: products.id,
        name: products.name,
        category: products.category,
      })
      .from(products)
      .where(eq(products.archived, false))
      .orderBy(products.name),
  ]);

  return { services: serviceRows, products: productRows };
}

export async function getIndexableArticlesForSitemap() {
  return db
    .select({
      slug: articles.slug,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        eq(articles.archived, false),
        eq(articles.noIndex, false),
        isNotNull(articles.publishedAt),
      ),
    )
    .orderBy(desc(articles.updatedAt));
}

export async function countArticlesByStatus() {
  const rows = await db
    .select({
      status: articles.status,
      archived: articles.archived,
      count: sql<number>`count(*)::int`,
    })
    .from(articles)
    .groupBy(articles.status, articles.archived);

  return rows;
}

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db.select().from(products).where(inArray(products.id, ids));
}
