import { db } from "@/db";
import { serviceSlugRedirects, services } from "@/db/schema";
import {
  planServiceDraftSeeds,
  validateSeededService,
} from "@/lib/service-seed-data";

function normalized(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("th");
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values.map(normalized)) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

async function main() {
  const [candidates, redirects] = await Promise.all([
    db.select().from(services),
    db
      .select({ serviceId: serviceSlugRedirects.serviceId, slug: serviceSlugRedirects.slug })
      .from(serviceSlugRedirects),
  ]);
  const plan = planServiceDraftSeeds(candidates, redirects);
  const currentSlugs = candidates.map((row) => row.slug);
  const redirectSlugs = redirects.map((row) => row.slug);
  const currentSet = new Set(currentSlugs.map(normalized));
  const historicalOverlap = redirectSlugs
    .map(normalized)
    .filter((slug) => currentSet.has(slug));
  const slugConflicts = [
    ...duplicates(currentSlugs),
    ...duplicates(redirectSlugs),
    ...historicalOverlap,
  ];
  const validationErrors = plan.flatMap(({ service, seed }) =>
    validateSeededService(service, seed),
  );
  const publishedSeededServices = plan.filter(
    ({ service }) => service.status === "published" || service.publishedAt !== null,
  );

  const result = {
    matched: plan.length,
    drafts: plan.filter(({ service }) => service.status === "draft").length,
    published: publishedSeededServices.length,
    slugConflicts: [...new Set(slugConflicts)],
    validationErrors,
    services: plan.map(({ service, seed }) => ({
      key: seed.key,
      id: service.id,
      name: service.name,
      slug: service.slug,
      status: service.status,
      publishedAt: service.publishedAt,
    })),
  };

  console.log(JSON.stringify(result, null, 2));
  if (
    result.matched !== 6 ||
    result.drafts !== 6 ||
    result.published !== 0 ||
    result.slugConflicts.length > 0 ||
    result.validationErrors.length > 0
  ) {
    throw new Error("Service draft verification failed");
  }
}

main().catch((error: unknown) => {
  console.error("Service draft verification failed:", error);
  process.exitCode = 1;
});
