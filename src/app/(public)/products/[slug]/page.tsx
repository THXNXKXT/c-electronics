import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ChevronRight, PhoneCall, MessageCircle, Check, X } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { Gallery } from "./gallery";

const PHONE = "0XX-XXX-XXXX";
const LINE_URL = "https://line.me";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [p] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!p || p.archived) return { title: "ไม่พบสินค้า" };
  return {
    title: `${p.name} — แคตตาล็อกสินค้า`,
    description:
      p.description?.slice(0, 155) ??
      `${p.name} ราคา ฿${p.price.toLocaleString()} สอบถามได้ทางโทรศัพท์และ LINE`,
    alternates: { canonical: `/products/${p.slug}` },
  };
}

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  // 404 if missing or archived
  if (!product || product.archived) notFound();

  // cover first, then gallery entries (schema stores gallery as comma-sep URLs)
  const gallery = product.images
    ? product.images.split("|").map((s) => s.trim()).filter(Boolean)
    : [];
  const images = [product.image, ...gallery].filter(Boolean) as string[];

  const fmt = (n: number) => `฿${n.toLocaleString()}`;
  const hasDiscount =
    !!product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      {/* ===== Breadcrumb ===== */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted">
        <Link href="/products" className="transition-colors hover:text-primary">
          สินค้า
        </Link>
        <ChevronRight className="size-3.5 shrink-0 text-subtle" />
        <span className="max-w-[8rem] truncate text-subtle sm:max-w-none">
          {product.category}
        </span>
        <ChevronRight className="size-3.5 shrink-0 text-subtle" />
        <span className="truncate font-medium text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* ===== Gallery ===== */}
        <Gallery images={images} name={product.name} />

        {/* ===== Details ===== */}
        <div className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {product.category}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {product.name}
          </h1>

          {/* Price — compareAtPrice as strikethrough when present */}
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <span className="text-3xl font-extrabold tabular-nums text-primary">
              {fmt(product.price)}
            </span>
            {hasDiscount && (
              <span className="pb-1 text-lg text-subtle line-through tabular-nums">
                {fmt(product.compareAtPrice!)}
              </span>
            )}
          </div>

          {/* Stock status */}
          <div
            className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
              product.stock
                ? "bg-positive/10 text-positive"
                : "bg-negative/10 text-negative"
            }`}
          >
            {product.stock ? (
              <>
                <Check className="size-4" /> มีสินค้า
              </>
            ) : (
              <>
                <X className="size-4" /> สินค้าหมด
              </>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-subtle">
                รายละเอียด
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted sm:text-base">
                {product.description}
              </p>
            </div>
          )}

          {/* Inquire CTAs — catalog only, no add-to-cart */}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`tel:${PHONE}`}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <PhoneCall className="size-4" /> โทรสอบถาม
            </a>
            <a
              href={LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary"
            >
              <MessageCircle className="size-4 text-primary" /> แชท LINE
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
