import { ServiceDetail } from "@/components/service-detail";
import {
  listPublishedArticlesForService,
  resolvePublishedServiceRoute,
} from "@/lib/service-queries";
import {
  normalizeServiceRouteSlug,
  resolveServiceSeo,
} from "@/lib/services";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";

const resolveService = cache(resolvePublishedServiceRoute);

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = normalizeServiceRouteSlug((await params).slug);
  const resolution = await resolveService(slug);
  if (!resolution) return {};

  const { service } = resolution;
  const seo = resolveServiceSeo(service);
  const image = service.image
    ? [{ url: service.image, alt: service.imageAlt || service.name }]
    : undefined;

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical },
    robots: { index: seo.indexable, follow: true },
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "website",
      url: seo.canonical,
      images: image,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: image,
    },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = normalizeServiceRouteSlug((await params).slug);
  const resolution = await resolveService(slug);
  if (!resolution) notFound();
  if (resolution.kind === "redirect") {
    permanentRedirect(`/services/${encodeURIComponent(resolution.service.slug)}`);
  }

  const relatedArticles = await listPublishedArticlesForService(
    resolution.service.id,
    3,
  );

  return (
    <ServiceDetail
      service={resolution.service}
      relatedArticles={relatedArticles}
    />
  );
}
