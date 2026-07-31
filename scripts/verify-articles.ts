import { db } from "@/db";
import { articleProducts, articles } from "@/db/schema";
import {
  isValidArticleDocument,
  textFromArticleNode,
} from "@/lib/articles";
import { count } from "drizzle-orm";

const segmenter = new Intl.Segmenter("th", { granularity: "word" });
const wordCount = (content: (typeof articles.$inferSelect)["content"]) => {
  const plainText = (content.content ?? [])
    .map(textFromArticleNode)
    .join(" ");
  return Array.from(segmenter.segment(plainText)).filter(
    (segment) => segment.isWordLike,
  ).length;
};

async function main() {
  const rows = await db.select().from(articles);
  const [productLinkCount] = await db
    .select({ value: count() })
    .from(articleProducts);
  const result = {
    total: rows.length,
    drafts: rows.filter((row) => row.status === "draft").length,
    published: rows.filter((row) => row.status === "published").length,
    archived: rows.filter((row) => row.archived).length,
    productLinks: productLinkCount.value,
    articles: rows.map((row) => ({
      slug: row.slug,
      words: wordCount(row.content),
      hasCover: Boolean(row.coverImage),
      coverHost: row.coverImage
        ? new URL(row.coverImage).hostname
        : null,
      relatedService: Boolean(row.relatedServiceId),
      validContent: isValidArticleDocument(row.content),
    })),
  };

  console.log(JSON.stringify(result, null, 2));

  if (
    result.total < 6 ||
    result.drafts < 6 ||
    result.published !== 0 ||
    result.archived !== 0 ||
    result.articles.some(
      (article) =>
        article.words < 1200 ||
        article.words > 1800 ||
        !article.hasCover ||
        !article.relatedService ||
        !article.validContent,
    )
  ) {
    throw new Error("Article seed verification failed");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
