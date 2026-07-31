"use server";

import { db } from "@/db";
import { articleProducts, articles, products } from "@/db/schema";
import {
  getArticleRevalidationPaths,
  canChangeArticleSlug,
  canDeleteArticlePermanently,
  isValidArticleDocument,
  sanitizeArticleUrl,
  sanitizeCanonical,
  slugifyArticleTitle,
  textFromArticleNode,
  type ArticleDocument,
} from "@/lib/articles";
import { requireAdmin } from "@/lib/auth";
import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ArticleInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: ArticleDocument;
  category: string;
  tags: string[];
  coverImage: string | null;
  coverImageAlt: string | null;
  coverPublicId: string | null;
  relatedServiceId: string | null;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  productIds: string[];
};

function optionalText(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function parseArticleInput(formData: FormData): ArticleInput {
  const title = String(formData.get("title") ?? "").trim();
  const requestedSlug = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const rawContent = String(formData.get("content") ?? "");
  const canonicalInput = optionalText(formData, "canonicalUrl");

  let content: unknown;
  try {
    content = JSON.parse(rawContent);
  } catch {
    throw new Error("รูปแบบเนื้อหาบทความไม่ถูกต้อง");
  }

  if (title.length < 5 || title.length > 180) {
    throw new Error("ชื่อบทความต้องมี 5–180 ตัวอักษร");
  }
  if (excerpt.length < 20 || excerpt.length > 500) {
    throw new Error("คำโปรยต้องมี 20–500 ตัวอักษร");
  }
  if (!category || category.length > 80) {
    throw new Error("กรุณาระบุหมวดหมู่");
  }
  if (!isValidArticleDocument(content)) {
    throw new Error("เนื้อหามี node, link หรือรูปภาพที่ระบบไม่รองรับ");
  }
  if (canonicalInput && !sanitizeCanonical(canonicalInput)) {
    throw new Error("Canonical ต้องเป็น path หรือ URL ของเว็บไซต์นี้เท่านั้น");
  }

  const coverImage = optionalText(formData, "coverImage");
  const coverImageAlt = optionalText(formData, "coverImageAlt");
  if (coverImage && !sanitizeArticleUrl(coverImage, "image")) {
    throw new Error("ภาพปกต้องมาจาก Cloudinary หรือเว็บไซต์นี้");
  }
  if (coverImage && !coverImageAlt) {
    throw new Error("กรุณาใส่คำอธิบายภาพปก (alt text)");
  }

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);

  const productIds = Array.from(
    new Set(
      formData
        .getAll("productIds")
        .map(String)
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ).slice(0, 12);

  return {
    title,
    slug: slugifyArticleTitle(requestedSlug || title),
    excerpt,
    content,
    category,
    tags,
    coverImage,
    coverImageAlt,
    coverPublicId: optionalText(formData, "coverPublicId"),
    relatedServiceId: optionalText(formData, "relatedServiceId"),
    featured: formData.get("featured") === "on",
    seoTitle: optionalText(formData, "seoTitle"),
    seoDescription: optionalText(formData, "seoDescription"),
    canonicalUrl: canonicalInput
      ? sanitizeCanonical(canonicalInput) ?? null
      : null,
    noIndex: formData.get("noIndex") === "on",
    productIds,
  };
}

function revalidateArticlePages(...slugs: Array<string | null | undefined>) {
  const paths = new Set<string>();
  for (const slug of slugs.filter(Boolean) as string[]) {
    for (const path of getArticleRevalidationPaths(slug)) paths.add(path);
  }
  for (const path of paths) revalidatePath(path);
}

async function assertUniqueSlug(slug: string, excludedId?: string) {
  const [collision] = await db
    .select({ id: articles.id })
    .from(articles)
    .where(
      excludedId
        ? and(eq(articles.slug, slug), ne(articles.id, excludedId))
        : eq(articles.slug, slug),
    )
    .limit(1);

  if (collision) throw new Error("Slug นี้ถูกใช้งานแล้ว");
}

async function assertValidProductIds(productIds: string[]) {
  if (productIds.length === 0) return;
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(inArray(products.id, productIds));
  if (rows.length !== productIds.length) {
    throw new Error("มีสินค้าที่เกี่ยวข้องไม่ถูกต้องหรือถูกลบแล้ว");
  }
}

export async function createArticleAction(formData: FormData) {
  await requireAdmin();
  const input = parseArticleInput(formData);
  await assertUniqueSlug(input.slug);
  await assertValidProductIds(input.productIds);
  const id = crypto.randomUUID();
  const { productIds, ...articleValues } = input;

  await db.insert(articles).values({
    id,
    ...articleValues,
    status: "draft",
  });

  if (productIds.length) {
    await db.insert(articleProducts).values(
      productIds.map((productId) => ({ articleId: id, productId })),
    );
  }

  revalidateArticlePages(input.slug);
  return { id, slug: input.slug };
}

export async function updateArticleAction(id: string, formData: FormData) {
  await requireAdmin();
  const input = parseArticleInput(formData);
  const [current] = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);

  if (!current) throw new Error("ไม่พบบทความ");
  if (!canChangeArticleSlug(current) && current.slug !== input.slug) {
    throw new Error("ไม่สามารถเปลี่ยน slug หลังเผยแพร่ครั้งแรก");
  }

  await assertUniqueSlug(input.slug, id);
  await assertValidProductIds(input.productIds);
  const { productIds, ...articleValues } = input;
  await db
    .update(articles)
    .set({ ...articleValues, updatedAt: new Date() })
    .where(eq(articles.id, id));

  await db
    .delete(articleProducts)
    .where(eq(articleProducts.articleId, id));
  if (productIds.length) {
    await db.insert(articleProducts).values(
      productIds.map((productId) => ({ articleId: id, productId })),
    );
  }

  revalidateArticlePages(current.slug, input.slug);
  return { id, slug: input.slug };
}

export async function setArticlePublicationAction(
  id: string,
  publish: boolean,
) {
  await requireAdmin();
  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  if (!article) throw new Error("ไม่พบบทความ");

  if (publish) {
    const bodyText = (article.content.content ?? [])
      .map(textFromArticleNode)
      .join(" ")
      .trim();
    if (bodyText.length < 600) {
      throw new Error("เนื้อหายังสั้นเกินไปสำหรับเผยแพร่ (อย่างน้อย 600 ตัวอักษร)");
    }
    if (article.coverImage && !article.coverImageAlt) {
      throw new Error("กรุณาใส่ alt text ของภาพปกก่อนเผยแพร่");
    }
  }

  const now = new Date();
  await db
    .update(articles)
    .set({
      status: publish ? "published" : "draft",
      publishedAt: publish ? article.publishedAt ?? now : article.publishedAt,
      archived: publish ? false : article.archived,
      updatedAt: now,
    })
    .where(eq(articles.id, id));

  revalidateArticlePages(article.slug);
}

export async function setArticleArchivedAction(
  id: string,
  archived: boolean,
) {
  await requireAdmin();
  const [article] = await db
    .select({ slug: articles.slug, status: articles.status })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  if (!article) throw new Error("ไม่พบบทความ");

  await db
    .update(articles)
    .set({
      archived,
      status: archived ? "draft" : article.status,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id));

  revalidateArticlePages(article.slug);
}

export async function deleteDraftArticleAction(id: string) {
  await requireAdmin();
  const [article] = await db
    .select({
      slug: articles.slug,
      status: articles.status,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  if (!article) throw new Error("ไม่พบบทความ");
  if (!canDeleteArticlePermanently(article)) {
    throw new Error("ลบถาวรได้เฉพาะร่างที่ไม่เคยเผยแพร่");
  }

  await db.delete(articles).where(eq(articles.id, id));
  revalidateArticlePages(article.slug);
}
