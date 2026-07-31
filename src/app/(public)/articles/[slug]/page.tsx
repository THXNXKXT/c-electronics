import { ArticleCard } from "@/components/article-card";
import { ArticleContent } from "@/components/article-content";
import {
  getArticleRelations,
  getPublishedArticleBySlug,
  listPublishedArticles,
} from "@/lib/article-queries";
import { extractTableOfContents, resolveArticleSeo } from "@/lib/articles";
import { ArrowRight, BookOpen, Package, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

const getArticle = cache(getPublishedArticleBySlug);
const SITE_URL = "https://www.c-electronics.online";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  const seo = resolveArticleSeo(article);

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical },
    robots: {
      index: seo.indexable,
      follow: true,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "article",
      url: seo.canonical,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      images: article.coverImage
        ? [
            {
              url: article.coverImage,
              alt: article.coverImageAlt || article.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const [relations, relatedArticles] = await Promise.all([
    getArticleRelations(article.id),
    listPublishedArticles({
      category: article.category,
      excludeSlug: article.slug,
      limit: 3,
    }),
  ]);
  const toc = extractTableOfContents(article.content);
  const seo = resolveArticleSeo(article);
  const articleUrl = `${SITE_URL}/articles/${encodeURIComponent(article.slug)}`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.title,
      description: article.excerpt,
      image: article.coverImage ? [article.coverImage] : undefined,
      datePublished: article.publishedAt?.toISOString(),
      dateModified: article.updatedAt.toISOString(),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": articleUrl,
      },
      publisher: {
        "@type": "Organization",
        name: "C.Electronics",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/Logo.png`,
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "หน้าแรก",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "บทความ",
          item: `${SITE_URL}/articles`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: article.title,
          item: articleUrl,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <article>
        <header className="border-b border-black/5 bg-canvas-muted">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap gap-2 text-sm text-muted"
            >
              <Link href="/" className="hover:text-ink">
                หน้าแรก
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/articles" className="hover:text-ink">
                บทความ
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-ink">{article.category}</span>
            </nav>
            <p className="mt-8 text-sm font-semibold text-primary">
              {article.category}
            </p>
            <h1 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {article.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base text-muted sm:text-lg">
              {article.excerpt}
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-subtle">
              {article.publishedAt && (
                <time dateTime={article.publishedAt.toISOString()}>
                  เผยแพร่{" "}
                  {article.publishedAt.toLocaleDateString("th-TH", {
                    dateStyle: "long",
                  })}
                </time>
              )}
              {article.updatedAt.getTime() !==
                article.publishedAt?.getTime() && (
                <time dateTime={article.updatedAt.toISOString()}>
                  อัปเดต{" "}
                  {article.updatedAt.toLocaleDateString("th-TH", {
                    dateStyle: "long",
                  })}
                </time>
              )}
            </div>
          </div>
        </header>

        {article.coverImage && (
          <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
            <div className="relative aspect-[3/2] overflow-hidden rounded-[24px] bg-surface-tint sm:aspect-[2/1]">
              <Image
                src={article.coverImage}
                alt={article.coverImageAlt || article.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            </div>
          </div>
        )}

        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
          <aside>
            {toc.length > 0 && (
              <nav
                aria-label="สารบัญ"
                className="rounded-[20px] bg-canvas-muted p-5 lg:sticky lg:top-24"
              >
                <h2 className="text-sm font-bold">สารบัญ</h2>
                <ol className="mt-3 space-y-2">
                  {toc.map((item) => (
                    <li
                      key={item.id}
                      className={item.level === 3 ? "pl-3" : ""}
                    >
                      <a
                        href={`#${item.id}`}
                        className="block text-sm leading-snug text-muted hover:text-primary"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </aside>
          <div className="min-w-0">
            <ArticleContent document={article.content} />

            <div className="mt-12 flex flex-wrap gap-2 border-t border-black/5 pt-6">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-canvas-muted px-3 py-1.5 text-xs font-semibold text-muted"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>

      {(relations.service || relations.products.length > 0) && (
        <section className="bg-canvas-muted py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold text-primary">
              เลือกดูต่อ
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              บริการและสินค้าที่เกี่ยวข้อง
            </h2>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relations.service && (
                <Link
                  href={`/services#${relations.service.slug}`}
                  className="rounded-[20px] bg-white p-5 transition-transform hover:-translate-y-0.5"
                >
                  <Wrench className="size-6 text-primary" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-subtle">
                    บริการ
                  </p>
                  <h3 className="mt-1 text-lg font-bold">
                    {relations.service.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">
                    {relations.service.description}
                  </p>
                  {relations.service.price && (
                    <p className="mt-3 text-sm font-semibold text-primary">
                      {relations.service.price}
                    </p>
                  )}
                </Link>
              )}
              {relations.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="rounded-[20px] bg-white p-5 transition-transform hover:-translate-y-0.5"
                >
                  <Package className="size-6 text-primary" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-subtle">
                    {product.category}
                  </p>
                  <h3 className="mt-1 text-lg font-bold">{product.name}</h3>
                  <p className="mt-3 text-sm font-semibold text-primary">
                    ฿{product.price.toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[28px] bg-ink p-7 text-white sm:p-10 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-bold">
              ต้องการให้ช่างช่วยตรวจหน้างาน?
            </h2>
            <p className="mt-2 text-sm text-white/65">
              ส่งรายละเอียดอาการหรือความต้องการ แล้วทีม C.Electronics
              จะติดต่อกลับเพื่อประเมินงาน
            </p>
          </div>
          <Link
            href="/booking"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            จองบริการ <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {relatedArticles.length > 0 && (
        <section className="border-t border-black/5 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">
                  อ่านต่อ
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  บทความที่เกี่ยวข้อง
                </h2>
              </div>
              <Link
                href="/articles"
                className="hidden items-center gap-1 text-sm font-semibold text-primary sm:flex"
              >
                ดูทั้งหมด <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((related) => (
                <ArticleCard key={related.id} article={related} />
              ))}
            </div>
          </div>
        </section>
      )}

      {!article.coverImage && (
        <span className="sr-only">
          <BookOpen /> บทความความรู้จาก C.Electronics
        </span>
      )}
      {!seo.indexable && (
        <p className="sr-only">หน้านี้ไม่ถูกนำเข้าดัชนีค้นหา</p>
      )}
    </>
  );
}
