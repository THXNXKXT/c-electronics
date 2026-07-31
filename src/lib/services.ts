import {
  sanitizeCanonical,
  SITE_URL,
  textFromArticleNode,
  type ArticleDocument,
} from "./articles";
import { ServiceUserFacingError } from "./service-action-result";

export type ServiceStatus = "draft" | "published";

export type ServiceProcessStep = {
  title: string;
  description: string;
};

export type ServiceFaq = {
  question: string;
  answer: string;
};

export type ServiceSeoInput = {
  name: string;
  slug: string;
  description: string | null;
  status: ServiceStatus;
  archived: boolean;
  noIndex: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
};

export type ServiceContent = ArticleDocument;

const SERVICE_SLUG_CHANGE_CONFIRMATION_FIELD = "confirmSlugChange";
const SERVICE_SLUG_CHANGE_CONFIRMATION_VALUE = "confirmed";
const SERVICE_SLUG_CHANGE_EXPECTED_OLD_FIELD = "expectedOldSlug";
const SERVICE_SLUG_CHANGE_EXPECTED_NEW_FIELD = "expectedNewSlug";
export const SERVICE_SLUG_MAX_LENGTH = 180;
export const SERVICE_LEGACY_SLUG_MAX_LENGTH = 2_048;

export function isServiceSlugStorageChange(
  previousSlug: string,
  nextSlug: string,
): boolean {
  return previousSlug !== nextSlug;
}

export type ServiceSlugChangeConfirmation = {
  expectedOldSlug: string;
  expectedNewSlug: string;
};

function invalidServiceSlugChangeConfirmation(): never {
  throw new ServiceUserFacingError(
    "ข้อมูลยืนยันการเปลี่ยน URL ไม่ถูกต้อง กรุณายืนยันอีกครั้ง",
  );
}

function parseExpectedServiceSlug(
  value: FormDataEntryValue | null,
  maxLength: number,
): string {
  if (typeof value !== "string") invalidServiceSlugChangeConfirmation();
  if (!value || value.length > maxLength * 12) {
    invalidServiceSlugChangeConfirmation();
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    invalidServiceSlugChangeConfirmation();
  }
  if (
    !decoded ||
    decoded.length > maxLength ||
    /[/?#]/.test(decoded)
  ) {
    invalidServiceSlugChangeConfirmation();
  }
  return decoded;
}

export function parseServiceSlugChangeConfirmation(
  formData: FormData,
): ServiceSlugChangeConfirmation | null {
  const marker = formData.get(SERVICE_SLUG_CHANGE_CONFIRMATION_FIELD);
  const expectedOld = formData.get(SERVICE_SLUG_CHANGE_EXPECTED_OLD_FIELD);
  const expectedNew = formData.get(SERVICE_SLUG_CHANGE_EXPECTED_NEW_FIELD);
  if (marker === null && expectedOld === null && expectedNew === null) {
    return null;
  }
  if (marker !== SERVICE_SLUG_CHANGE_CONFIRMATION_VALUE) {
    invalidServiceSlugChangeConfirmation();
  }

  return {
    expectedOldSlug: parseExpectedServiceSlug(
      expectedOld,
      SERVICE_LEGACY_SLUG_MAX_LENGTH,
    ),
    expectedNewSlug: parseExpectedServiceSlug(
      expectedNew,
      SERVICE_SLUG_MAX_LENGTH,
    ),
  };
}

export function markServiceSlugChangeConfirmed(
  formData: FormData,
  confirmation: ServiceSlugChangeConfirmation,
): void {
  formData.set(
    SERVICE_SLUG_CHANGE_CONFIRMATION_FIELD,
    SERVICE_SLUG_CHANGE_CONFIRMATION_VALUE,
  );
  formData.set(
    SERVICE_SLUG_CHANGE_EXPECTED_OLD_FIELD,
    confirmation.expectedOldSlug,
  );
  formData.set(
    SERVICE_SLUG_CHANGE_EXPECTED_NEW_FIELD,
    confirmation.expectedNewSlug,
  );
}

export function assertServiceSlugChangeConfirmed(input: {
  previousSlug: string;
  nextSlug: string;
  publishedAt: Date | null;
  confirmation: ServiceSlugChangeConfirmation | null;
}): void {
  const previousSlug = input.previousSlug;
  const nextSlug = input.nextSlug;
  const slugChanged = isServiceSlugStorageChange(previousSlug, nextSlug);

  if (input.confirmation) {
    if (
      !slugChanged ||
      input.confirmation.expectedOldSlug !== previousSlug ||
      input.confirmation.expectedNewSlug !== nextSlug
    ) {
      throw new ServiceUserFacingError(
        "ข้อมูลบริการเปลี่ยนแปลงแล้ว กรุณาโหลดข้อมูลล่าสุดและยืนยันการเปลี่ยน URL อีกครั้ง",
      );
    }
    return;
  }

  if (slugChanged && input.publishedAt !== null) {
    throw new ServiceUserFacingError(
      "กรุณายืนยันการเปลี่ยน URL บริการที่เคยเผยแพร่แล้ว",
    );
  }
}

function serviceSlugFromCanonical(canonicalUrl: string): string | null {
  try {
    const pathname = new URL(canonicalUrl).pathname;
    const prefix = "/services/";
    if (!pathname.startsWith(prefix)) return null;
    const encodedSlug = pathname.slice(prefix.length).replace(/\/+$/, "");
    if (!encodedSlug || encodedSlug.includes("/")) return null;
    const slug = decodeURIComponent(encodedSlug);
    return slug.includes("/") ? null : slug;
  } catch {
    return null;
  }
}

export function resolveServiceCanonicalAfterSlugChange(input: {
  canonicalUrl: string | null;
  previousSlug: string;
  nextSlug: string;
  historicalSlugs: readonly string[];
}): string | null {
  const canonical = sanitizeCanonical(input.canonicalUrl);
  if (!canonical) return null;

  const targetSlug = serviceSlugFromCanonical(canonical);
  if (!targetSlug) return canonical;

  const targetsOldSelf =
    isServiceSlugStorageChange(input.previousSlug, input.nextSlug) &&
    targetSlug === input.previousSlug;
  const targetsHistoricalSelf = input.historicalSlugs.some(
    (slug) => slug === targetSlug,
  );

  return targetsOldSelf || targetsHistoricalSelf ? null : canonical;
}

export function requireServiceActionBoolean(
  value: unknown,
  label: string,
): boolean {
  if (typeof value !== "boolean") {
    throw new ServiceUserFacingError(`${label}ต้องเป็นค่า true หรือ false`);
  }
  return value;
}

export function getServicePublicationMutation(input: {
  publish: boolean;
  archived: boolean;
  publishedAt: Date | null;
  now: Date;
}): {
  status: ServiceStatus;
  publishedAt: Date | null;
  updatedAt: Date;
} {
  if (input.publish && input.archived) {
    throw new ServiceUserFacingError(
      "กรุณากู้คืนบริการก่อนเผยแพร่",
    );
  }

  return {
    status: input.publish ? "published" : "draft",
    publishedAt: input.publish
      ? input.publishedAt ?? input.now
      : input.publishedAt,
    updatedAt: input.now,
  };
}

export function slugifyServiceName(input: string): string {
  const slug = input
    .normalize("NFKC")
    .toLocaleLowerCase("th")
    .replace(/[^\p{Letter}\p{Number}\p{Mark}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "service";
}

export function normalizeServiceRouteSlug(input: string): string {
  try {
    return decodeURIComponent(input).normalize("NFKC");
  } catch {
    return input.normalize("NFKC");
  }
}

export function normalizeServiceImageSource(input: string | null): string | null {
  if (!input) return input;
  if (input.startsWith("/")) {
    return `/${input.replace(/^\/+/, "")}`;
  }

  try {
    const imageUrl = new URL(input);
    const siteUrl = new URL(SITE_URL);
    if (
      imageUrl.protocol === "https:" &&
      imageUrl.hostname.toLocaleLowerCase() ===
        siteUrl.hostname.toLocaleLowerCase()
    ) {
      const pathname = `/${imageUrl.pathname.replace(/^\/+/, "")}`;
      return `${pathname}${imageUrl.search}`;
    }
  } catch {
    return input;
  }

  return input;
}

export function resolveBookingServicePrefill(
  requestedSlug: string | string[] | undefined,
  availableServices: ReadonlyArray<{ slug: string; name: string }>,
): string | null {
  if (typeof requestedSlug !== "string") return null;
  const slug = normalizeServiceRouteSlug(requestedSlug);
  return (
    availableServices.find(
      (service) => normalizeServiceRouteSlug(service.slug) === slug,
    )?.name ?? null
  );
}

export function getPublishedServiceHref(input: {
  slug: string;
  status: ServiceStatus;
  publishedAt: Date | null;
  archived: boolean;
}): string | null {
  if (
    input.status !== "published" ||
    input.publishedAt === null ||
    input.archived
  ) {
    return null;
  }

  return `/services/${encodeURIComponent(input.slug)}`;
}

export function getRelatedServiceHref(input: {
  slug: string;
  status: ServiceStatus;
  publishedAt: Date | null;
  archived: boolean;
}): string {
  return getPublishedServiceHref(input) ?? "/services";
}

export function isIndexableService(input: {
  status: ServiceStatus;
  archived: boolean;
  noIndex: boolean;
}): boolean {
  return input.status === "published" && !input.archived && !input.noIndex;
}

export function assertServiceReadyForPublication(input: {
  content: ArticleDocument;
  description: string | null;
  processSteps: ServiceProcessStep[];
  image: string | null;
  imageAlt: string | null;
}): void {
  const bodyText = (input.content.content ?? [])
    .map(textFromArticleNode)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (bodyText.length < 600) {
    throw new ServiceUserFacingError(
      "เนื้อหายังสั้นเกินไปสำหรับเผยแพร่ (อย่างน้อย 600 ตัวอักษร)",
    );
  }
  if (!input.description?.trim()) {
    throw new ServiceUserFacingError("กรุณาระบุคำอธิบายบริการก่อนเผยแพร่");
  }
  if (input.processSteps.length === 0) {
    throw new ServiceUserFacingError("กรุณาระบุขั้นตอนบริการอย่างน้อย 1 ขั้นตอนก่อนเผยแพร่");
  }
  if (input.image && !input.imageAlt?.trim()) {
    throw new ServiceUserFacingError("กรุณาใส่ alt text ของรูปบริการก่อนเผยแพร่");
  }
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

export function resolveServiceSeo(input: ServiceSeoInput): {
  title: string;
  description: string;
  canonical: string;
  indexable: boolean;
} {
  return {
    title: input.seoTitle?.trim() || input.name.trim(),
    description: clipDescription(input.seoDescription?.trim() || input.description || ""),
    canonical: resolveServiceCanonical(input),
    indexable: isIndexableService(input),
  };
}

export function resolveServiceCanonical(
  input: { slug: string; canonicalUrl?: string | null },
  siteUrl = SITE_URL,
): string {
  return (
    sanitizeCanonical(input.canonicalUrl, siteUrl) ??
    new URL(`/services/${encodeURIComponent(input.slug)}`, siteUrl).toString()
  );
}

export function canDeleteServicePermanently(input: {
  status: ServiceStatus;
  publishedAt: Date | null;
}): boolean {
  return input.status === "draft" && input.publishedAt === null;
}

export function buildServiceStructuredData(input: {
  name: string;
  slug: string;
  canonicalUrl: string;
  description: string | null;
  image: string | null;
  price: string | null;
  faqs: ServiceFaq[];
  updatedAt: Date;
}): Array<Record<string, unknown>> {
  const url = input.canonicalUrl;
  const description = input.description?.trim();
  const service: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": url,
    name: input.name,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    dateModified: input.updatedAt.toISOString(),
    provider: {
      "@type": "Organization",
      name: "C.Electronics",
      url: SITE_URL,
    },
  };

  if (description) service.description = description;
  if (input.image) service.image = input.image;
  if (input.price) {
    service.offers = {
      "@type": "Offer",
      price: input.price,
      priceCurrency: "THB",
    };
  }

  const breadcrumb: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "หน้าแรก", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "บริการ", item: new URL("/services", SITE_URL).toString() },
      { "@type": "ListItem", position: 3, name: input.name, item: url },
    ],
  };

  if (input.faqs.length === 0) return [service, breadcrumb];

  return [
    service,
    breadcrumb,
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: input.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ];
}

export function getServiceRevalidationPaths(
  slugs: string[] = [],
  articleSlugs: string[] = [],
): string[] {
  return [
    "/admin/services",
    "/",
    "/services",
    "/booking",
    "/articles",
    "/sitemap.xml",
    ...slugs.map((slug) => `/services/${slug}`),
    ...articleSlugs.map((slug) => `/articles/${slug}`),
  ];
}
