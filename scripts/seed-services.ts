import { serviceSlugRedirects, services } from "@/db/schema";
import { withDatabaseTransaction } from "@/db/transaction";
import {
  buildServiceSeedUpdate,
  planServiceDraftSeeds,
  serviceDraftSeeds,
  serviceSeedNeedsUpdate,
} from "@/lib/service-seed-data";
import { eq, sql } from "drizzle-orm";

async function main() {
  const result = await withDatabaseTransaction(async (tx) => {
    for (const slug of serviceDraftSeeds.map((seed) => seed.slug).sort()) {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${slug}, 0))`,
      );
    }

    const candidates = await tx.select().from(services).for("update");
    const redirects = await tx
      .select({ serviceId: serviceSlugRedirects.serviceId, slug: serviceSlugRedirects.slug })
      .from(serviceSlugRedirects);
    const plan = planServiceDraftSeeds(candidates, redirects);
    const now = new Date();
    const changed: string[] = [];
    const unchanged: string[] = [];

    // Planning and all collision checks finish before the first update. Any later
    // database failure rolls the complete batch back with this transaction.
    for (const { service, seed } of plan) {
      if (!serviceSeedNeedsUpdate(service, seed)) {
        unchanged.push(seed.key);
        continue;
      }
      await tx
        .update(services)
        .set({ ...buildServiceSeedUpdate(seed), updatedAt: now })
        .where(eq(services.id, service.id));
      changed.push(seed.key);
    }

    return { matched: plan.length, changed, unchanged };
  });

  console.log(JSON.stringify({ serviceDraftSeed: "ready", ...result }, null, 2));
}

main().catch((error: unknown) => {
  console.error("Service draft seed failed:", error);
  process.exitCode = 1;
});
