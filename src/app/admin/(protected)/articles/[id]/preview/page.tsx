import { ArticleContent } from "@/components/article-content";
import { getAdminArticle } from "@/lib/article-queries";
import { extractTableOfContents } from "@/lib/articles";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
  title: "ตัวอย่างบทความ",
  robots: { index: false, follow: false },
};

export default async function ArticlePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getAdminArticle(id);
  if (!article) notFound();
  const toc = extractTableOfContents(article.content);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-warning/20 bg-warning/5 px-5 py-4">
        <p className="text-sm font-semibold text-warning">
          โหมดตัวอย่าง · สถานะ{" "}
          {article.archived
            ? "เก็บถาวร"
            : article.status === "published"
              ? "เผยแพร่แล้ว"
              : "ฉบับร่าง"}
        </p>
        <div className="flex gap-3">
          {article.status === "published" && !article.archived && (
            <Link
              href={`/articles/${article.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              เปิดหน้าจริง <ExternalLink className="size-4" />
            </Link>
          )}
          <Link
            href={`/admin/articles/${article.id}/edit`}
            className="text-sm font-semibold text-primary"
          >
            กลับไปแก้ไข
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-sm">
        {article.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt={article.coverImageAlt || article.title}
            className="aspect-[2/1] w-full object-cover"
          />
        )}
        <header className="border-b border-black/5 px-6 py-9 sm:px-10">
          <p className="text-sm font-semibold text-primary">
            {article.category}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-4 text-muted">{article.excerpt}</p>
        </header>
        <div className="grid gap-8 px-6 py-9 sm:px-10 lg:grid-cols-[180px_1fr]">
          <aside>
            {toc.length > 0 && (
              <div className="rounded-2xl bg-canvas-muted p-4">
                <p className="text-sm font-bold">สารบัญ</p>
                <ol className="mt-3 space-y-2">
                  {toc.map((item) => (
                    <li
                      key={item.id}
                      className={`text-xs text-muted ${
                        item.level === 3 ? "pl-2" : ""
                      }`}
                    >
                      {item.text}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </aside>
          <ArticleContent document={article.content} />
        </div>
      </article>
    </div>
  );
}
