import { ArticleCard } from "@/components/article-card";
import { ArticleContent } from "@/components/article-content";
import type { services } from "@/db/schema";
import type { PublishedArticleListItem } from "@/lib/article-queries";
import { buildServiceStructuredData } from "@/lib/services";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardCheck,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export type ServiceDetailProps = {
  service: typeof services.$inferSelect;
  relatedArticles: PublishedArticleListItem[];
  preview?: boolean;
};

export function ServiceDetail({
  service,
  relatedArticles,
  preview = false,
}: ServiceDetailProps) {
  const features = (service.features ?? "")
    .split("|")
    .map((feature) => feature.trim())
    .filter(Boolean);
  const bookingHref = `/booking?service=${encodeURIComponent(service.slug)}`;
  const structuredData = buildServiceStructuredData(service);

  return (
    <>
      {!preview && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      )}

      <article className="overflow-hidden rounded-[28px] bg-canvas">
        <header className="border-b border-black/5 bg-canvas-muted">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            <nav
              aria-label="เส้นทางนำทาง"
              className="flex flex-wrap items-center gap-2 text-sm text-muted"
            >
              <Link className="transition-colors hover:text-ink" href="/">
                หน้าแรก
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                className="transition-colors hover:text-ink"
                href="/services"
              >
                บริการ
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-ink">{service.name}</span>
            </nav>

            <div className="mt-9 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  <Wrench className="size-4" aria-hidden="true" />
                  งานบริการโดยช่าง C.Electronics
                </p>
                <h1 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                  {service.name}
                </h1>
                {service.description && (
                  <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
                    {service.description}
                  </p>
                )}
              </div>

              <aside
                aria-label="ข้อมูลนัดหมายบริการ"
                className="rounded-[20px] border border-black/5 bg-white p-5 shadow-[0_12px_36px_rgba(10,11,13,0.06)] sm:p-6"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-subtle">
                  <ClipboardCheck className="size-4 text-primary" aria-hidden="true" />
                  ใบแจ้งงานบริการ
                </div>
                <div className="my-4 border-t border-dashed border-black/15" />
                <p className="text-xs font-semibold text-subtle">ค่าบริการ</p>
                <p className="mt-1 text-xl font-bold text-ink">
                  {service.price || "ประเมินตามหน้างาน"}
                </p>
                <Link
                  href={bookingHref}
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  จองบริการนี้ <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </aside>
            </div>
          </div>
        </header>

        {service.image && (
          <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
            <div className="relative aspect-[3/2] overflow-hidden rounded-[24px] bg-surface-tint sm:aspect-[2/1]">
              <Image
                src={service.image}
                alt={service.imageAlt || service.name}
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1152px"
                className="object-cover"
              />
            </div>
          </div>
        )}

        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
          <aside>
            {features.length > 0 && (
              <div className="rounded-[20px] bg-canvas-muted p-5 lg:sticky lg:top-24">
                <h2 className="text-sm font-bold">บริการครอบคลุม</h2>
                <ul className="mt-4 space-y-3">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm leading-snug text-muted"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
          <div className="min-w-0">
            <ArticleContent document={service.content} />
          </div>
        </div>
      </article>

      {service.processSteps.length > 0 && (
        <section className="bg-canvas-muted py-14 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold text-primary">ลำดับการทำงาน</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              ขั้นตอนบริการ
            </h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-2">
              {service.processSteps.map((step, index) => (
                <li
                  key={`${step.title}-${index}`}
                  className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 rounded-[20px] border border-black/5 bg-white p-5 sm:p-6"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-11 items-center justify-center rounded-full bg-primary-tint text-sm font-bold text-primary"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-bold leading-snug">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {service.faqs.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-sm font-semibold text-primary">ก่อนนัดหมาย</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            คำถามที่พบบ่อย
          </h2>
          <div className="mt-7 divide-y divide-black/5 border-y border-black/5">
            {service.faqs.map((faq, index) => (
              <details key={`${faq.question}-${index}`} className="group py-1">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-bold marker:content-none">
                  {faq.question}
                  <ChevronDown
                    className="size-5 shrink-0 text-primary transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="max-w-3xl pb-5 pr-9 text-sm leading-relaxed text-muted sm:text-base">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {relatedArticles.length > 0 && (
        <section className="border-t border-black/5 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-sm font-semibold text-primary">อ่านต่อ</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  บทความสำหรับบริการนี้
                </h2>
              </div>
              <Link
                href="/articles"
                className="hidden items-center gap-1 text-sm font-semibold text-primary sm:inline-flex"
              >
                ดูบทความทั้งหมด <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[28px] bg-ink p-7 text-white sm:p-10 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-bold">พร้อมให้ช่างช่วยดูหน้างาน?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
              ส่งรายละเอียดอาการหรือความต้องการ ทีม C.Electronics
              จะติดต่อกลับเพื่อประเมินงานและนัดหมาย
            </p>
          </div>
          <Link
            href={bookingHref}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            จองบริการนี้ <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
