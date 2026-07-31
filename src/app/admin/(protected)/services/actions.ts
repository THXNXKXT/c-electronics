"use server";

import { services, serviceSlugRedirects } from "@/db/schema";
import {
  withDatabaseTransaction,
  type DatabaseTransaction,
} from "@/db/transaction";
import { requireAdmin } from "@/lib/auth";
import { deleteCloudinaryImage, withTimeout } from "@/lib/cloudinary";
import { revalidateServicePages } from "@/lib/revalidate-service-pages";
import {
  runAuthorizedServiceAction,
  ServiceUserFacingError,
  type ServiceActionResult,
} from "@/lib/service-action-result";
import { parseServiceInput } from "@/lib/service-input";
import { listArticleSlugsForService } from "@/lib/service-queries";
import {
  assertServiceReadyForPublication,
  canDeleteServicePermanently,
} from "@/lib/services";
import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type QueryExecutor = Pick<DatabaseTransaction, "select">;

async function lockServiceSlugs(
  tx: DatabaseTransaction,
  slugs: string[],
) {
  const orderedSlugs = Array.from(new Set(slugs)).sort();
  for (const slug of orderedSlugs) {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${slug}, 0))`,
    );
  }
}

async function assertUniqueServiceSlug(
  slug: string,
  excludedId: string | undefined,
  executor: QueryExecutor,
) {
  const [currentCollision] = await executor
    .select({ id: services.id })
    .from(services)
    .where(
      excludedId
        ? and(eq(services.slug, slug), ne(services.id, excludedId))
        : eq(services.slug, slug),
    )
    .limit(1);

  const [historicalCollision] = await executor
    .select({ id: serviceSlugRedirects.id })
    .from(serviceSlugRedirects)
    .where(eq(serviceSlugRedirects.slug, slug))
    .limit(1);

  if (currentCollision || historicalCollision) {
    throw new ServiceUserFacingError(
      "Slug นี้ถูกใช้งานแล้วหรือเป็น URL เดิมของบริการ",
    );
  }
}

function revalidateMutation(
  slugs: string[],
  articleSlugs: string[],
) {
  revalidateServicePages(revalidatePath, slugs, articleSlugs);
}

export async function createServiceAction(
  formData: FormData,
): Promise<ServiceActionResult<{ id: string; slug: string }>> {
  return runAuthorizedServiceAction(requireAdmin, async () => {
    const input = parseServiceInput(formData);
    const id = crypto.randomUUID();

    await withDatabaseTransaction(async (tx) => {
      await lockServiceSlugs(tx, [input.slug]);
      await assertUniqueServiceSlug(input.slug, undefined, tx);
      await tx.insert(services).values({
        id,
        ...input,
        status: "draft",
      });
    });

    revalidateMutation([input.slug], []);
    return { id, slug: input.slug };
  });
}

export async function updateServiceAction(
  id: string,
  formData: FormData,
): Promise<ServiceActionResult<{ id: string; slug: string }>> {
  return runAuthorizedServiceAction(requireAdmin, async () => {
    const articleSlugs = await listArticleSlugsForService(id);
    const input = parseServiceInput(formData);
    const now = new Date();

    const current = await withDatabaseTransaction(async (tx) => {
      const [lockedService] = await tx
        .select({
          id: services.id,
          slug: services.slug,
          status: services.status,
          publishedAt: services.publishedAt,
        })
        .from(services)
        .where(eq(services.id, id))
        .limit(1)
        .for("update");

      if (!lockedService) throw new ServiceUserFacingError("ไม่พบบริการ");
      const slugChanged = lockedService.slug !== input.slug;
      await lockServiceSlugs(tx, [lockedService.slug, input.slug]);

      if (slugChanged) {
        await assertUniqueServiceSlug(input.slug, id, tx);
        if (lockedService.publishedAt) {
          await tx.insert(serviceSlugRedirects).values({
            serviceId: id,
            slug: lockedService.slug,
          });
        }
      }
      if (lockedService.status === "published") {
        assertServiceReadyForPublication(input);
      }
      await tx
        .update(services)
        .set({ ...input, updatedAt: now })
        .where(eq(services.id, id));
      return lockedService;
    });

    revalidateMutation(
      current.slug === input.slug ? [current.slug] : [current.slug, input.slug],
      articleSlugs,
    );
    return { id, slug: input.slug };
  });
}

export async function setServicePublicationAction(
  id: string,
  publish: boolean,
): Promise<ServiceActionResult> {
  return runAuthorizedServiceAction(requireAdmin, async () => {
    const articleSlugs = await listArticleSlugsForService(id);
    const now = new Date();
    const service = await withDatabaseTransaction(async (tx) => {
      const [lockedService] = await tx
        .select()
        .from(services)
        .where(eq(services.id, id))
        .limit(1)
        .for("update");
      if (!lockedService) throw new ServiceUserFacingError("ไม่พบบริการ");
      if (publish) assertServiceReadyForPublication(lockedService);

      await tx
        .update(services)
        .set({
          status: publish ? "published" : "draft",
          publishedAt: publish
            ? lockedService.publishedAt ?? now
            : lockedService.publishedAt,
          archived: publish ? false : lockedService.archived,
          updatedAt: now,
        })
        .where(eq(services.id, id));
      return lockedService;
    });

    revalidateMutation([service.slug], articleSlugs);
    return {};
  });
}

export async function setServiceArchivedAction(
  id: string,
  archived: boolean,
): Promise<ServiceActionResult> {
  return runAuthorizedServiceAction(requireAdmin, async () => {
    const articleSlugs = await listArticleSlugsForService(id);
    const service = await withDatabaseTransaction(async (tx) => {
      const [lockedService] = await tx
        .select({ slug: services.slug })
        .from(services)
        .where(eq(services.id, id))
        .limit(1)
        .for("update");
      if (!lockedService) throw new ServiceUserFacingError("ไม่พบบริการ");

      await tx
        .update(services)
        .set({
          archived,
          status: "draft",
          updatedAt: new Date(),
        })
        .where(eq(services.id, id));
      return lockedService;
    });

    revalidateMutation([service.slug], articleSlugs);
    return {};
  });
}

export async function deleteDraftServiceAction(
  id: string,
): Promise<ServiceActionResult> {
  return runAuthorizedServiceAction(requireAdmin, async () => {
    const articleSlugs = await listArticleSlugsForService(id);
    const service = await withDatabaseTransaction(async (tx) => {
      const [lockedService] = await tx
        .select({
          slug: services.slug,
          status: services.status,
          publishedAt: services.publishedAt,
          imagePublicId: services.imagePublicId,
        })
        .from(services)
        .where(eq(services.id, id))
        .limit(1)
        .for("update");
      if (!lockedService) throw new ServiceUserFacingError("ไม่พบบริการ");
      if (!canDeleteServicePermanently(lockedService)) {
        throw new ServiceUserFacingError(
          "ลบถาวรได้เฉพาะร่างที่ไม่เคยเผยแพร่",
        );
      }
      await lockServiceSlugs(tx, [lockedService.slug]);
      await tx.delete(services).where(eq(services.id, id));
      return lockedService;
    });

    revalidateMutation([service.slug], articleSlugs);
    await withTimeout(
      deleteCloudinaryImage(service.imagePublicId),
      2_000,
    ).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("cloudinary delete failed:", message);
    });
    return {};
  });
}
