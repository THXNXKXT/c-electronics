import assert from "node:assert/strict";
import test from "node:test";

test("sitemap contains one canonical services page and no fragment URLs", async () => {
  const { buildSitemapEntries } = await import("../src/lib/sitemap-entries");
  const now = new Date("2026-07-31T12:00:00.000Z");
  const productUpdatedAt = new Date("2026-07-30T10:00:00.000Z");
  const articleUpdatedAt = new Date("2026-07-31T09:00:00.000Z");

  const entries = buildSitemapEntries({
    baseUrl: "https://www.c-electronics.online",
    now,
    products: [{ slug: "router-wifi-6", updatedAt: productUpdatedAt }],
    articles: [
      {
        slug: "เลือกอะไหล่อิเล็กทรอนิกส์",
        updatedAt: articleUpdatedAt,
      },
    ],
  });

  assert.deepEqual(
    entries.map((entry) => entry.url),
    [
      "https://www.c-electronics.online",
      "https://www.c-electronics.online/products",
      "https://www.c-electronics.online/services",
      "https://www.c-electronics.online/articles",
      "https://www.c-electronics.online/booking",
      "https://www.c-electronics.online/about",
      "https://www.c-electronics.online/contact",
      "https://www.c-electronics.online/products/router-wifi-6",
      "https://www.c-electronics.online/articles/%E0%B9%80%E0%B8%A5%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B8%AD%E0%B8%B0%E0%B9%84%E0%B8%AB%E0%B8%A5%E0%B9%88%E0%B8%AD%E0%B8%B4%E0%B9%80%E0%B8%A5%E0%B9%87%E0%B8%81%E0%B8%97%E0%B8%A3%E0%B8%AD%E0%B8%99%E0%B8%B4%E0%B8%81%E0%B8%AA%E0%B9%8C",
    ],
  );
  assert.equal(entries.some((entry) => entry.url.includes("#")), false);
  assert.equal(entries[3].lastModified, articleUpdatedAt);
});
