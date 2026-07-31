import type { PublishedArticleListItem } from "@/lib/article-queries";
import { ArrowRight, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function ArticleCard({
  article,
}: {
  article: PublishedArticleListItem;
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-black/5 bg-white transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-[0_10px_36px_rgba(56,113,193,0.1)]">
      <Link
        href={`/articles/${article.slug}`}
        className="relative block aspect-[3/2] overflow-hidden bg-surface-tint"
      >
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.coverImageAlt || article.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <BookOpen className="size-12 text-primary" strokeWidth={1.4} />
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {article.category}
        </p>
        <h2 className="mt-2 text-xl font-bold leading-snug tracking-tight">
          <Link href={`/articles/${article.slug}`}>{article.title}</Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-sm text-muted">
          {article.excerpt}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <time className="text-xs text-subtle">
            {article.publishedAt?.toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </time>
          <Link
            href={`/articles/${article.slug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            อ่านบทความ <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
