# Service Detail Pages and Service CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build draftable Thai service detail pages and a complete service CMS with safe Rich Text, structured process/FAQ content, permanent slug redirects, metadata, JSON-LD, internal links, and sitemap support.

**Architecture:** Extend the existing `services` table with publication and content fields, reserve former slugs in a child table, and place validation/SEO/URL rules in pure domain modules. Server query helpers feed both public and administrator routes; public and preview routes share one presentation component, while all mutations remain authenticated server actions.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Drizzle ORM 0.45, Neon PostgreSQL, Tiptap 3, Cloudinary uploads, Tailwind CSS 4, Node test runner.

## Global Constraints

- Existing non-archived service cards must remain public while their new detail content is draft.
- New and migrated service details start as `draft`; saving never publishes implicitly.
- Main content uses the existing allowlisted Tiptap JSON format; arbitrary HTML and scripts are forbidden.
- Process steps and FAQs use bounded structured JSON arrays.
- A former published slug is permanently reserved and redirects to the current public slug.
- Use Next.js `permanentRedirect()`, which returns HTTP 308 in App Router; 308 is the framework-supported permanent equivalent of 301 and is treated as a permanent canonical signal.
- Only published, non-archived, non-`noIndex` service details enter sitemap.
- Canonical overrides are limited to paths or HTTPS URLs on `https://www.c-electronics.online`.
- All consequential state changes and post-publication slug changes require the shared confirmation modal.
- The six existing service detail drafts must not be published automatically.
- Do not create district/location landing pages, scheduling, comments, author pages, or indexable taxonomy pages.

---

## File Map

### Domain and database

- Create `src/lib/services.ts`: service types, slug normalization, SEO resolution, indexability, structured-data construction, delete rules, and revalidation paths.
- Create `src/lib/service-confirmations.ts`: modal copy for publication/archive/delete/slug-change actions.
- Create `src/lib/service-input.ts`: pure `FormData` parser and bounded validation.
- Create `src/lib/service-queries.ts`: all public/admin/redirect/sitemap service reads.
- Modify `src/db/schema.ts`: service columns, enum, redirect-history table, and indexes.
- Create `drizzle/0001_service_details.sql`: additive migration generated from the schema.
- Create `drizzle/meta/0001_snapshot.json`: Drizzle schema snapshot generated with the migration.
- Modify `drizzle/meta/_journal.json`: register migration 0001.

### Administration

- Replace `src/app/admin/(protected)/services/actions-client.ts` with `src/app/admin/(protected)/services/actions.ts`.
- Replace `src/app/admin/(protected)/services/client.tsx` with focused list/form components.
- Create `src/app/admin/(protected)/services/service-form.tsx`.
- Create `src/app/admin/(protected)/services/service-quick-create.tsx`.
- Create `src/app/admin/(protected)/services/service-row-actions.tsx`.
- Modify `src/app/admin/(protected)/services/page.tsx`.
- Modify `src/app/admin/(protected)/services/[id]/edit/page.tsx`.
- Delete `src/app/admin/(protected)/services/[id]/edit/client.tsx` after the shared form is wired.
- Create `src/app/admin/(protected)/services/[id]/preview/page.tsx`.

### Public pages and integration

- Create `src/components/service-detail.tsx`: shared visible service presentation.
- Create `src/app/(public)/services/[slug]/page.tsx`: public route, metadata, and permanent redirect.
- Modify `src/app/(public)/services/page.tsx` and `services-client.tsx`.
- Modify `src/app/(public)/page.tsx` and `home-client.tsx`.
- Modify `src/app/(public)/articles/[slug]/page.tsx` and `src/lib/article-queries.ts`.
- Modify `src/app/(public)/booking/page.tsx` and `booking-client.tsx`.
- Modify `src/app/sitemap.ts`, `src/lib/sitemap-entries.ts`, and `src/lib/revalidate-service-pages.ts`.

### Seed and verification

- Create `src/lib/service-seed-data.ts`: six deterministic Thai service drafts.
- Create `scripts/seed-services.ts`: update matching existing services without publishing.
- Create `scripts/verify-services.ts`: verify six populated drafts and redirect/schema invariants.
- Modify `package.json`: add seed and verification scripts.
- Create `tests/services.test.ts`, `tests/service-schema.test.ts`, `tests/service-form.test.ts`, `tests/service-create-panel.test.ts`, and `tests/service-seed-data.test.ts`.
- Modify `tests/sitemap.test.ts` and `tests/service-cache.test.ts`.

---

### Task 1: Service Domain Rules and Confirmations

**Files:**
- Create: `tests/services.test.ts`
- Create: `src/lib/services.ts`
- Create: `src/lib/service-confirmations.ts`

**Interfaces:**
- Produces: `ServiceStatus`, `ServiceProcessStep`, `ServiceFaq`, `ServiceSeoInput`, `slugifyServiceName()`, `normalizeServiceRouteSlug()`, `isIndexableService()`, `resolveServiceSeo()`, `canDeleteServicePermanently()`, `buildServiceStructuredData()`, `getServiceRevalidationPaths()`, and `getServiceConfirmation()`.
- Consumes: `ArticleDocument`, `sanitizeCanonical()`, and `SITE_URL` from `src/lib/articles.ts`.

- [ ] **Step 1: Write failing domain tests**

```ts
// tests/services.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildServiceStructuredData,
  canDeleteServicePermanently,
  getServiceRevalidationPaths,
  isIndexableService,
  normalizeServiceRouteSlug,
  resolveServiceSeo,
  slugifyServiceName,
} from "../src/lib/services";
import { getServiceConfirmation } from "../src/lib/service-confirmations";

test("normalizes Thai service slugs", () => {
  assert.equal(slugifyServiceName(" ติดตั้ง จานดาวเทียม! "), "ติดตั้ง-จานดาวเทียม");
  assert.equal(normalizeServiceRouteSlug(encodeURIComponent("ติดตั้งแอร์")), "ติดตั้งแอร์");
  assert.equal(slugifyServiceName("###"), "service");
});

test("only public indexable services enter search", () => {
  assert.equal(isIndexableService({ status: "published", archived: false, noIndex: false }), true);
  assert.equal(isIndexableService({ status: "draft", archived: false, noIndex: false }), false);
  assert.equal(isIndexableService({ status: "published", archived: true, noIndex: false }), false);
  assert.equal(isIndexableService({ status: "published", archived: false, noIndex: true }), false);
});

test("resolves service SEO and safe canonical", () => {
  assert.deepEqual(resolveServiceSeo({
    name: "ติดตั้งกล้องวงจรปิด เชียงราย",
    slug: "ติดตั้งกล้องวงจรปิด-เชียงราย",
    description: "ออกแบบและติดตั้งระบบกล้องวงจรปิดสำหรับบ้านและธุรกิจในเชียงราย",
    status: "published",
    archived: false,
    noIndex: false,
    canonicalUrl: "/services/cctv-chiangrai",
  }), {
    title: "ติดตั้งกล้องวงจรปิด เชียงราย",
    description: "ออกแบบและติดตั้งระบบกล้องวงจรปิดสำหรับบ้านและธุรกิจในเชียงราย",
    canonical: "https://www.c-electronics.online/services/cctv-chiangrai",
    indexable: true,
  });
});

test("builds visible Service, Breadcrumb, and FAQ structured data", () => {
  const data = buildServiceStructuredData({
    name: "ติดตั้งจานดาวเทียม",
    slug: "ติดตั้งจานดาวเทียม",
    description: "ติดตั้งและตรวจสัญญาณจานดาวเทียม",
    image: null,
    price: "เริ่มต้น 1,200 ฿",
    faqs: [{ question: "ฝนตกแล้วสัญญาณหายเกิดจากอะไร", answer: "ควรตรวจแนวรับสัญญาณและจุดต่อสายโดยช่าง" }],
    updatedAt: new Date("2026-07-31T10:00:00Z"),
  });
  assert.deepEqual(data.map((item) => item["@type"]), ["Service", "BreadcrumbList", "FAQPage"]);
});

test("protects published history and revalidates all consumers", () => {
  assert.equal(canDeleteServicePermanently({ status: "draft", publishedAt: null }), true);
  assert.equal(canDeleteServicePermanently({ status: "draft", publishedAt: new Date() }), false);
  assert.deepEqual(getServiceRevalidationPaths(["old-slug", "new-slug"], ["cctv-guide"]), [
    "/admin/services", "/", "/services", "/booking", "/articles", "/sitemap.xml",
    "/services/old-slug", "/services/new-slug", "/articles/cctv-guide",
  ]);
  assert.equal(getServiceConfirmation("publish", "ติดตั้งแอร์").confirmLabel, "เผยแพร่");
  assert.equal(getServiceConfirmation("slug-change", "ติดตั้งแอร์").variant, "warning");
});
```

- [ ] **Step 2: Run the tests and verify the red state**

Run: `node --import tsx --test tests/services.test.ts`

Expected: FAIL with module-not-found errors for `src/lib/services.ts` and `service-confirmations.ts`.

- [ ] **Step 3: Implement the pure service domain**

```ts
// src/lib/services.ts — exported surface
export type ServiceStatus = "draft" | "published";
export type ServiceProcessStep = { title: string; description: string };
export type ServiceFaq = { question: string; answer: string };
export type ServiceSeoInput = {
  name: string; slug: string; description: string | null;
  status: ServiceStatus; archived: boolean; noIndex: boolean;
  seoTitle?: string | null; seoDescription?: string | null; canonicalUrl?: string | null;
};

export function slugifyServiceName(input: string): string;
export function normalizeServiceRouteSlug(input: string): string;
export function isIndexableService(input: {
  status: ServiceStatus; archived: boolean; noIndex: boolean;
}): boolean;
export function resolveServiceSeo(input: ServiceSeoInput): {
  title: string; description: string; canonical: string; indexable: boolean;
};
export function canDeleteServicePermanently(input: {
  status: ServiceStatus; publishedAt: Date | null;
}): boolean;
export function buildServiceStructuredData(input: {
  name: string; slug: string; description: string | null; image: string | null;
  price: string | null; faqs: ServiceFaq[]; updatedAt: Date;
}): Array<Record<string, unknown>>;
export function getServiceRevalidationPaths(slugs?: string[], articleSlugs?: string[]): string[];
```

Implement slug behavior with Unicode NFKC and the same `\p{Letter}\p{Number}\p{Mark}` allowlist as articles. Use `sanitizeCanonical()` for overrides, clip descriptions to 160 characters, use `SITE_URL`, and omit `FAQPage` entirely when `faqs` is empty.

```ts
// src/lib/service-confirmations.ts
export type ServiceConfirmationAction =
  | "publish" | "unpublish" | "archive" | "restore" | "delete" | "slug-change";

export function getServiceConfirmation(action: ServiceConfirmationAction, name: string) {
  const copy = {
    publish: ["เผยแพร่บริการ", `เผยแพร่ “${name}” บนเว็บไซต์หรือไม่?`, "เผยแพร่", "primary"],
    unpublish: ["ยกเลิกเผยแพร่", `นำรายละเอียด “${name}” ออกจากเว็บไซต์หรือไม่?`, "ยกเลิกเผยแพร่", "warning"],
    archive: ["เก็บบริการถาวร", `เก็บ “${name}” เข้าคลังหรือไม่? บริการจะถูกซ่อนจากเว็บไซต์ด้วย`, "เก็บถาวร", "warning"],
    restore: ["นำบริการกลับมา", `นำ “${name}” กลับมาเป็นฉบับร่างหรือไม่?`, "นำกลับมา", "primary"],
    delete: ["ลบร่างบริการ", `ลบร่าง “${name}” ถาวรหรือไม่? การทำรายการนี้ย้อนกลับไม่ได้`, "ลบร่าง", "danger"],
    "slug-change": ["เปลี่ยน URL บริการ", `เปลี่ยน URL ของ “${name}” หรือไม่? URL เดิมจะเปลี่ยนเส้นทางมายัง URL ใหม่ถาวร`, "เปลี่ยน URL", "warning"],
  } as const;
  const [title, message, confirmLabel, variant] = copy[action];
  return { title, message, confirmLabel, variant };
}
```

- [ ] **Step 4: Run the domain tests**

Run: `node --import tsx --test tests/services.test.ts`

Expected: all service domain tests PASS.

- [ ] **Step 5: Commit the domain layer**

```powershell
git add tests/services.test.ts src/lib/services.ts src/lib/service-confirmations.ts
git commit -m "feat: add service domain and SEO rules"
```

---

### Task 2: Additive Drizzle Schema and Migration

**Files:**
- Create: `tests/service-schema.test.ts`
- Modify: `src/db/schema.ts`
- Create: `drizzle/0001_service_details.sql`
- Create: `drizzle/meta/0001_snapshot.json`
- Modify: `drizzle/meta/_journal.json`

**Interfaces:**
- Consumes: `ArticleDocument`, `ServiceProcessStep`, and `ServiceFaq` types.
- Produces: `serviceStatus`, extended `services`, and `serviceSlugRedirects` Drizzle exports.

- [ ] **Step 1: Write a failing schema contract test**

```ts
// tests/service-schema.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { getTableColumns, getTableName } from "drizzle-orm";
import { serviceSlugRedirects, services } from "../src/db/schema";

test("service schema exposes detail, publication, SEO, and redirect fields", () => {
  const columns = getTableColumns(services);
  for (const name of [
    "content", "processSteps", "faqs", "imageAlt", "imagePublicId", "status",
    "featured", "seoTitle", "seoDescription", "canonicalUrl", "noIndex", "publishedAt",
  ]) assert.ok(name in columns, `missing services.${name}`);
  assert.equal(getTableName(serviceSlugRedirects), "service_slug_redirects");
  assert.ok("serviceId" in getTableColumns(serviceSlugRedirects));
  assert.ok("slug" in getTableColumns(serviceSlugRedirects));
});
```

- [ ] **Step 2: Verify the schema test fails**

Run: `node --import tsx --test tests/service-schema.test.ts`

Expected: FAIL because `serviceSlugRedirects` and the new columns do not exist.

- [ ] **Step 3: Extend `src/db/schema.ts`**

```ts
export const serviceStatus = pgEnum("service_status", ["draft", "published"]);

// Add to services:
content: jsonb("content").$type<ArticleDocument>().notNull().default({
  type: "doc", content: [{ type: "paragraph", content: [] }],
}),
processSteps: jsonb("process_steps").$type<ServiceProcessStep[]>().notNull().default([]),
faqs: jsonb("faqs").$type<ServiceFaq[]>().notNull().default([]),
imageAlt: text("image_alt"),
imagePublicId: text("image_public_id"),
status: serviceStatus("status").notNull().default("draft"),
featured: boolean("featured").notNull().default(false),
seoTitle: text("seo_title"),
seoDescription: text("seo_description"),
canonicalUrl: text("canonical_url"),
noIndex: boolean("no_index").notNull().default(false),
publishedAt: timestamp("published_at"),

export const serviceSlugRedirects = pgTable(
  "service_slug_redirects",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    serviceId: text("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("service_slug_redirects_service_idx").on(table.serviceId)],
);
```

Wrap the `services` table in its callback form and add `services_publication_idx` on `status`, `archived`, and `publishedAt`.

- [ ] **Step 4: Generate and inspect the migration**

Run: `npx drizzle-kit generate --name service_details`

Expected: `drizzle/0001_service_details.sql` creates `service_status`, adds only the listed service columns/defaults/index, creates `service_slug_redirects`, and does not drop or rewrite existing tables.

- [ ] **Step 5: Run schema and full unit tests**

Run: `node --import tsx --test tests/service-schema.test.ts`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 6: Commit schema and migration**

```powershell
git add src/db/schema.ts drizzle tests/service-schema.test.ts
git commit -m "feat: add service detail database schema"
```

---

### Task 3: Service Input Validation, Queries, and Server Actions

**Files:**
- Create: `tests/service-form.test.ts`
- Create: `src/lib/service-input.ts`
- Create: `src/lib/service-queries.ts`
- Create: `src/app/admin/(protected)/services/actions.ts`
- Delete: `src/app/admin/(protected)/services/actions-client.ts`
- Modify: `src/lib/revalidate-service-pages.ts`
- Modify: `tests/service-cache.test.ts`

**Interfaces:**
- Consumes: domain types/functions from `src/lib/services.ts`, rich-text validation from `src/lib/articles.ts`, and tables from `src/db/schema.ts`.
- Produces: `parseServiceInput()`, `listPublicServiceCards()`, `listAdminServices()`, `getAdminService()`, `resolvePublishedServiceRoute()`, `listPublishedArticlesForService()`, `listArticleSlugsForService()`, `getIndexableServicesForSitemap()`, and authenticated service actions.

- [ ] **Step 1: Write failing parser tests**

```ts
// tests/service-form.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { parseServiceInput } from "../src/lib/service-input";

function validForm() {
  const form = new FormData();
  form.set("name", "ติดตั้งกล้องวงจรปิด");
  form.set("slug", "ติดตั้งกล้องวงจรปิด-เชียงราย");
  form.set("description", "ออกแบบและติดตั้งระบบกล้องสำหรับบ้าน ร้านค้า และสำนักงานในเชียงราย");
  form.set("price", "เริ่มต้น 3,500 ฿");
  form.set("icon", "Camera");
  form.set("features", "สำรวจหน้างาน|ตั้งค่าดูผ่านมือถือ");
  form.set("content", JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "รายละเอียดบริการที่ปลอดภัย" }] }] }));
  form.set("processSteps", JSON.stringify([{ title: "สำรวจ", description: "ตรวจตำแหน่งติดตั้งและระบบเครือข่าย" }]));
  form.set("faqs", JSON.stringify([{ question: "ดูกล้องผ่านมือถือได้ไหม", answer: "ตั้งค่าได้เมื่ออินเทอร์เน็ตและอุปกรณ์รองรับ" }]));
  return form;
}

test("parses a complete service form", () => {
  const result = parseServiceInput(validForm());
  assert.equal(result.slug, "ติดตั้งกล้องวงจรปิด-เชียงราย");
  assert.equal(result.features, "สำรวจหน้างาน|ตั้งค่าดูผ่านมือถือ");
  assert.equal(result.processSteps.length, 1);
  assert.equal(result.faqs.length, 1);
});

test("rejects unsafe rich text and foreign canonical URLs", () => {
  const unsafe = validForm();
  unsafe.set("content", JSON.stringify({ type: "doc", content: [{ type: "script" }] }));
  assert.throws(() => parseServiceInput(unsafe), /เนื้อหา/);
  const foreign = validForm();
  foreign.set("canonicalUrl", "https://example.com/service");
  assert.throws(() => parseServiceInput(foreign), /Canonical/);
});

test("bounds process and FAQ content", () => {
  const form = validForm();
  form.set("faqs", JSON.stringify(Array.from({ length: 21 }, (_, i) => ({ question: `คำถาม ${i}`, answer: "คำตอบ" }))));
  assert.throws(() => parseServiceInput(form), /FAQ/);
});
```

- [ ] **Step 2: Verify parser tests fail**

Run: `node --import tsx --test tests/service-form.test.ts`

Expected: FAIL because `parseServiceInput()` does not exist.

- [ ] **Step 3: Implement the pure parser**

```ts
// src/lib/service-input.ts
export type ServiceInput = {
  name: string; slug: string; description: string; price: string | null; icon: string;
  image: string | null; imageAlt: string | null; imagePublicId: string | null;
  features: string | null; content: ArticleDocument;
  processSteps: ServiceProcessStep[]; faqs: ServiceFaq[]; featured: boolean;
  seoTitle: string | null; seoDescription: string | null;
  canonicalUrl: string | null; noIndex: boolean;
};

export function parseServiceInput(formData: FormData): ServiceInput;
```

Validate: name 3–120 characters, description 20–500, slug normalized and non-empty, at most 12 highlights, 12 process steps, and 20 FAQs; each title/question at most 180 and each description/answer at most 1,000 characters. Parse JSON with Thai user-facing errors. Use `isValidArticleDocument()`, `sanitizeArticleUrl(..., "image")`, and `sanitizeCanonical()`.

- [ ] **Step 4: Implement query helpers**

```ts
// src/lib/service-queries.ts
export async function listPublicServiceCards(): Promise<Array<typeof services.$inferSelect>>;
export async function listAdminServices(options?: {
  query?: string; status?: "all" | "draft" | "published" | "archived";
}): Promise<Array<typeof services.$inferSelect>>;
export async function getAdminService(id: string): Promise<typeof services.$inferSelect | null>;
export async function resolvePublishedServiceRoute(slug: string): Promise<
  | { kind: "service"; service: typeof services.$inferSelect }
  | { kind: "redirect"; service: typeof services.$inferSelect }
  | null
>;
export async function listPublishedArticlesForService(serviceId: string, limit?: number): Promise<PublishedArticleListItem[]>;
export async function listArticleSlugsForService(serviceId: string): Promise<string[]>;
export async function getIndexableServicesForSitemap(): Promise<Array<{ slug: string; updatedAt: Date }>>;
```

Current-route queries require `status = published`, `archived = false`, and non-null `publishedAt`. Redirect resolution joins `service_slug_redirects.service_id` to the same public-service predicate. Admin filters use `ilike` over name/slug and mirror article list semantics.

- [ ] **Step 5: Implement authenticated actions and slug-history transaction**

```ts
// src/app/admin/(protected)/services/actions.ts
export async function createServiceAction(formData: FormData): Promise<{ id: string; slug: string }>;
export async function updateServiceAction(id: string, formData: FormData): Promise<{ id: string; slug: string }>;
export async function setServicePublicationAction(id: string, publish: boolean): Promise<void>;
export async function setServiceArchivedAction(id: string, archived: boolean): Promise<void>;
export async function deleteDraftServiceAction(id: string): Promise<void>;
```

For every action call `requireAdmin()`. `assertUniqueServiceSlug()` checks both `services.slug` and every `serviceSlugRedirects.slug`; historical slugs cannot be reused, including by the same service after it has moved away. When a previously published service changes slug, use `db.transaction()` to insert the previous slug and update the service atomically. Publication requires at least 600 visible body characters, a description, at least one process step, and image alt when an image exists. Archive sets `archived = true` and `status = draft`; restore returns as draft. Deletion calls `canDeleteServicePermanently()` and performs best-effort Cloudinary cleanup. Before every mutation, load `listArticleSlugsForService(id)` and pass those slugs to revalidation so related article detail pages never retain stale service URLs or visibility.

- [ ] **Step 6: Expand deterministic revalidation and its test**

```ts
// src/lib/revalidate-service-pages.ts
export function revalidateServicePages(
  revalidate: (path: string) => void,
  slugs: string[] = [],
  articleSlugs: string[] = [],
) {
  for (const path of getServiceRevalidationPaths(slugs, articleSlugs)) revalidate(path);
}
```

Update `tests/service-cache.test.ts` to pass `old-slug`, `new-slug`, and `cctv-guide`, then assert the complete ordered list from Task 1 including `/articles/cctv-guide`.

- [ ] **Step 7: Run tests and compile-check the server layer**

Run: `node --import tsx --test tests/service-form.test.ts tests/service-cache.test.ts`

Expected: PASS.

Run: `npx tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 8: Commit queries and actions**

```powershell
git add tests/service-form.test.ts tests/service-cache.test.ts src/lib/service-input.ts src/lib/service-queries.ts src/lib/revalidate-service-pages.ts 'src/app/admin/(protected)/services/actions.ts' 'src/app/admin/(protected)/services/actions-client.ts'
git commit -m "feat: add service CMS queries and actions"
```

---

### Task 4: Public Service Detail and Admin Preview

**Files:**
- Create: `src/components/service-detail.tsx`
- Create: `src/app/(public)/services/[slug]/page.tsx`
- Create: `src/app/admin/(protected)/services/[id]/preview/page.tsx`
- Create: `tests/service-detail.test.ts`

**Interfaces:**
- Consumes: `resolvePublishedServiceRoute()`, `getAdminService()`, `listPublishedArticlesForService()`, `resolveServiceSeo()`, `buildServiceStructuredData()`, and `ArticleContent`.
- Produces: reusable `ServiceDetail` and public `/services/[slug]` route.

- [ ] **Step 1: Write a failing structured presentation test**

```ts
// tests/service-detail.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { buildServiceStructuredData } from "../src/lib/services";

test("omits FAQPage when the page has no visible FAQ", () => {
  const data = buildServiceStructuredData({
    name: "ซ่อมเครื่องใช้ไฟฟ้า", slug: "ซ่อมเครื่องใช้ไฟฟ้า",
    description: "ตรวจอาการและประเมินความคุ้มค่าก่อนซ่อม",
    image: null, price: "ตามอาการ", faqs: [], updatedAt: new Date("2026-07-31"),
  });
  assert.equal(data.some((item) => item["@type"] === "FAQPage"), false);
  assert.equal(data.some((item) => item["@type"] === "Service"), true);
  assert.equal(JSON.stringify(data).includes("C.Electronics"), true);
});
```

- [ ] **Step 2: Run the focused test**

Run: `node --import tsx --test tests/service-detail.test.ts`

Expected: PASS only after Task 1's structured-data implementation is complete; extend Task 1 if publisher/breadcrumb fields are missing.

- [ ] **Step 3: Build the shared visible presentation**

```tsx
// src/components/service-detail.tsx
export type ServiceDetailProps = {
  service: typeof services.$inferSelect;
  relatedArticles: PublishedArticleListItem[];
  preview?: boolean;
};

export function ServiceDetail({ service, relatedArticles, preview = false }: ServiceDetailProps) {
  // Render breadcrumb, hero, price, features, ArticleContent, ordered process,
  // visible FAQs, related ArticleCard items, and /booking?service=<encoded slug> CTA.
}
```

Render JSON-LD in this shared component only for the public route (`preview === false`). Serialize with `JSON.stringify(data).replace(/</g, "\\u003c")`. Use `next/image` for the cover, `service.imageAlt || service.name` as a defensive render fallback, semantic `<ol>` for process, and `<details>`/`<summary>` for visible FAQs.

- [ ] **Step 4: Implement the public route and metadata**

```tsx
// src/app/(public)/services/[slug]/page.tsx
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata>;

export default async function ServicePage({ params }: {
  params: Promise<{ slug: string }>;
}) {
  const slug = normalizeServiceRouteSlug((await params).slug);
  const resolution = await resolvePublishedServiceRoute(slug);
  if (!resolution) notFound();
  if (resolution.kind === "redirect") {
    permanentRedirect(`/services/${encodeURIComponent(resolution.service.slug)}`);
  }
  const relatedArticles = await listPublishedArticlesForService(resolution.service.id, 3);
  return <ServiceDetail service={resolution.service} relatedArticles={relatedArticles} />;
}
```

Metadata includes resolved title/description/canonical, robots, Open Graph `website`, Twitter `summary_large_image`, image/alt, and the current canonical URL. For a redirect lookup, metadata resolves from the destination service.

- [ ] **Step 5: Implement authenticated preview**

```tsx
// src/app/admin/(protected)/services/[id]/preview/page.tsx
export const metadata = { title: "ตัวอย่างบริการ", robots: { index: false, follow: false } };

export default async function ServicePreviewPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const service = await getAdminService((await params).id);
  if (!service) notFound();
  const relatedArticles = await listPublishedArticlesForService(service.id, 3);
  return <ServiceDetail service={service} relatedArticles={relatedArticles} preview />;
}
```

Wrap preview with the same warning/status bar and edit/live links used by the article preview.

- [ ] **Step 6: Verify presentation and compile**

Run: `node --import tsx --test tests/service-detail.test.ts`

Expected: PASS.

Run: `npx tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 7: Commit the detail page**

```powershell
git add tests/service-detail.test.ts src/components/service-detail.tsx 'src/app/(public)/services/[slug]/page.tsx' 'src/app/admin/(protected)/services/[id]/preview/page.tsx'
git commit -m "feat: add public service detail pages"
```

---

### Task 5: Complete Service Administration UI

**Files:**
- Create: `tests/service-create-panel.test.ts`
- Create: `src/app/admin/(protected)/services/service-form.tsx`
- Create: `src/app/admin/(protected)/services/service-quick-create.tsx`
- Create: `src/app/admin/(protected)/services/service-row-actions.tsx`
- Modify: `src/app/admin/(protected)/services/page.tsx`
- Modify: `src/app/admin/(protected)/services/[id]/edit/page.tsx`
- Delete: `src/app/admin/(protected)/services/client.tsx`
- Delete: `src/app/admin/(protected)/services/[id]/edit/client.tsx`

**Interfaces:**
- Consumes: Task 3 actions/queries, `ArticleRichTextEditor`, `ImageUpload`, and `ConfirmModal`.
- Produces: complete embedded create form, shared edit form, searchable/filterable table, and modal-backed row actions.

- [ ] **Step 1: Write a failing complete-form rendering test**

```tsx
// tests/service-create-panel.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

test("service create dropdown contains the same complete editor fields", async () => {
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost/test";
  const { ServiceCreatePanel } = await import("../src/app/admin/(protected)/services/service-quick-create");
  const markup = renderToStaticMarkup(React.createElement(
    AppRouterContext.Provider, { value: {} as never }, React.createElement(ServiceCreatePanel),
  ));
  for (const field of [
    "name", "slug", "description", "price", "icon", "features", "content",
    "processSteps", "faqs", "imageAlt", "featured", "seoTitle",
    "seoDescription", "canonicalUrl", "noIndex",
  ]) assert.match(markup, new RegExp(`name=["']${field}["']`), `missing ${field}`);
});
```

- [ ] **Step 2: Verify the UI test fails**

Run: `node --import tsx --test tests/service-create-panel.test.ts`

Expected: FAIL because `service-quick-create.tsx` does not exist.

- [ ] **Step 3: Build the shared complete `ServiceForm`**

```tsx
export type EditableService = typeof services.$inferSelect;

export function ServiceForm({
  service,
  embedded = false,
}: {
  service?: EditableService;
  embedded?: boolean;
}) {
  // Controlled state: name, slug, content, image/publicId, features,
  // processSteps, faqs, pending feedback, and confirmation action.
}
```

Use the article form's two-column desktop layout and section styling. Serialize `content`, `processSteps`, and `faqs` into hidden inputs on submit. Add/remove buttons must keep at least one editable row in the UI while submitting only non-empty structured entries. For an existing service whose `publishedAt` is non-null, intercept a changed slug, open `slug-change` confirmation, and only then call `updateServiceAction()` with the captured `FormData`. Publication/archive controls use the same modal state machine as `ArticleForm`.

- [ ] **Step 4: Build quick-create and row actions**

```tsx
export function ServiceCreatePanel() {
  return <div id="create-service-panel" className="mt-4 rounded-[24px] border border-primary/10 bg-canvas-muted p-4 sm:p-5"><ServiceForm embedded /></div>;
}

export function ServiceQuickCreate() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-5">
      <button type="button" aria-expanded={open} aria-controls="create-service-panel" onClick={() => setOpen((value) => !value)}>
        <Plus className={open ? "size-4 rotate-45" : "size-4"} />
        {open ? "ย่อ" : "เพิ่มบริการ"}
      </button>
      {open && <ServiceCreatePanel />}
    </div>
  );
}
```

`ServiceRowActions` exposes edit, preview, publish/unpublish, archive/restore, and delete only when `canDeleteServicePermanently()` is true. Every mutation uses `getServiceConfirmation()` and `ConfirmModal`; pending state disables duplicate actions and server errors appear in a dismissible alert.

- [ ] **Step 5: Replace the admin list page**

```tsx
export default async function AdminServicesPage({ searchParams }: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const allowed = new Set(["all", "draft", "published", "archived"]);
  const status = allowed.has(params.status ?? "")
    ? params.status as "all" | "draft" | "published" | "archived"
    : "all";
  const rows = await listAdminServices({ query: params.q, status });
  return (
    <main>
      <ServiceAdminHeader count={rows.length} />
      <ServiceQuickCreate />
      <ServiceFilters query={params.q ?? ""} status={status} />
      <ServiceTable rows={rows} />
    </main>
  );
}
```

Define `ServiceAdminHeader`, `ServiceFilters`, and `ServiceTable` as local server components in `page.tsx`. Use Thai status labels matching articles. Table columns: image, service/URL, status, price, updated date, actions. The count reflects the filtered view.

- [ ] **Step 6: Replace the edit route with the shared form**

```tsx
export default async function EditServicePage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const service = await getAdminService((await params).id);
  if (!service) notFound();
  return <ServiceForm service={service} />;
}
```

Delete the obsolete monolithic client and old edit client only after no imports remain.

- [ ] **Step 7: Run the UI test, lint, and compile check**

Run: `node --import tsx --test tests/service-create-panel.test.ts`

Expected: PASS with every complete form field found.

Run: `npx eslint "src/app/admin/(protected)/services/**/*.{ts,tsx}"`

Expected: exit code 0.

Run: `npx tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 8: Commit the administration UI**

```powershell
git add tests/service-create-panel.test.ts 'src/app/admin/(protected)/services'
git commit -m "feat: build complete service management UI"
```

---

### Task 6: Public Cards, Article Links, Booking Prefill, and Sitemap

**Files:**
- Modify: `src/app/(public)/services/page.tsx`
- Modify: `src/app/(public)/services/services-client.tsx`
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/app/(public)/home-client.tsx`
- Modify: `src/lib/article-queries.ts`
- Modify: `src/app/(public)/articles/[slug]/page.tsx`
- Modify: `src/app/(public)/booking/page.tsx`
- Modify: `src/app/(public)/booking/booking-client.tsx`
- Modify: `src/app/sitemap.ts`
- Modify: `src/lib/sitemap-entries.ts`
- Modify: `tests/sitemap.test.ts`

**Interfaces:**
- Consumes: `listPublicServiceCards()`, `getIndexableServicesForSitemap()`, publication fields, and `/services/[slug]` route.
- Produces: crawlable internal service links, draft-safe fallbacks, service-specific booking preselection, and canonical service sitemap entries.

- [ ] **Step 1: Extend the sitemap test first**

```ts
// tests/sitemap.test.ts additions
const serviceUpdatedAt = new Date("2026-07-31T08:00:00.000Z");
const entries = buildSitemapEntries({
  baseUrl: "https://www.c-electronics.online",
  now,
  products: [{ slug: "router-wifi-6", updatedAt: productUpdatedAt }],
  services: [{ slug: "ติดตั้งจานดาวเทียม", updatedAt: serviceUpdatedAt }],
  articles: [{ slug: "เลือกอะไหล่อิเล็กทรอนิกส์", updatedAt: articleUpdatedAt }],
});
assert.equal(entries.some((entry) => entry.url ===
  `https://www.c-electronics.online/services/${encodeURIComponent("ติดตั้งจานดาวเทียม")}`), true);
assert.equal(entries.some((entry) => entry.url.includes("#")), false);
```

- [ ] **Step 2: Verify the sitemap test fails**

Run: `node --import tsx --test tests/sitemap.test.ts`

Expected: FAIL because `buildSitemapEntries()` does not accept or emit services.

- [ ] **Step 3: Add indexable services to sitemap**

```ts
export function buildSitemapEntries({ baseUrl, now, products, services, articles }: {
  baseUrl: string; now: Date; products: SitemapRow[]; services: SitemapRow[]; articles: SitemapRow[];
}): MetadataRoute.Sitemap {
  return [
    // existing static/product entries,
    ...services.map((service) => ({
      url: `${baseUrl}/services/${encodeURIComponent(service.slug)}`,
      lastModified: service.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // article entries
  ];
}
```

Update `src/app/sitemap.ts` to fetch product, service, and article rows in one `Promise.all()` and pass all three collections.

- [ ] **Step 4: Make home and hub cards draft-safe and crawlable**

Use `listPublicServiceCards()` in both server pages. Add `slug`, `status`, `publishedAt`, `archived`, and `imageAlt` to client props. Render the card title and image inside `<Link href={`/services/${encodeURIComponent(slug)}`}>` only when status is published and `publishedAt` exists; otherwise retain a non-link card with its booking CTA. Use `imageAlt || name` for images.

```tsx
const detailHref = s.status === "published" && s.publishedAt
  ? `/services/${encodeURIComponent(s.slug)}`
  : null;
```

- [ ] **Step 5: Replace article fragment links**

Extend `getArticleRelations()` to select service `status`, `publishedAt`, and `archived`. In the article detail card use:

```tsx
const serviceHref = relations.service.status === "published" && relations.service.publishedAt
  ? `/services/${encodeURIComponent(relations.service.slug)}`
  : "/services";
```

No generated link may contain `/services#`.

- [ ] **Step 6: Prefill booking from a public service slug**

```tsx
// booking/page.tsx
export default async function BookingPage({ searchParams }: {
  searchParams: Promise<{ service?: string }>;
}) {
  const requested = normalizeServiceRouteSlug((await searchParams).service ?? "");
  const allServices = await listPublicServiceCards();
  const selected = allServices.find((service) => service.slug === requested)?.name ?? "";
  return <BookingClient serviceTypes={allServices.map((service) => service.name)} initialServiceType={selected} settings={settingsRow} />;
}
```

Initialize the controlled booking service field from `initialServiceType`, keeping an empty fallback for invalid/draft/detail slugs. Detail CTA uses `/booking?service=${encodeURIComponent(service.slug)}`.

- [ ] **Step 7: Run sitemap, article, and full tests**

Run: `node --import tsx --test tests/sitemap.test.ts tests/articles.test.ts tests/service-cache.test.ts`

Expected: PASS and no fragment URL assertion failures.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 8: Commit public integration and sitemap**

```powershell
git add tests/sitemap.test.ts src/app/sitemap.ts src/lib/sitemap-entries.ts src/lib/article-queries.ts 'src/app/(public)/services' 'src/app/(public)/page.tsx' 'src/app/(public)/home-client.tsx' 'src/app/(public)/articles/[slug]/page.tsx' 'src/app/(public)/booking'
git commit -m "feat: connect service pages across site and sitemap"
```

---

### Task 7: Seed Six Service Detail Drafts

**Files:**
- Create: `tests/service-seed-data.test.ts`
- Create: `src/lib/service-seed-data.ts`
- Create: `scripts/seed-services.ts`
- Create: `scripts/verify-services.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: extended `services` schema and service content types.
- Produces: `serviceDraftSeeds`, `db:seed:services`, and `db:verify:services`.

- [ ] **Step 1: Write failing seed-quality tests**

```ts
// tests/service-seed-data.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { textFromArticleNode } from "../src/lib/articles";
import { serviceDraftSeeds } from "../src/lib/service-seed-data";

test("ships six distinct substantial Thai service drafts", () => {
  assert.equal(serviceDraftSeeds.length, 6);
  assert.equal(new Set(serviceDraftSeeds.map((seed) => seed.key)).size, 6);
  for (const seed of serviceDraftSeeds) {
    const text = (seed.content.content ?? []).map(textFromArticleNode).join(" ");
    assert.ok(text.length >= 900, `${seed.key} content is too short`);
    assert.ok(seed.features.length >= 4, `${seed.key} needs highlights`);
    assert.ok(seed.processSteps.length >= 4, `${seed.key} needs process steps`);
    assert.ok(seed.faqs.length >= 3, `${seed.key} needs FAQs`);
    assert.ok(seed.imageAlt.length >= 10, `${seed.key} needs image alt`);
  }
});
```

- [ ] **Step 2: Verify the seed test fails**

Run: `node --import tsx --test tests/service-seed-data.test.ts`

Expected: FAIL because `service-seed-data.ts` does not exist.

- [ ] **Step 3: Create deterministic, service-specific Thai seed data**

```ts
export type ServiceDraftSeed = {
  key: "air" | "cctv" | "electrical" | "satellite" | "appliance" | "parts";
  match: string[];
  slug: string;
  description: string;
  imageAlt: string;
  features: string[];
  content: ArticleDocument;
  processSteps: ServiceProcessStep[];
  faqs: ServiceFaq[];
  seoTitle: string;
  seoDescription: string;
};

type ServiceDraftBlueprint = Pick<ServiceDraftSeed, "key" | "match" | "slug"> & {
  title: string;
  overview: string;
  sections: string[];
  safety: string[];
};

const serviceDraftBlueprints: ServiceDraftBlueprint[] = [
  {
    key: "air", match: ["แอร์", "เครื่องปรับอากาศ"], slug: "ติดตั้งและซ่อมแอร์-เชียงราย",
    title: "บริการติดตั้ง ล้าง และซ่อมแอร์ในเชียงราย",
    overview: "เริ่มจากสำรวจขนาดห้อง ภาระความร้อน ตำแหน่งคอยล์เย็นและคอยล์ร้อน แนวท่อน้ำยา ทางระบายน้ำ และความพร้อมของวงจรไฟฟ้า ก่อนเสนอขอบเขตงานที่เหมาะกับการใช้งานจริง",
    sections: ["เลือก BTU จากหน้างานจริง", "เตรียมวงจรไฟฟ้าและทางระบายน้ำ", "ติดตั้งพร้อมทำสุญญากาศและทดสอบ", "ตรวจอาการก่อนซ่อมหรือเปลี่ยนอะไหล่", "ดูแลหลังติดตั้งและวางรอบล้างแอร์"],
    safety: ["ใช้วงจรไฟฟ้าที่เหมาะสม ไม่ต่อปลั๊กพ่วง", "งานสารทำความเย็นต้องทำโดยช่างพร้อมเครื่องมือ", "หยุดใช้งานเมื่อมีกลิ่นไหม้ เบรกเกอร์ตัด หรือน้ำหยดใกล้ไฟฟ้า"],
  },
  {
    key: "cctv", match: ["กล้อง", "cctv"], slug: "ติดตั้งกล้องวงจรปิด-เชียงราย",
    title: "บริการออกแบบและติดตั้งกล้องวงจรปิดในเชียงราย",
    overview: "สำรวจจุดเสี่ยง แสงกลางวันและกลางคืน ระยะมองเห็น ระบบเครือข่าย แนวเดินสาย แหล่งจ่ายไฟ และจำนวนวันที่ต้องการเก็บภาพ เพื่อเลือกระบบ Analog, IP หรือ Wi‑Fi ให้เหมาะสม",
    sections: ["กำหนดวัตถุประสงค์และมุมกล้อง", "เลือกระบบและความละเอียด", "วางสาย เครือข่าย และพื้นที่บันทึก", "ตั้งค่าดูผ่านมือถืออย่างปลอดภัย", "ทดสอบภาพย้อนหลังและส่งมอบ"],
    safety: ["หลีกเลี่ยงมุมที่ละเมิดพื้นที่ส่วนตัวของผู้อื่น", "เปลี่ยนรหัสผ่านเริ่มต้นและจำกัดสิทธิ์ผู้ใช้", "แจ้งระยะเวลาเก็บภาพตามความจุจริง ไม่รับประกันจากตัวเลขโฆษณาเพียงอย่างเดียว"],
  },
  {
    key: "electrical", match: ["ไฟฟ้า"], slug: "ติดตั้งและตรวจระบบไฟฟ้าบ้าน-เชียงราย",
    title: "บริการติดตั้งและตรวจระบบไฟฟ้าบ้านในเชียงราย",
    overview: "ตรวจโหลด วงจรเดิม ขนาดสาย เบรกเกอร์ อุปกรณ์ตัดไฟรั่ว ระบบสายดิน และสภาพจุดต่อ ก่อนแยกขอบเขตงานซ่อม ปรับปรุง หรือเดินระบบใหม่ให้ตรวจสอบย้อนหลังได้",
    sections: ["สำรวจอาการและประวัติวงจร", "คำนวณโหลดและแบ่งวงจร", "เลือกสาย เบรกเกอร์ RCD และสายดิน", "ติดตั้งพร้อมวัดค่าทดสอบ", "ติดป้ายวงจรและอธิบายการใช้งาน"],
    safety: ["ตัดแหล่งจ่ายและยืนยันว่าไม่มีไฟก่อนทำงาน", "ไม่เปิดตู้หรือแตะจุดต่อที่ยังมีไฟ", "ทดสอบ RCD และระบบสายดินด้วยเครื่องมือที่เหมาะสม"],
  },
  {
    key: "satellite", match: ["ดาวเทียม", "จาน"], slug: "ติดตั้งจานดาวเทียม-เชียงราย",
    title: "บริการติดตั้งและแก้ปัญหาจานดาวเทียมในเชียงราย",
    overview: "ตรวจแนวรับสัญญาณ ความแข็งแรงของจุดยึด ตำแหน่งเดินสาย สภาพหัวรับและจุดต่อ รวมถึงอาการที่เกิดเฉพาะช่วงฝนหรือลมแรง ก่อนปรับหน้าจานด้วยเครื่องวัดสัญญาณ",
    sections: ["เลือกตำแหน่งที่เห็นแนวดาวเทียม", "ติดตั้งฐานและจานอย่างมั่นคง", "ปรับมุมและวัดคุณภาพสัญญาณ", "เดินสายและป้องกันน้ำเข้าจุดต่อ", "ทดสอบช่องรับชมและอธิบายข้อจำกัดอากาศ"],
    safety: ["ใช้อุปกรณ์ป้องกันการตกเมื่อทำงานบนที่สูง", "ไม่ขึ้นหลังคาขณะฝนตก ลมแรง หรือพื้นลื่น", "ประเมินความเสี่ยงฟ้าผ่าและสภาพอากาศก่อนเริ่มงาน"],
  },
  {
    key: "appliance", match: ["เครื่องใช้ไฟฟ้า"], slug: "ซ่อมเครื่องใช้ไฟฟ้า-เชียงราย",
    title: "บริการตรวจและซ่อมเครื่องใช้ไฟฟ้าในเชียงราย",
    overview: "รับข้อมูลอาการ รุ่น อายุการใช้งาน และเหตุการณ์ก่อนเสีย จากนั้นตรวจอย่างเป็นลำดับ แยกต้นเหตุ ประเมินอะไหล่ ค่าแรง และความคุ้มค่าเทียบกับการเปลี่ยนเครื่องก่อนเริ่มซ่อม",
    sections: ["บันทึกอาการและตรวจสภาพภายนอก", "วัดค่าเพื่อแยกสาเหตุ", "เสนอราคาและทางเลือกซ่อมหรือเปลี่ยน", "เปลี่ยนอะไหล่และประกอบตามมาตรฐาน", "ทดสอบการทำงานและความปลอดภัย"],
    safety: ["ถอดปลั๊กก่อนตรวจและไม่ใช้เครื่องที่มีกลิ่นไหม้", "ระวังคาปาซิเตอร์ ความร้อน และชิ้นส่วนเคลื่อนที่แม้ถอดปลั๊กแล้ว", "เปรียบเทียบค่าซ่อม อายุเครื่อง และความพร้อมของอะไหล่ก่อนตัดสินใจ"],
  },
  {
    key: "parts", match: ["อะไหล่", "อิเล็กทรอนิกส์"], slug: "อะไหล่อิเล็กทรอนิกส์-เชียงราย",
    title: "บริการจำหน่ายและช่วยเลือกอะไหล่อิเล็กทรอนิกส์ในเชียงราย",
    overview: "ช่วยเทียบเบอร์อะไหล่ ค่าพิกัดไฟฟ้า ขนาด ขา ตำแหน่งติดตั้ง และเงื่อนไขการใช้งานจากข้อมูลบนชิ้นส่วนเดิมหรือคู่มือ เพื่อลดความเสี่ยงซื้อผิดรุ่นและเสียหายซ้ำ",
    sections: ["อ่านเบอร์และเก็บข้อมูลชิ้นส่วนเดิม", "เทียบแรงดัน กระแส กำลัง และค่าคลาดเคลื่อน", "ตรวจขั้ว ขนาด และรูปแบบขา", "ประเมินอะไหล่ทดแทนและแหล่งที่มา", "ยืนยันวิธีติดตั้งและทดสอบอย่างปลอดภัย"],
    safety: ["ต้องตรงเบอร์หรือผ่านการเทียบสเปกโดยผู้รู้", "ตรวจขั้วและพิกัดไฟฟ้าก่อนจ่ายไฟ", "หยุดติดตั้งเมื่อไม่แน่ใจเรื่องอะไหล่ทดแทนหรือวงจร"],
  },
];

export const serviceDraftSeeds = serviceDraftBlueprints.map(buildServiceDraftSeed);
```

Implement `buildServiceDraftSeed()` with actual `paragraph()`, `heading()`, and `bulletList()` nodes. Expand every named section into two service-specific paragraphs covering survey inputs, decision criteria, work performed, verification, and customer handoff. Add a safety heading with the blueprint's exact safety bullets and a closing CTA. The resulting visible text for every draft must exceed 900 Thai characters.

Each draft must preserve these exact safety themes:

- Air: dedicated circuit, drainage slope, refrigerant work only by equipped technicians.
- CCTV: lawful camera angles, password changes, storage-duration expectations.
- Electrical: isolate power, do not open energized panels, test RCD and grounding.
- Satellite: fall protection, lightning/weather exposure, no rooftop work in rain/wind.
- Appliance: unplug before inspection, capacitors/heat/moving parts, compare repair cost and age.
- Parts: match part number and electrical ratings, polarity, safe substitutes, stop when uncertain.

Each seed must have four named process steps and at least these FAQs: price factors, expected time/site preparation, and warranty/after-service terms phrased as “confirm with the shop” rather than inventing a guarantee.

- [ ] **Step 4: Implement idempotent seed and verification scripts**

```ts
// scripts/seed-services.ts algorithm
const candidates = await db.select().from(services);
const selectedIds = new Set<string>();
for (const seed of serviceDraftSeeds) {
  const service = candidates.find((row) =>
    !selectedIds.has(row.id) && seed.match.some((keyword) =>
      `${row.name} ${row.slug}`.toLocaleLowerCase("th").includes(keyword.toLocaleLowerCase("th"))));
  if (!service) throw new Error(`ไม่พบบริการสำหรับ seed: ${seed.key}`);
  selectedIds.add(service.id);
  await db.update(services).set({
    slug: seed.slug,
    description: seed.description,
    imageAlt: seed.imageAlt,
    features: seed.features.join("|"),
    content: seed.content,
    processSteps: seed.processSteps,
    faqs: seed.faqs,
    seoTitle: seed.seoTitle,
    seoDescription: seed.seoDescription,
    status: "draft",
    publishedAt: null,
    updatedAt: new Date(),
  }).where(eq(services.id, service.id));
}
```

Before updates, check candidate slugs against all current services and redirect history. The script must be idempotent and never modify `archived`, price, image, icon, `featured`, canonical, or `noIndex`. Verification exits non-zero unless all six matches have valid content and remain draft/unpublished.

Add package scripts:

```json
"db:seed:services": "node --env-file=.env.local --import tsx scripts/seed-services.ts",
"db:verify:services": "node --env-file=.env.local --import tsx scripts/verify-services.ts"
```

- [ ] **Step 5: Run seed-quality tests**

Run: `node --import tsx --test tests/service-seed-data.test.ts`

Expected: PASS for exactly six substantial drafts.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 6: Commit seed content and scripts**

```powershell
git add tests/service-seed-data.test.ts src/lib/service-seed-data.ts scripts/seed-services.ts scripts/verify-services.ts package.json
git commit -m "content: prepare six service detail drafts"
```

---

### Task 8: Apply Migration and Complete Verification

**Files:**
- Modify only files required by failures found during verification.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: migrated configured database, six verified drafts, and a clean production build.

- [ ] **Step 1: Confirm repository and migration scope before database writes**

Run: `git status --short`

Expected: clean working tree.

Run: `Get-Content -LiteralPath 'drizzle/0001_service_details.sql' -Encoding utf8 | Select-String -Pattern 'DROP TABLE|DROP COLUMN'`

Expected: no output.

- [ ] **Step 2: Apply the additive migration**

Run: `npm run db:migrate`

Expected: migration completes successfully against the configured `.env.local` database.

- [ ] **Step 3: Seed and verify the six drafts**

Run: `npm run db:seed:services`

Expected: reports one matched and updated service for each of the six keys, all as draft.

Run: `npm run db:verify:services`

Expected: reports six valid drafts, zero published seeded services, and zero duplicate current/historical slugs.

- [ ] **Step 4: Run the complete automated verification**

Run: `npm test`

Expected: all tests PASS.

Run: `npm run lint`

Expected: exit code 0 with no ESLint errors.

Run: `npm run build`

Expected: production build succeeds and includes `/services/[slug]`, `/admin/services/[id]/edit`, and `/admin/services/[id]/preview` routes.

- [ ] **Step 5: Inspect sitemap data against the migrated database**

Run: `npm run db:verify:services`

Expected: seeded drafts remain excluded from indexable service count. After an administrator publishes one valid test service, its encoded canonical URL appears exactly once in `/sitemap.xml`; unpublishing removes it.

- [ ] **Step 6: Manually verify critical flows in the local app**

Run:

```powershell
$serviceDevProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WindowStyle Hidden -PassThru
$serviceDevProcess.Id
```

Expected: prints the background development-server process ID. Confirm readiness by opening `http://localhost:3000/services` before continuing.

Verify:

1. Existing six cards remain visible on `/` and `/services` while their details are draft.
2. Draft detail URL returns 404, while admin preview renders full content.
3. Create dropdown and edit page expose the same complete fields.
4. Publish/unpublish/archive/restore/delete and post-publication slug change all show confirmation modals.
5. Publishing creates a public page with canonical, social metadata, Service/Breadcrumb/visible-FAQ JSON-LD, and booking preselection.
6. Changing a published slug makes the old Thai URL return HTTP 308 to the current URL.
7. Article related-service cards and all public service cards contain no fragment URL.

After verification, stop only the process started above:

```powershell
Stop-Process -Id $serviceDevProcess.Id
```

- [ ] **Step 7: Commit only verification fixes, if any**

If verification required code fixes:

```powershell
$verificationFiles = git diff --name-only
if ($verificationFiles) {
  git add -- $verificationFiles
  git commit -m "fix: complete service CMS verification"
}
```

If no files changed, do not create an empty commit.
