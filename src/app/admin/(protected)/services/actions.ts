"use server";

import { db } from "@/db";
import { services, serviceSlugRedirects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import { revalidateServicePages } from "@/lib/revalidate-service-pages";
import { parseServiceInput } from "@/lib/service-input";
import { listArticleSlugsForService } from "@/lib/service-queries";
import { canDeleteServicePermanently } from "@/lib/services";
import { textFromArticleNode } from "@/lib/articles";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type QueryExecutor = Pick<typeof db, "select">;

async function assertUniqueServiceSlug(
  slug: string,
  excludedId?: string,
  executor: QueryExecutor = db,
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
    throw new Error("Slug นี้ถูกใช้งานแล้วหรือเป็น URL เดิมของบริการ");
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
): Promise<{ id: string; slug: string }> {
  await requireAdmin();
  const input = parseServiceInput(formData);
  await assertUniqueServiceSlug(input.slug);
  const id = crypto.randomUUID();

  await db.insert(services).values({
    id,
    ...input,
    status: "draft",
  });

  revalidateMutation([input.slug], []);
  return { id, slug: input.slug };
}

export async function updateServiceAction(
  id: string,
  formData: FormData,
): Promise<{ id: string; slug: string }> {
  await requireAdmin();
  const articleSlugs = await listArticleSlugsForService(id);
  const input = parseServiceInput(formData);
  const [current] = await db
    .select({
      id: services.id,
      slug: services.slug,
      publishedAt: services.publishedAt,
    })
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  if (!current) throw new Error("ไม่พบบริการ");

  const slugChanged = current.slug !== input.slug;
  const now = new Date();

  if (slugChanged && current.publishedAt) {
    await db.transaction(async (tx) => {
      await assertUniqueServiceSlug(input.slug, id, tx);
      await tx.insert(serviceSlugRedirects).values({
        serviceId: id,
        slug: current.slug,
      });
      await tx
        .update(services)
        .set({ ...input, updatedAt: now })
        .where(eq(services.id, id));
    });
  } else {
    if (slugChanged) await assertUniqueServiceSlug(input.slug, id);
    await db
      .update(services)
      .set({ ...input, updatedAt: now })
      .where(eq(services.id, id));
  }

  revalidateMutation(
    slugChanged ? [current.slug, input.slug] : [current.slug],
    articleSlugs,
  );
  return { id, slug: input.slug };
}

export async function setServicePublicationAction(
  id: string,
  publish: boolean,
): Promise<void> {
  await requireAdmin();
  const articleSlugs = await listArticleSlugsForService(id);
  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  if (!service) throw new Error("ไม่พบบริการ");

  if (publish) {
    const bodyText = (service.content.content ?? [])
      .map(textFromArticleNode)
      .join(" ")
      .trim();

    if (bodyText.length < 600) {
      throw new Error(
        "เนื้อหายังสั้นเกินไปสำหรับเผยแพร่ (อย่างน้อย 600 ตัวอักษร)",
      );
    }
    if (!service.description?.trim()) {
      throw new Error("กรุณาระบุคำอธิบายบริการก่อนเผยแพร่");
    }
    if (service.processSteps.length === 0) {
      throw new Error("กรุณาระบุขั้นตอนบริการอย่างน้อย 1 ขั้นตอนก่อนเผยแพร่");
    }
    if (service.image && !service.imageAlt?.trim()) {
      throw new Error("กรุณาใส่ alt text ของรูปบริการก่อนเผยแพร่");
    }
  }

  const now = new Date();
  await db
    .update(services)
    .set({
      status: publish ? "published" : "draft",
      publishedAt: publish ? service.publishedAt ?? now : service.publishedAt,
      archived: publish ? false : service.archived,
      updatedAt: now,
    })
    .where(eq(services.id, id));

  revalidateMutation([service.slug], articleSlugs);
}

export async function setServiceArchivedAction(
  id: string,
  archived: boolean,
): Promise<void> {
  await requireAdmin();
  const articleSlugs = await listArticleSlugsForService(id);
  const [service] = await db
    .select({ slug: services.slug })
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  if (!service) throw new Error("ไม่พบบริการ");

  await db
    .update(services)
    .set({
      archived,
      status: "draft",
      updatedAt: new Date(),
    })
    .where(eq(services.id, id));

  revalidateMutation([service.slug], articleSlugs);
}

export async function deleteDraftServiceAction(id: string): Promise<void> {
  await requireAdmin();
  const articleSlugs = await listArticleSlugsForService(id);
  const [service] = await db
    .select({
      slug: services.slug,
      status: services.status,
      publishedAt: services.publishedAt,
      imagePublicId: services.imagePublicId,
    })
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  if (!service) throw new Error("ไม่พบบริการ");
  if (!canDeleteServicePermanently(service)) {
    throw new Error("ลบถาวรได้เฉพาะร่างที่ไม่เคยเผยแพร่");
  }

  await db.delete(services).where(eq(services.id, id));
  await deleteCloudinaryImage(service.imagePublicId).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("cloudinary delete failed:", message);
  });

  revalidateMutation([service.slug], articleSlugs);
}
