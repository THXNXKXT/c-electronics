import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  isValidArticleDocument,
  textFromArticleNode,
} from "../src/lib/articles";
import {
  applyServiceSeedUpdate,
  buildServiceSeedUpdate,
  normalizeServiceSeedSlug,
  planServiceDraftSeeds,
  serviceDraftSeeds,
  serviceSeedNeedsUpdate,
  validateSeededService,
  type ServiceSeedCandidate,
} from "../src/lib/service-seed-data";

const expectedKeys = [
  "air",
  "cctv",
  "electrical",
  "satellite",
  "appliance",
  "parts",
];

const expectedSafetyThemes: Record<string, string[]> = {
  air: ["วงจรไฟฟ้าเฉพาะ", "ความลาดเอียง", "สารทำความเย็น", "เครื่องมือ"],
  cctv: ["พื้นที่ส่วนตัว", "รหัสผ่าน", "ระยะเวลาเก็บภาพ"],
  electrical: ["ตัดแหล่งจ่าย", "ตู้ไฟที่ยังมีไฟ", "RCD", "สายดิน"],
  satellite: ["ป้องกันการตก", "ฟ้าผ่า", "ฝนตก", "ลมแรง"],
  appliance: ["ถอดปลั๊ก", "คาปาซิเตอร์", "ความร้อน", "ชิ้นส่วนเคลื่อนที่", "อายุเครื่อง"],
  parts: ["เบอร์อะไหล่", "พิกัดไฟฟ้า", "ขั้ว", "ทดแทน", "หยุด"],
};

const expectedAltSubjects: Record<string, string[]> = {
  air: ["ช่าง", "ถุงมือ", "เครื่องปรับอากาศแบบติดผนัง", "ตรวจ"],
  cctv: ["ช่าง", "บันได", "กล้องโดม", "ชายคา", "ติดตั้ง"],
  electrical: ["ตู้เบรกเกอร์", "อุปกรณ์ตัดวงจร"],
  satellite: ["จานดาวเทียม", "หัวรับ", "ดาดฟ้า"],
  appliance: ["แผงวงจร", "หัวแร้ง", "มัลติมิเตอร์"],
  parts: ["อะไหล่อิเล็กทรอนิกส์", "สายไฟ", "เครื่องมือวัด"],
};

function plainText(seed: (typeof serviceDraftSeeds)[number]): string {
  return (seed.content.content ?? []).map(textFromArticleNode).join(" ");
}

function candidate(
  id: string,
  name: string,
  slug = name,
  overrides: Partial<ServiceSeedCandidate> = {},
): ServiceSeedCandidate {
  return {
    id,
    name,
    slug,
    description: "ข้อมูลเดิม",
    imageAlt: null,
    features: "เดิม",
    content: { type: "doc", content: [{ type: "paragraph", content: [] }] },
    processSteps: [],
    faqs: [],
    seoTitle: null,
    seoDescription: null,
    status: "draft",
    publishedAt: null,
    price: "1,000",
    image: "/images/original.webp",
    imagePublicId: "service/original",
    icon: "Wrench",
    featured: true,
    archived: false,
    canonicalUrl: "/services/custom",
    noIndex: true,
    ...overrides,
  };
}

const sixCandidates = (): ServiceSeedCandidate[] => [
  candidate("air-id", "ติดตั้งแอร์"),
  candidate("cctv-id", "กล้องวงจรปิด"),
  candidate("electrical-id", "ระบบไฟฟ้าบ้าน"),
  candidate("satellite-id", "งานจานดาวเทียม"),
  candidate("appliance-id", "ซ่อมเครื่องใช้ไฟฟ้า"),
  candidate("parts-id", "อะไหล่อิเล็กทรอนิกส์"),
];

test("ships exactly six distinct, substantial, valid Thai service drafts", () => {
  assert.deepEqual(serviceDraftSeeds.map((seed) => seed.key), expectedKeys);
  assert.equal(new Set(serviceDraftSeeds.map((seed) => seed.slug)).size, 6);
  assert.equal(new Set(serviceDraftSeeds.map((seed) => seed.description)).size, 6);
  assert.equal(new Set(serviceDraftSeeds.map((seed) => plainText(seed))).size, 6);

  for (const seed of serviceDraftSeeds) {
    const text = plainText(seed);
    assert.ok(text.length >= 900, `${seed.key} content is too short`);
    assert.ok(isValidArticleDocument(seed.content), `${seed.key} content is invalid`);
    assert.ok((seed.content.content ?? []).filter((node) => node.type === "heading").length >= 7);
    assert.ok(seed.features.length >= 4, `${seed.key} needs highlights`);
    assert.ok(seed.processSteps.length >= 4, `${seed.key} needs process steps`);
    assert.ok(seed.faqs.length >= 3, `${seed.key} needs FAQs`);
    assert.equal(new Set(seed.features).size, seed.features.length);
    assert.equal(new Set(seed.processSteps.map((step) => step.title)).size, seed.processSteps.length);
    assert.equal(new Set(seed.faqs.map((faq) => faq.question)).size, seed.faqs.length);
    assert.ok(seed.imageAlt.length >= 20, `${seed.key} needs descriptive image alt`);
    assert.doesNotMatch(seed.imageAlt, /เชียงราย/);
    if (seed.key !== "air" && seed.key !== "cctv") {
      assert.doesNotMatch(seed.imageAlt, /ช่าง|เทคนิค|บุคคล/);
    }
    for (const subject of expectedAltSubjects[seed.key]) {
      assert.ok(seed.imageAlt.includes(subject), `${seed.key} alt is missing: ${subject}`);
    }
    assert.ok(seed.seoTitle.length >= 20 && seed.seoTitle.length <= 65);
    assert.ok(seed.seoDescription.length >= 80 && seed.seoDescription.length <= 160);
    assert.match(seed.seoTitle, /เชียงราย/);
    assert.match(seed.seoDescription, /เชียงราย/);

    for (const theme of expectedSafetyThemes[seed.key]) {
      assert.ok(text.includes(theme), `${seed.key} is missing safety theme: ${theme}`);
    }

    assert.ok(seed.faqs.some((faq) => /ราคา|ค่าใช้จ่าย/.test(faq.question)));
    assert.ok(seed.faqs.some((faq) => /เวลา|เตรียม/.test(faq.question)));
    const warranty = seed.faqs.find((faq) => /รับประกัน|หลังบริการ/.test(faq.question));
    assert.ok(warranty, `${seed.key} needs a warranty/after-service FAQ`);
    assert.match(warranty.answer, /ยืนยันกับทางร้าน/);
    assert.doesNotMatch(text, /รับประกัน\s*\d+|การันตี|รับรองผล/);
  }
});

function reorderObjectKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reorderObjectKeysDeep);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .reverse()
      .map(([key, child]) => [key, reorderObjectKeysDeep(child)]),
  );
}

test("compares PostgreSQL jsonb values semantically despite nested key reordering", () => {
  const seed = serviceDraftSeeds[0];
  const seeded = applyServiceSeedUpdate(sixCandidates()[0], seed);
  const reordered = {
    ...seeded,
    content: reorderObjectKeysDeep(seeded.content) as typeof seeded.content,
    processSteps: reorderObjectKeysDeep(seeded.processSteps) as typeof seeded.processSteps,
    faqs: reorderObjectKeysDeep(seeded.faqs) as typeof seeded.faqs,
  };

  assert.equal(JSON.stringify(reordered.content) === JSON.stringify(seeded.content), false);
  assert.equal(serviceSeedNeedsUpdate(reordered, seed), false);
  assert.deepEqual(validateSeededService(reordered, seed), []);
});

test("normalizes service seed slugs once for planner and verifier semantics", () => {
  assert.equal(normalizeServiceSeedSlug("  บริการ   Ａ－TEST  "), "บริการ a-test");
  assert.equal(normalizeServiceSeedSlug("อะไหล่\u0065\u0301"), normalizeServiceSeedSlug("อะไหล่é"));
});

test("matches all six services once, preferring the most specific Thai match", () => {
  const plan = planServiceDraftSeeds(sixCandidates(), []);
  assert.deepEqual(plan.map((entry) => entry.seed.key), expectedKeys);
  assert.equal(new Set(plan.map((entry) => entry.service.id)).size, 6);
  assert.equal(plan.find((entry) => entry.seed.key === "electrical")?.service.id, "electrical-id");
  assert.equal(plan.find((entry) => entry.seed.key === "appliance")?.service.id, "appliance-id");
});

test("fails before writing on missing, duplicate, ambiguous, published, or reserved targets", () => {
  assert.throws(
    () => planServiceDraftSeeds(sixCandidates().slice(0, 5), []),
    /parts|ไม่พบบริการ/,
  );
  assert.throws(
    () => planServiceDraftSeeds([...sixCandidates(), candidate("air-2", "ล้างแอร์")], []),
    /มากกว่าหนึ่งรายการ|ซ้ำ/,
  );
  assert.throws(
    () => planServiceDraftSeeds([...sixCandidates(), candidate("ambiguous", "กล้อง CCTV")], []),
    /มากกว่าหนึ่งรายการ|ซ้ำ/,
  );
  assert.throws(
    () => planServiceDraftSeeds(sixCandidates().map((row) =>
      row.id === "air-id" ? { ...row, publishedAt: new Date("2025-01-01") } : row,
    ), []),
    /เคยเผยแพร่/,
  );
  assert.throws(
    () => planServiceDraftSeeds(sixCandidates(), [{ serviceId: "old", slug: serviceDraftSeeds[0].slug }]),
    /URL เดิม|redirect/,
  );
  assert.throws(
    () => planServiceDraftSeeds(sixCandidates(), [{
      serviceId: "old",
      slug: `  ${serviceDraftSeeds[0].slug.replace("-", "－")}  `,
    }]),
    /URL เดิม|redirect/,
  );
  assert.throws(
    () => planServiceDraftSeeds(sixCandidates().map((row) =>
      row.id === "cctv-id" ? { ...row, slug: serviceDraftSeeds[0].slug } : row,
    ), []),
    /Slug|ถูกใช้/,
  );
});

test("rejects duplicate normalized current slugs in every row order", () => {
  const duplicateA = candidate("extra-a", "บริการทั่วไป", "  บริการ   Ａ－TEST  ");
  const duplicateB = candidate("extra-b", "งานทั่วไป", "บริการ a-test");
  for (const extras of [[duplicateA, duplicateB], [duplicateB, duplicateA]]) {
    assert.throws(
      () => planServiceDraftSeeds([...sixCandidates(), ...extras], []),
      /Slug ปัจจุบันซ้ำ/,
    );
  }

  assert.doesNotThrow(() => planServiceDraftSeeds([
    ...sixCandidates(),
    duplicateA,
    candidate("extra-c", "งานทั่วไป", "บริการ b-test"),
  ], []));
  assert.throws(
    () => planServiceDraftSeeds(
      [...sixCandidates(), duplicateA],
      [{ serviceId: "historical", slug: "บริการ a-test" }],
    ),
    /Slug ปัจจุบันซ้ำกับ URL เดิม/,
  );
});

test("seeder locks rows deterministically before slugs and revalidates after advisory locks", () => {
  const source = readFileSync("scripts/seed-services.ts", "utf8");
  assert.match(source, /orderBy\(asc\(services\.id\)\)[\s\S]*?\.for\("update"\)/);
  assert.match(
    source,
    /const initiallyLockedCandidates = await lockServiceRows\(tx\)[\s\S]*?const initialPlan = planServiceDraftSeeds[\s\S]*?await lockServiceSlugs[\s\S]*?const candidates = await lockServiceRows\(tx\)[\s\S]*?const plan = planServiceDraftSeeds/,
  );
});

test("seed update is idempotent and preserves operational, media, and SEO-control fields", () => {
  const original = sixCandidates()[0];
  const seed = serviceDraftSeeds[0];
  const update = buildServiceSeedUpdate(seed);
  assert.deepEqual(Object.keys(update).sort(), [
    "content",
    "description",
    "faqs",
    "features",
    "imageAlt",
    "processSteps",
    "publishedAt",
    "seoDescription",
    "seoTitle",
    "slug",
    "status",
  ].sort());
  assert.equal(update.status, "draft");
  assert.equal(update.publishedAt, null);

  const once = applyServiceSeedUpdate(original, seed);
  const twice = applyServiceSeedUpdate(once, seed);
  assert.deepEqual(twice, once);
  assert.equal(serviceSeedNeedsUpdate(once, seed), false);
  assert.equal(serviceSeedNeedsUpdate(original, seed), true);

  for (const field of [
    "price",
    "image",
    "imagePublicId",
    "icon",
    "featured",
    "archived",
    "canonicalUrl",
    "noIndex",
  ] as const) {
    assert.equal(once[field], original[field], `${field} must be preserved`);
  }
});

test("verification checks the actual seeded fields and draft lifecycle", () => {
  const seeded = applyServiceSeedUpdate(sixCandidates()[0], serviceDraftSeeds[0]);
  assert.deepEqual(validateSeededService(seeded, serviceDraftSeeds[0]), []);
  assert.ok(validateSeededService({ ...seeded, status: "published" }, serviceDraftSeeds[0]).length > 0);
  assert.ok(validateSeededService({ ...seeded, description: "ผิด" }, serviceDraftSeeds[0]).length > 0);
  assert.ok(validateSeededService({ ...seeded, features: "ผิด" }, serviceDraftSeeds[0]).length > 0);
  assert.ok(validateSeededService({ ...seeded, content: { type: "doc", content: [] } }, serviceDraftSeeds[0]).length > 0);
});
