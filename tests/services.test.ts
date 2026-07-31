import assert from "node:assert/strict";
import test from "node:test";
import {
  assertServiceReadyForPublication,
  buildServiceStructuredData,
  canDeleteServicePermanently,
  getServiceRevalidationPaths,
  isIndexableService,
  normalizeServiceRouteSlug,
  resolveServiceCanonical,
  resolveServiceSeo,
  slugifyServiceName,
} from "../src/lib/services";
import { getServiceConfirmation } from "../src/lib/service-confirmations";
import { buildSitemapEntries } from "../src/lib/sitemap-entries";

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

test("requires normalized visible content and complete publication fields", () => {
  const ready = {
    content: {
      type: "doc" as const,
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "ก".repeat(600) }],
        },
      ],
    },
    description: "คำอธิบายบริการที่พร้อมเผยแพร่",
    processSteps: [{ title: "สำรวจ", description: "ตรวจหน้างาน" }],
    image: null,
    imageAlt: null,
  };

  assert.doesNotThrow(() => assertServiceReadyForPublication(ready));
  assert.throws(
    () =>
      assertServiceReadyForPublication({
        ...ready,
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `${"ก".repeat(599)}${" ".repeat(1_000)}`,
                },
              ],
            },
          ],
        },
      }),
    /600/,
  );
  assert.throws(
    () => assertServiceReadyForPublication({ ...ready, processSteps: [] }),
    /ขั้นตอน/,
  );
  assert.throws(
    () => assertServiceReadyForPublication({ ...ready, description: "" }),
    /คำอธิบาย/,
  );
  assert.throws(
    () =>
      assertServiceReadyForPublication({
        ...ready,
        image: "https://res.cloudinary.com/demo/image.jpg",
        imageAlt: "",
      }),
    /alt text/,
  );
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
  const canonicalUrl =
    "https://www.c-electronics.online/services/satellite-canonical";
  const data = buildServiceStructuredData({
    name: "ติดตั้งจานดาวเทียม",
    slug: "ติดตั้งจานดาวเทียม",
    description: "ติดตั้งและตรวจสัญญาณจานดาวเทียม",
    image: null,
    price: "เริ่มต้น 1,200 ฿",
    faqs: [{ question: "ฝนตกแล้วสัญญาณหายเกิดจากอะไร", answer: "ควรตรวจแนวรับสัญญาณและจุดต่อสายโดยช่าง" }],
    updatedAt: new Date("2026-07-31T10:00:00Z"),
    canonicalUrl,
  });
  assert.deepEqual(data.map((item) => item["@type"]), ["Service", "BreadcrumbList", "FAQPage"]);
  assert.equal(data[0]["@id"], canonicalUrl);
  assert.equal(data[0].url, canonicalUrl);
  assert.equal(
    (data[1].itemListElement as Array<{ item: string }>)[2].item,
    canonicalUrl,
  );
  assert.equal(data[2]["@id"], `${canonicalUrl}#faq`);
});

test("metadata, sitemap, and JSON-LD resolve one canonical service identity", () => {
  const baseUrl = "https://www.c-electronics.online";
  const service = {
    name: "ติดตั้งกล้องวงจรปิด",
    slug: "ติดตั้งกล้องวงจรปิด-เชียงราย",
    description: "บริการติดตั้งกล้องวงจรปิดสำหรับบ้านและธุรกิจ",
    status: "published" as const,
    archived: false,
    noIndex: false,
    canonicalUrl: "/services/cctv-main",
  };
  const canonical = resolveServiceCanonical(service, baseUrl);
  const seo = resolveServiceSeo(service);
  const sitemap = buildSitemapEntries({
    baseUrl,
    now: new Date("2026-08-01T00:00:00.000Z"),
    products: [],
    services: [
      {
        slug: service.slug,
        canonicalUrl: service.canonicalUrl,
        updatedAt: new Date("2026-07-31T10:00:00.000Z"),
      },
    ],
    articles: [],
  });
  const structured = buildServiceStructuredData({
    ...service,
    image: null,
    price: null,
    faqs: [],
    updatedAt: new Date("2026-07-31T10:00:00.000Z"),
    canonicalUrl: canonical,
  });
  const sitemapService = sitemap.find((entry) => entry.priority === 0.8 && entry.url.includes("cctv"));

  assert.equal(canonical, "https://www.c-electronics.online/services/cctv-main");
  assert.equal(seo.canonical, canonical);
  assert.equal(sitemapService?.url, canonical);
  assert.equal(structured[0]["@id"], canonical);
  assert.equal(structured[0].url, canonical);
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
