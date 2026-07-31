import assert from "node:assert/strict";
import test from "node:test";

test("normalizes only URL-equivalent sitemap path forms", async () => {
  const { normalizeSitemapUrlIdentity } = await import(
    "../src/lib/sitemap-entries"
  );
  const baseUrl = "https://www.c-electronics.online";

  assert.equal(
    normalizeSitemapUrlIdentity(
      "HTTPS://WWW.C-ELECTRONICS.ONLINE:443/services/%66oo/%7ebar",
      baseUrl,
    ),
    "https://www.c-electronics.online/services/foo/~bar",
  );
  assert.notEqual(
    normalizeSitemapUrlIdentity(
      "https://www.c-electronics.online/services/a%2fb",
      baseUrl,
    ),
    normalizeSitemapUrlIdentity(
      "https://www.c-electronics.online/services/a/b",
      baseUrl,
    ),
  );
  assert.notEqual(
    normalizeSitemapUrlIdentity(
      "https://www.c-electronics.online/services/foo?q=%66",
      baseUrl,
    ),
    normalizeSitemapUrlIdentity(
      "https://www.c-electronics.online/services/foo?q=f",
      baseUrl,
    ),
  );
});

test("deduplicates equivalent service canonicals with the newest timestamp", async () => {
  const { buildSitemapEntries } = await import("../src/lib/sitemap-entries");
  const baseUrl = "https://www.c-electronics.online";
  const now = new Date("2026-07-31T12:00:00.000Z");
  const oldest = new Date("2026-07-28T08:00:00.000Z");
  const newest = new Date("2026-07-31T10:00:00.000Z");
  const middle = new Date("2026-07-30T09:00:00.000Z");
  const services = [
    { slug: "foo", updatedAt: oldest, canonicalUrl: "/services/foo" },
    {
      slug: "encoded-foo",
      updatedAt: newest,
      canonicalUrl:
        "HTTPS://WWW.C-ELECTRONICS.ONLINE:443/services/%66oo#details",
    },
    { slug: "foo-copy", updatedAt: middle, canonicalUrl: "/services/foo" },
    {
      slug: "reserved-encoded",
      updatedAt: middle,
      canonicalUrl: "/services/a%2Fb",
    },
    { slug: "reserved-path", updatedAt: middle, canonicalUrl: "/services/a/b" },
  ];
  const build = (rows: typeof services) =>
    buildSitemapEntries({
      baseUrl,
      now,
      products: [],
      services: rows,
      articles: [],
    });

  for (const entries of [build(services), build([...services].reverse())]) {
    const fooEntries = entries.filter(
      (entry) => entry.url === `${baseUrl}/services/foo`,
    );
    assert.equal(fooEntries.length, 1);
    assert.equal(fooEntries[0].lastModified, newest);
    assert.equal(
      entries.some((entry) => entry.url === `${baseUrl}/services/a%2Fb`),
      true,
    );
    assert.equal(
      entries.some((entry) => entry.url === `${baseUrl}/services/a/b`),
      true,
    );
    assert.equal(entries.some((entry) => entry.url.includes("#")), false);
  }
});

test("sitemap contains one canonical services page and no fragment URLs", async () => {
  const { buildSitemapEntries } = await import("../src/lib/sitemap-entries");
  const now = new Date("2026-07-31T12:00:00.000Z");
  const productUpdatedAt = new Date("2026-07-30T10:00:00.000Z");
  const serviceUpdatedAt = new Date("2026-07-31T08:00:00.000Z");
  const articleUpdatedAt = new Date("2026-07-31T09:00:00.000Z");

  const entries = buildSitemapEntries({
    baseUrl: "https://www.c-electronics.online",
    now,
    products: [{ slug: "router-wifi-6", updatedAt: productUpdatedAt }],
    services: [
      {
        slug: "ติดตั้งจานดาวเทียม",
        updatedAt: serviceUpdatedAt,
      },
      {
        slug: "canonical-source",
        updatedAt: serviceUpdatedAt,
        canonicalUrl: "/services/จานดาวเทียม-เชียงราย?ref=sitemap#ราคา",
      },
      {
        slug: "invalid-canonical",
        updatedAt: serviceUpdatedAt,
        canonicalUrl: "https://example.com/services/wrong#fragment",
      },
      {
        slug: "canonical-duplicate",
        updatedAt: serviceUpdatedAt,
        canonicalUrl: "/services/จานดาวเทียม-เชียงราย",
      },
    ],
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
      "https://www.c-electronics.online/services/%E0%B8%95%E0%B8%B4%E0%B8%94%E0%B8%95%E0%B8%B1%E0%B9%89%E0%B8%87%E0%B8%88%E0%B8%B2%E0%B8%99%E0%B8%94%E0%B8%B2%E0%B8%A7%E0%B9%80%E0%B8%97%E0%B8%B5%E0%B8%A2%E0%B8%A1",
      "https://www.c-electronics.online/services/%E0%B8%88%E0%B8%B2%E0%B8%99%E0%B8%94%E0%B8%B2%E0%B8%A7%E0%B9%80%E0%B8%97%E0%B8%B5%E0%B8%A2%E0%B8%A1-%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B8%A3%E0%B8%B2%E0%B8%A2",
      "https://www.c-electronics.online/services/invalid-canonical",
      "https://www.c-electronics.online/articles/%E0%B9%80%E0%B8%A5%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B8%AD%E0%B8%B0%E0%B9%84%E0%B8%AB%E0%B8%A5%E0%B9%88%E0%B8%AD%E0%B8%B4%E0%B9%80%E0%B8%A5%E0%B9%87%E0%B8%81%E0%B8%97%E0%B8%A3%E0%B8%AD%E0%B8%99%E0%B8%B4%E0%B8%81%E0%B8%AA%E0%B9%8C",
    ],
  );
  assert.equal(entries.some((entry) => entry.url.includes("#")), false);
  assert.equal(entries.some((entry) => entry.url.includes("?")), false);
  assert.equal(
    entries.filter(
      (entry) =>
        entry.url ===
        "https://www.c-electronics.online/services/%E0%B8%88%E0%B8%B2%E0%B8%99%E0%B8%94%E0%B8%B2%E0%B8%A7%E0%B9%80%E0%B8%97%E0%B8%B5%E0%B8%A2%E0%B8%A1-%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B8%A3%E0%B8%B2%E0%B8%A2",
    ).length,
    1,
  );
  assert.equal(entries[3].lastModified, articleUpdatedAt);
  assert.equal(entries[8].lastModified, serviceUpdatedAt);
});
