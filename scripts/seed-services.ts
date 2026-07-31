import { serviceSlugRedirects, services } from "@/db/schema";
import {
  withDatabaseTransaction,
  type DatabaseTransaction,
} from "@/db/transaction";
import {
  buildServiceSeedUpdate,
  planServiceDraftSeeds,
  serviceDraftSeeds,
  serviceSeedNeedsUpdate,
} from "@/lib/service-seed-data";
import { asc, eq, sql } from "drizzle-orm";

async function lockServiceRows(tx: DatabaseTransaction) {
  // Match the admin mutation order: lock rows before advisory slug locks.
  // Ordering by the primary key keeps two seed runs from locking rows differently.
  return tx
    .select()
    .from(services)
    .orderBy(asc(services.id))
    .for("update");
}

async function readRedirects(tx: DatabaseTransaction) {
  return tx
    .select({
      serviceId: serviceSlugRedirects.serviceId,
      slug: serviceSlugRedirects.slug,
    })
    .from(serviceSlugRedirects);
}

async function lockServiceSlugs(
  tx: DatabaseTransaction,
  slugs: string[],
) {
  for (const slug of [...new Set(slugs)].sort()) {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${slug}, 0))`,
    );
  }
}

async function main() {
  const result = await withDatabaseTransaction(async (tx) => {
    const initiallyLockedCandidates = await lockServiceRows(tx);
    const initialRedirects = await readRedirects(tx);
    const initialPlan = planServiceDraftSeeds(
      initiallyLockedCandidates,
      initialRedirects,
    );
    await lockServiceSlugs(tx, [
      ...serviceDraftSeeds.map((seed) => seed.slug),
      ...initialPlan.map(({ service }) => service.slug),
    ]);

    // A concurrent create can commit while this transaction is waiting for its
    // target advisory lock. Re-read both tables after every lock is held, then
    // repeat the complete match/collision validation before the first update.
    const candidates = await lockServiceRows(tx);
    const redirects = await readRedirects(tx);
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
