export const SITE_URL = "https://www.c-electronics.online";

export type ArticleStatus = "draft" | "published";

export type ArticleMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type ArticleNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ArticleNode[];
  marks?: ArticleMark[];
  text?: string;
};

export type ArticleDocument = {
  type: "doc";
  content?: ArticleNode[];
};

export type ArticleIndexState = {
  status: ArticleStatus;
  archived: boolean;
  noIndex: boolean;
};

export type ArticleSeoInput = ArticleIndexState & {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
};

export type ArticleSeo = {
  title: string;
  description: string;
  canonical: string;
  indexable: boolean;
};

export type ArticleTableOfContentsItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

export function slugifyArticleTitle(input: string): string {
  const slug = input
    .normalize("NFKC")
    .toLocaleLowerCase("th")
    .replace(/[^\p{Letter}\p{Number}\p{Mark}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "article";
}

export function sanitizeCanonical(
  input?: string | null,
  siteUrl = SITE_URL,
): string | undefined {
  const value = input?.trim();
  if (!value) return undefined;

  try {
    const base = new URL(siteUrl);
    const canonical = new URL(value, base);

    if (
      canonical.protocol !== "https:" ||
      canonical.origin.toLocaleLowerCase() !==
        base.origin.toLocaleLowerCase()
    ) {
      return undefined;
    }

    canonical.hash = "";
    canonical.search = "";
    return canonical.toString();
  } catch {
    return undefined;
  }
}

export function isIndexableArticle(article: ArticleIndexState): boolean {
  return (
    article.status === "published" &&
    article.archived === false &&
    article.noIndex === false
  );
}

function clipDescription(value: string, maxLength = 160): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;

  const candidate = normalized.slice(0, maxLength - 1);
  const lastSpace = candidate.lastIndexOf(" ");
  const clipped =
    lastSpace >= Math.floor(maxLength * 0.65)
      ? candidate.slice(0, lastSpace)
      : candidate;

  return `${clipped.trimEnd()}…`;
}

export function resolveArticleSeo(input: ArticleSeoInput): ArticleSeo {
  const canonical =
    sanitizeCanonical(input.canonicalUrl) ??
    new URL(`/articles/${encodeURIComponent(input.slug)}`, SITE_URL).toString();

  return {
    title: input.seoTitle?.trim() || input.title.trim(),
    description: clipDescription(
      input.seoDescription?.trim() || input.excerpt,
    ),
    canonical,
    indexable: isIndexableArticle(input),
  };
}

export function textFromArticleNode(node: ArticleNode): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(textFromArticleNode).join("");
}

export function extractTableOfContents(
  document: ArticleDocument,
): ArticleTableOfContentsItem[] {
  const usedIds = new Map<string, number>();
  const items: ArticleTableOfContentsItem[] = [];

  function visit(node: ArticleNode) {
    if (node.type === "heading") {
      const level = Number(node.attrs?.level);
      const text = textFromArticleNode(node).trim();

      if ((level === 2 || level === 3) && text) {
        const baseId = slugifyArticleTitle(text);
        const count = (usedIds.get(baseId) ?? 0) + 1;
        usedIds.set(baseId, count);
        items.push({
          id: count === 1 ? baseId : `${baseId}-${count}`,
          text,
          level,
        });
      }
    }

    for (const child of node.content ?? []) visit(child);
  }

  for (const node of document.content ?? []) visit(node);
  return items;
}

export function getArticleRevalidationPaths(slug: string): string[] {
  return [
    "/admin/articles",
    "/articles",
    `/articles/${slug}`,
    "/",
    "/sitemap.xml",
  ];
}

const ALLOWED_ARTICLE_NODES = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
  "horizontalRule",
  "image",
]);

const ALLOWED_ARTICLE_MARKS = new Set([
  "bold",
  "italic",
  "strike",
  "code",
  "link",
]);

export function sanitizeArticleUrl(
  input: unknown,
  kind: "link" | "image",
): string | undefined {
  if (typeof input !== "string") return undefined;
  const value = input.trim();
  if (!value) return undefined;

  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (kind === "link" && value.startsWith("#")) return value;

  try {
    const url = new URL(value);
    if (kind === "image") {
      const allowedHosts = new Set([
        "res.cloudinary.com",
        new URL(SITE_URL).hostname,
      ]);
      return url.protocol === "https:" && allowedHosts.has(url.hostname)
        ? url.toString()
        : undefined;
    }
    const allowedProtocols = new Set(["http:", "https:", "mailto:", "tel:"]);

    return allowedProtocols.has(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function isValidArticleDocument(
  input: unknown,
): input is ArticleDocument {
  if (!input || typeof input !== "object") return false;
  const root = input as ArticleNode;
  if (root.type !== "doc" || !Array.isArray(root.content)) return false;

  function isValidNode(node: ArticleNode, depth: number): boolean {
    if (depth > 30 || !ALLOWED_ARTICLE_NODES.has(node.type)) return false;
    if (node.type === "doc" && depth !== 0) return false;

    if (
      node.marks?.some((mark) => {
        if (!ALLOWED_ARTICLE_MARKS.has(mark.type)) return true;
        if (mark.type === "link") {
          return !sanitizeArticleUrl(mark.attrs?.href, "link");
        }
        return false;
      })
    ) {
      return false;
    }

    if (node.type === "text") {
      return typeof node.text === "string" && !node.content;
    }

    if (node.type === "heading") {
      const level = Number(node.attrs?.level);
      if (level !== 2 && level !== 3) return false;
    }

    if (
      node.type === "image" &&
      !sanitizeArticleUrl(node.attrs?.src, "image")
    ) {
      return false;
    }
    if (
      node.type === "image" &&
      (typeof node.attrs?.alt !== "string" || !node.attrs.alt.trim())
    ) {
      return false;
    }

    if (node.content && !Array.isArray(node.content)) return false;
    return (node.content ?? []).every((child) =>
      isValidNode(child, depth + 1),
    );
  }

  return isValidNode(root, 0);
}

export function canChangeArticleSlug(article: {
  publishedAt: Date | null;
}): boolean {
  return article.publishedAt === null;
}

export function canDeleteArticlePermanently(article: {
  status: ArticleStatus;
  publishedAt: Date | null;
}): boolean {
  return article.status === "draft" && article.publishedAt === null;
}
