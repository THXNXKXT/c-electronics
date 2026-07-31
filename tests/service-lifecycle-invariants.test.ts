import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertServiceSlugChangeConfirmed,
  getServicePublicationMutation,
  markServiceSlugChangeConfirmed,
  parseServiceSlugChangeConfirmation,
  requireServiceActionBoolean,
  resolveServiceCanonicalAfterSlugChange,
} from "../src/lib/services";

test("service lifecycle actions reject non-boolean runtime inputs", () => {
  for (const malformed of ["true", 1, null, undefined, {}, []]) {
    assert.throws(
      () => requireServiceActionBoolean(malformed, "การเผยแพร่"),
      /ต้องเป็นค่า true หรือ false/,
    );
  }

  assert.equal(requireServiceActionBoolean(true, "การเผยแพร่"), true);
  assert.equal(requireServiceActionBoolean(false, "การเก็บถาวร"), false);
});

test("a stale publish request cannot revive a service archived under its row lock", () => {
  const publishedAt = new Date("2026-07-31T03:00:00.000Z");
  const now = new Date("2026-08-01T04:00:00.000Z");

  assert.throws(
    () =>
      getServicePublicationMutation({
        publish: true,
        archived: true,
        publishedAt,
        now,
      }),
    /กู้คืนบริการก่อนเผยแพร่/,
  );

  assert.deepEqual(
    getServicePublicationMutation({
      publish: false,
      archived: true,
      publishedAt,
      now,
    }),
    { status: "draft", publishedAt, updatedAt: now },
  );
});

test("publication preserves first-publication history without changing archive state", () => {
  const now = new Date("2026-08-01T04:00:00.000Z");
  assert.deepEqual(
    getServicePublicationMutation({
      publish: true,
      archived: false,
      publishedAt: null,
      now,
    }),
    { status: "published", publishedAt: now, updatedAt: now },
  );
});

test("exported lifecycle actions validate runtime inputs before database work", async () => {
  const source = await readFile(
    new URL(
      "../src/app/admin/(protected)/services/actions.ts",
      import.meta.url,
    ),
    "utf8",
  );

  const publicationStart = source.indexOf(
    "export async function setServicePublicationAction",
  );
  const archiveStart = source.indexOf(
    "export async function setServiceArchivedAction",
  );
  const deletionStart = source.indexOf(
    "export async function deleteDraftServiceAction",
  );
  const publicationBody = source.slice(publicationStart, archiveStart);
  const archiveBody = source.slice(archiveStart, deletionStart);

  const publicationGuard = publicationBody.indexOf(
    "requireServiceActionBoolean",
  );
  const archiveGuard = archiveBody.indexOf("requireServiceActionBoolean");
  assert.ok(
    publicationGuard >= 0 &&
      publicationGuard < publicationBody.indexOf("listArticleSlugsForService"),
    "publication input must be validated before its first database query",
  );
  assert.ok(
    archiveGuard >= 0 &&
      archiveGuard < archiveBody.indexOf("listArticleSlugsForService"),
    "archive input must be validated before its first database query",
  );
  assert.match(
    publicationBody,
    /\.for\("update"\)[\s\S]*getServicePublicationMutation\([\s\S]*archived:\s*lockedService\.archived/,
  );
  assert.doesNotMatch(publicationBody, /archived:\s*publish\s*\?/);
});

test("slug-change confirmation binds normalized expected old and new slugs", () => {
  const formData = new FormData();
  assert.equal(parseServiceSlugChangeConfirmation(formData), null);

  formData.set("confirmSlugChange", "true");
  assert.throws(
    () => parseServiceSlugChangeConfirmation(formData),
    /ข้อมูลยืนยันการเปลี่ยน URL ไม่ถูกต้อง/,
  );

  markServiceSlugChangeConfirmed(formData, {
    expectedOldSlug: encodeURIComponent("บริการเดิม"),
    expectedNewSlug: "บริการใหม่",
  });
  assert.deepEqual(parseServiceSlugChangeConfirmation(formData), {
    expectedOldSlug: "บริการเดิม",
    expectedNewSlug: "บริการใหม่",
  });
});

test("malformed or unbounded slug-change confirmation fields reject", () => {
  const missing = new FormData();
  missing.set("confirmSlugChange", "confirmed");
  missing.set("expectedOldSlug", "บริการเดิม");
  assert.throws(
    () => parseServiceSlugChangeConfirmation(missing),
    /ข้อมูลยืนยันการเปลี่ยน URL ไม่ถูกต้อง/,
  );

  const oversized = new FormData();
  oversized.set("confirmSlugChange", "confirmed");
  oversized.set("expectedOldSlug", "ก".repeat(181));
  oversized.set("expectedNewSlug", "บริการใหม่");
  assert.throws(
    () => parseServiceSlugChangeConfirmation(oversized),
    /ข้อมูลยืนยันการเปลี่ยน URL ไม่ถูกต้อง/,
  );
});

test("post-publication slug changes require the exact locked transition", () => {
  const publishedAt = new Date("2026-07-31T03:00:00.000Z");
  const confirmation = {
    expectedOldSlug: "ติดตั้งจานดาวเทียม",
    expectedNewSlug: "ติดตั้งจานดาวเทียม-เชียงราย",
  };

  assert.throws(
    () =>
      assertServiceSlugChangeConfirmed({
        previousSlug: "ติดตั้งจานดาวเทียม",
        nextSlug: "ติดตั้งจานดาวเทียม-เชียงราย",
        publishedAt,
        confirmation: null,
      }),
    /ยืนยันการเปลี่ยน URL/,
  );

  assert.doesNotThrow(() =>
    assertServiceSlugChangeConfirmed({
      previousSlug: "ติดตั้งจานดาวเทียม",
      nextSlug: "ติดตั้งจานดาวเทียม-เชียงราย",
      publishedAt,
      confirmation,
    }),
  );
  assert.doesNotThrow(() =>
    assertServiceSlugChangeConfirmed({
      previousSlug: "ร่างเดิม",
      nextSlug: "ร่างใหม่",
      publishedAt: null,
      confirmation: null,
    }),
  );
});

test("stale, queued, and replayed confirmations cannot authorize another slug transition", () => {
  const publishedAt = new Date("2026-07-31T03:00:00.000Z");
  const requestB = {
    expectedOldSlug: "บริการเดิม",
    expectedNewSlug: "บริการ-b",
  };

  assert.doesNotThrow(() =>
    assertServiceSlugChangeConfirmed({
      previousSlug: "บริการเดิม",
      nextSlug: "บริการ-b",
      publishedAt,
      confirmation: requestB,
    }),
  );
  assert.throws(
    () =>
      assertServiceSlugChangeConfirmed({
        previousSlug: "บริการ-a",
        nextSlug: "บริการ-b",
        publishedAt,
        confirmation: requestB,
      }),
    /ข้อมูลบริการเปลี่ยนแปลงแล้ว/,
  );
  assert.doesNotThrow(() =>
    assertServiceSlugChangeConfirmed({
      previousSlug: "บริการ-b",
      nextSlug: "บริการ-b",
      publishedAt,
      confirmation: null,
    }),
  );
  assert.throws(
    () =>
      assertServiceSlugChangeConfirmed({
        previousSlug: "บริการ-b",
        nextSlug: "บริการ-b",
        publishedAt,
        confirmation: requestB,
      }),
    /ข้อมูลบริการเปลี่ยนแปลงแล้ว/,
  );
  assert.throws(
    () =>
      assertServiceSlugChangeConfirmed({
        previousSlug: "บริการเดิม",
        nextSlug: "บริการ-c",
        publishedAt,
        confirmation: requestB,
      }),
    /ข้อมูลบริการเปลี่ยนแปลงแล้ว/,
  );
});

test("publish then unpublish still requires rename confirmation without redirect history", () => {
  const firstPublishedAt = new Date("2026-07-31T03:00:00.000Z");
  const unpublished = getServicePublicationMutation({
    publish: false,
    archived: false,
    publishedAt: firstPublishedAt,
    now: new Date("2026-08-01T04:00:00.000Z"),
  });

  assert.equal(unpublished.status, "draft");
  assert.equal(unpublished.publishedAt, firstPublishedAt);
  assert.throws(
    () =>
      assertServiceSlugChangeConfirmed({
        previousSlug: "บริการเดิม",
        nextSlug: "บริการใหม่",
        publishedAt: unpublished.publishedAt,
        confirmation: null,
      }),
    /ยืนยันการเปลี่ยน URL/,
  );
});

test("update action enforces slug confirmation against the locked database row", async () => {
  const source = await readFile(
    new URL(
      "../src/app/admin/(protected)/services/actions.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const updateStart = source.indexOf("export async function updateServiceAction");
  const publicationStart = source.indexOf(
    "export async function setServicePublicationAction",
  );
  const updateBody = source.slice(updateStart, publicationStart);

  assert.match(updateBody, /parseServiceSlugChangeConfirmation\(formData\)/);
  assert.match(
    updateBody,
    /\.for\("update"\)[\s\S]*assertServiceSlugChangeConfirmed\([\s\S]*publishedAt:\s*lockedService\.publishedAt[\s\S]*confirmation:\s*slugChangeConfirmation[\s\S]*if \(slugChanged\)/,
  );
});

test("slug modal marks one captured current FormData intent and blocks repeats", async () => {
  const source = await readFile(
    new URL(
      "../src/app/admin/(protected)/services/service-form.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(source, /slugConfirmationSubmittingRef\s*=\s*useRef\(false\)/);
  assert.match(source, /canSubmitServiceSlugChangeConfirmation\(/);
  assert.match(
    source,
    /expectedOldSlug:\s*service\.slug[\s\S]*expectedNewSlug:\s*nextSlug/,
  );
  assert.match(
    source,
    /markServiceSlugChangeConfirmed\(saveRequest\.formData,\s*\{[\s\S]*expectedOldSlug:\s*saveRequest\.expectedOldSlug[\s\S]*expectedNewSlug:\s*saveRequest\.expectedNewSlug/,
  );
  assert.match(
    source,
    /save\(\s*saveRequest\.formData,\s*saveRequest\.revision,[\s\S]*slugConfirmationSubmittingRef\.current = false[\s\S]*router\.refresh\(\)/,
  );
});

test("slug rename clears encoded same-site canonicals that target the old self URL", () => {
  const previousSlug = "ติดตั้งจานดาวเทียม";
  const canonicalUrl = `https://www.c-electronics.online/services/${encodeURIComponent(previousSlug)}?source=old#top`;

  assert.equal(
    resolveServiceCanonicalAfterSlugChange({
      canonicalUrl,
      previousSlug,
      nextSlug: "ติดตั้งจานดาวเทียม-เชียงราย",
      historicalSlugs: [],
    }),
    null,
  );
  assert.equal(
    resolveServiceCanonicalAfterSlugChange({
      canonicalUrl: `/services/${encodeURIComponent(previousSlug)}/`,
      previousSlug,
      nextSlug: "ติดตั้งจานดาวเทียม-เชียงราย",
      historicalSlugs: [],
    }),
    null,
  );
});

test("historical self canonicals normalize to the current slug while custom canonicals remain", () => {
  assert.equal(
    resolveServiceCanonicalAfterSlugChange({
      canonicalUrl: "/services/จานดาวเทียม－เชียงราย",
      previousSlug: "ติดตั้งจานดาวเทียม-เชียงราย",
      nextSlug: "ติดตั้งจานดาวเทียม-เชียงราย",
      historicalSlugs: ["จานดาวเทียม-เชียงราย"],
    }),
    null,
  );

  assert.equal(
    resolveServiceCanonicalAfterSlugChange({
      canonicalUrl: "/services/บริการดาวเทียม-หลัก",
      previousSlug: "ติดตั้งจานดาวเทียม",
      nextSlug: "ติดตั้งจานดาวเทียม-เชียงราย",
      historicalSlugs: ["จานดาวเทียม"],
    }),
    "https://www.c-electronics.online/services/%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%94%E0%B8%B2%E0%B8%A7%E0%B9%80%E0%B8%97%E0%B8%B5%E0%B8%A2%E0%B8%A1-%E0%B8%AB%E0%B8%A5%E0%B8%B1%E0%B8%81",
  );
});

test("update transaction migrates canonical overrides using locked slug history", async () => {
  const source = await readFile(
    new URL(
      "../src/app/admin/(protected)/services/actions.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const updateStart = source.indexOf("export async function updateServiceAction");
  const publicationStart = source.indexOf(
    "export async function setServicePublicationAction",
  );
  const updateBody = source.slice(updateStart, publicationStart);

  assert.match(
    updateBody,
    /\.for\("update"\)[\s\S]*serviceSlugRedirects\.serviceId[\s\S]*resolveServiceCanonicalAfterSlugChange\(/,
  );
  assert.match(updateBody, /historicalSlugs:\s*historicalRedirects\.map/);
  assert.match(
    updateBody,
    /\.set\(\{[\s\S]*canonicalUrl:\s*resolvedCanonicalUrl[\s\S]*updatedAt:\s*now/,
  );
});
