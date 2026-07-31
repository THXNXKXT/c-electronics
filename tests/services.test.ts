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
