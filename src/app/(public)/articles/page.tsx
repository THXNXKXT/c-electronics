import { ArticleCard } from "@/components/article-card";
import {
  listArticleCategories,
  listPublishedArticles,
} from "@/lib/article-queries";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const hasQueryString = Object.keys(params).length > 0;
  return {
    title: "บทความและคู่มือเรื่องงานช่าง | C.Electronics",
    description:
      "รวมความรู้เรื่องแอร์ กล้องวงจรปิด ระบบไฟฟ้า จานดาวเทียม การซ่อมเครื่องใช้ไฟฟ้า และอะไหล่อิเล็กทรอนิกส์จาก C.Electronics",
    alternates: { canonical: "/articles" },
    robots: hasQueryString ? { index: false, follow: true } : undefined,
    openGraph: {
      title: "บทความและคู่มือเรื่องงานช่าง | C.Electronics",
      description:
        "ความรู้ที่ช่วยให้ตรวจอาการเบื้องต้น เลือกอุปกรณ์ได้เหมาะสม และรู้ว่าเมื่อไรควรเรียกช่าง",
      url: "/articles",
      type: "website",
    },
  };
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category =
    typeof params.category === "string" ? params.category : undefined;
  const [allArticles, categories] = await Promise.all([
    listPublishedArticles({ category }),
    listArticleCategories(),
  ]);
  const featured =
    allArticles.find((article) => article.featured) ?? allArticles[0];
  const remaining = featured
    ? allArticles.filter((article) => article.id !== featured.id)
    : [];

  return (
    <>
      <section className="border-b border-black/5 bg-canvas-muted">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-semibold text-primary">
            Knowledge Hub
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            เรื่องงานช่างที่เจ้าของบ้านควรรู้
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted sm:text-lg">
            คู่มือที่ช่วยให้คุณเลือกอุปกรณ์ ตรวจอาการเบื้องต้นอย่างปลอดภัย
            และตัดสินใจได้ว่าเมื่อไรควรหยุดแล้วเรียกช่าง
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <nav
          aria-label="กรองหมวดหมู่บทความ"
          className="mb-10 flex flex-wrap gap-2"
        >
          <Link
            href="/articles"
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              !category
                ? "bg-primary text-white"
                : "border border-black/10 bg-white text-muted hover:border-ink"
            }`}
          >
            ทั้งหมด
          </Link>
          {categories.map((item) => (
            <Link
              key={item}
              href={`/articles?category=${encodeURIComponent(item)}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                category === item
                  ? "bg-primary text-white"
                  : "border border-black/10 bg-white text-muted hover:border-ink"
              }`}
            >
              {item}
            </Link>
          ))}
        </nav>

        {allArticles.length === 0 ? (
          <div className="rounded-[24px] bg-canvas-muted px-6 py-16 text-center">
            <h2 className="text-xl font-bold">
              ยังไม่มีบทความที่เผยแพร่ในหมวดนี้
            </h2>
            <p className="mt-2 text-sm text-muted">
              เลือกดูหมวดอื่นหรือกลับมาตรวจสอบอีกครั้งเร็ว ๆ นี้
            </p>
          </div>
        ) : (
          <>
            {featured && !category && (
              <article className="mb-12 grid overflow-hidden rounded-[28px] bg-ink text-white lg:grid-cols-2">
                <div className="relative min-h-72 bg-primary/20">
                  {featured.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.coverImage}
                      alt={featured.coverImageAlt || featured.title}
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-white/40">
                      บทความแนะนำ
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center p-7 sm:p-10">
                  <p className="text-sm font-semibold text-primary-tint">
                    บทความเด่น · {featured.category}
                  </p>
                  <h2 className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="mt-4 text-sm text-white/70 sm:text-base">
                    {featured.excerpt}
                  </p>
                  <Link
                    href={`/articles/${featured.slug}`}
                    className="mt-7 w-fit rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
                  >
                    อ่านบทความ
                  </Link>
                </div>
              </article>
            )}

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(category ? allArticles : remaining).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
