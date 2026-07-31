import {
  sanitizeCanonical,
  SITE_URL,
  textFromArticleNode,
  type ArticleDocument,
} from "./articles";

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
    throw new Error(
      "เนื้อหายังสั้นเกินไปสำหรับเผยแพร่ (อย่างน้อย 600 ตัวอักษร)",
    );
  }
  if (!input.description?.trim()) {
    throw new Error("กรุณาระบุคำอธิบายบริการก่อนเผยแพร่");
  }
  if (input.processSteps.length === 0) {
    throw new Error("กรุณาระบุขั้นตอนบริการอย่างน้อย 1 ขั้นตอนก่อนเผยแพร่");
  }
  if (input.image && !input.imageAlt?.trim()) {
    throw new Error("กรุณาใส่ alt text ของรูปบริการก่อนเผยแพร่");
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
    canonical:
      sanitizeCanonical(input.canonicalUrl) ??
      new URL(`/services/${encodeURIComponent(input.slug)}`, SITE_URL).toString(),
    indexable: isIndexableService(input),
  };
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
  description: string | null;
  image: string | null;
  price: string | null;
  faqs: ServiceFaq[];
  updatedAt: Date;
}): Array<Record<string, unknown>> {
  const url = new URL(`/services/${encodeURIComponent(input.slug)}`, SITE_URL).toString();
  const description = input.description?.trim();
  const service: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    url,
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
