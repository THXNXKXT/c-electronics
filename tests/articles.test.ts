import assert from "node:assert/strict";
import test from "node:test";

const modulePath = "../src/lib/articles";

async function loadArticlesModule() {
  const articlesModule = await import(modulePath).catch(() => null);

  assert.ok(articlesModule, "article domain utilities must be implemented");
  return articlesModule;
}

test("creates stable Thai article slugs and a safe fallback", async () => {
  const { slugifyArticleTitle } = await loadArticlesModule();

  assert.equal(
    slugifyArticleTitle(" วิธีเลือก BTU แอร์ ให้เหมาะกับห้อง! "),
    "วิธีเลือก-btu-แอร์-ให้เหมาะกับห้อง",
  );
  assert.equal(slugifyArticleTitle("###"), "article");
});

test("accepts only canonical URLs on the website", async () => {
  const { sanitizeCanonical } = await loadArticlesModule();

  assert.equal(
    sanitizeCanonical("/articles/เลือกแอร์"),
    "https://www.c-electronics.online/articles/%E0%B9%80%E0%B8%A5%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B9%81%E0%B8%AD%E0%B8%A3%E0%B9%8C",
  );
  assert.equal(
    sanitizeCanonical(
      "https://www.c-electronics.online/articles/cctv#comparison",
    ),
    "https://www.c-electronics.online/articles/cctv",
  );
  assert.equal(
    sanitizeCanonical("https://example.com/articles/cctv"),
    undefined,
  );
  assert.equal(sanitizeCanonical("javascript:alert(1)"), undefined);
});

test("builds automatic SEO values while honoring safe overrides", async () => {
  const { resolveArticleSeo } = await loadArticlesModule();
  const longExcerpt = "คำแนะนำสำหรับเจ้าของบ้าน ".repeat(20).trim();

  assert.deepEqual(
    resolveArticleSeo({
      title: "วิธีเลือกกล้องวงจรปิด",
      slug: "เลือกกล้องวงจรปิด",
      excerpt: longExcerpt,
      status: "published",
      archived: false,
      noIndex: false,
      seoTitle: "คู่มือเลือก CCTV สำหรับบ้าน",
      seoDescription: "เปรียบเทียบระบบกล้องให้เหมาะกับบ้านของคุณ",
      canonicalUrl: "/articles/cctv-guide",
    }),
    {
      title: "คู่มือเลือก CCTV สำหรับบ้าน",
      description: "เปรียบเทียบระบบกล้องให้เหมาะกับบ้านของคุณ",
      canonical: "https://www.c-electronics.online/articles/cctv-guide",
      indexable: true,
    },
  );

  const automatic = resolveArticleSeo({
    title: "วิธีเลือกกล้องวงจรปิด",
    slug: "เลือกกล้องวงจรปิด",
    excerpt: longExcerpt,
    status: "draft",
    archived: false,
    noIndex: false,
  });

  assert.equal(automatic.title, "วิธีเลือกกล้องวงจรปิด");
  assert.equal(
    automatic.canonical,
    "https://www.c-electronics.online/articles/%E0%B9%80%E0%B8%A5%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B8%81%E0%B8%A5%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B8%A7%E0%B8%87%E0%B8%88%E0%B8%A3%E0%B8%9B%E0%B8%B4%E0%B8%94",
  );
  assert.ok(automatic.description.length <= 160);
  assert.equal(automatic.indexable, false);
});

test("only published, active, indexable articles enter the sitemap", async () => {
  const { isIndexableArticle } = await loadArticlesModule();

  assert.equal(
    isIndexableArticle({
      status: "published",
      archived: false,
      noIndex: false,
    }),
    true,
  );
  assert.equal(
    isIndexableArticle({
      status: "draft",
      archived: false,
      noIndex: false,
    }),
    false,
  );
  assert.equal(
    isIndexableArticle({
      status: "published",
      archived: true,
      noIndex: false,
    }),
    false,
  );
  assert.equal(
    isIndexableArticle({
      status: "published",
      archived: false,
      noIndex: true,
    }),
    false,
  );
});

test("extracts unique H2 and H3 table-of-contents anchors", async () => {
  const { extractTableOfContents } = await loadArticlesModule();
  const content = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "ตรวจสอบเบื้องต้น" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "รายละเอียด" }],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "ตรวจสอบเบื้องต้น" }],
      },
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "ไม่ต้องนำมาแสดง" }],
      },
    ],
  };

  assert.deepEqual(extractTableOfContents(content), [
    {
      id: "ตรวจสอบเบื้องต้น",
      text: "ตรวจสอบเบื้องต้น",
      level: 2,
    },
    {
      id: "ตรวจสอบเบื้องต้น-2",
      text: "ตรวจสอบเบื้องต้น",
      level: 3,
    },
  ]);
});

test("revalidates every page that can display article data", async () => {
  const { getArticleRevalidationPaths } = await loadArticlesModule();

  assert.deepEqual(getArticleRevalidationPaths("cctv-guide"), [
    "/admin/articles",
    "/articles",
    "/articles/cctv-guide",
    "/",
    "/sitemap.xml",
  ]);
});

test("rejects executable URLs and unsupported rich-text nodes", async () => {
  const { sanitizeArticleUrl, isValidArticleDocument } =
    await loadArticlesModule();

  assert.equal(sanitizeArticleUrl("/booking", "link"), "/booking");
  assert.equal(sanitizeArticleUrl("/images/service.jpg", "image"), "/images/service.jpg");
  assert.equal(sanitizeArticleUrl("/\\evil.example/pixel.png", "image"), undefined);
  assert.equal(
    sanitizeArticleUrl("https://res.cloudinary.com/demo/image.jpg", "image"),
    "https://res.cloudinary.com/demo/image.jpg",
  );
  assert.equal(
    sanitizeArticleUrl("https://example.com/untrusted-image.jpg", "image"),
    undefined,
  );
  assert.equal(sanitizeArticleUrl("javascript:alert(1)", "link"), undefined);
  assert.equal(sanitizeArticleUrl("data:text/html,boom", "image"), undefined);
  assert.equal(
    isValidArticleDocument({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "เนื้อหาปลอดภัย" }],
        },
      ],
    }),
    true,
  );
  assert.equal(
    isValidArticleDocument({
      type: "doc",
      content: [{ type: "script", content: [{ type: "text", text: "boom" }] }],
    }),
    false,
  );
  assert.equal(
    isValidArticleDocument({
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: "https://example.com/image.jpg", alt: "" },
        },
      ],
    }),
    false,
  );
  assert.equal(
    isValidArticleDocument({ type: "doc", content: [null] }),
    false,
  );
});

test("locks URLs after first publication and only hard-deletes new drafts", async () => {
  const { canChangeArticleSlug, canDeleteArticlePermanently } =
    await loadArticlesModule();

  assert.equal(canChangeArticleSlug({ publishedAt: null }), true);
  assert.equal(
    canChangeArticleSlug({ publishedAt: new Date("2026-07-30") }),
    false,
  );
  assert.equal(
    canDeleteArticlePermanently({ status: "draft", publishedAt: null }),
    true,
  );
  assert.equal(
    canDeleteArticlePermanently({
      status: "draft",
      publishedAt: new Date("2026-07-30"),
    }),
    false,
  );
  assert.equal(
    canDeleteArticlePermanently({ status: "published", publishedAt: null }),
    false,
  );
});

test("decodes percent-encoded Thai slugs before querying the database", async () => {
  const { normalizeArticleRouteSlug } = await loadArticlesModule();
  const encoded =
    "%E0%B9%80%E0%B8%A5%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B8%AD%E0%B8%B0%E0%B9%84%E0%B8%AB%E0%B8%A5%E0%B9%88%E0%B8%AD%E0%B8%B4%E0%B9%80%E0%B8%A5%E0%B9%87%E0%B8%81%E0%B8%97%E0%B8%A3%E0%B8%AD%E0%B8%99%E0%B8%B4%E0%B8%81%E0%B8%AA%E0%B9%8C-%E0%B8%95%E0%B8%A3%E0%B8%87%E0%B8%AA%E0%B9%80%E0%B8%9B%E0%B8%81-%E0%B8%9B%E0%B8%A5%E0%B8%AD%E0%B8%94%E0%B8%A0%E0%B8%B1%E0%B8%A2";

  assert.equal(
    normalizeArticleRouteSlug(encoded),
    "เลือกอะไหล่อิเล็กทรอนิกส์-ตรงสเปก-ปลอดภัย",
  );
  assert.equal(normalizeArticleRouteSlug("cctv-guide"), "cctv-guide");
  assert.equal(normalizeArticleRouteSlug("%E0%A4%A"), "%E0%A4%A");
});

test("maps each article transition to the matching confirmation modal", async () => {
  const modulePath = "../src/lib/article-confirmations";
  const confirmationModule = await import(modulePath).catch(() => null);
  assert.ok(
    confirmationModule,
    "article confirmation states must be implemented",
  );

  const title = "คู่มือเลือกอะไหล่";
  assert.deepEqual(confirmationModule.getArticleConfirmation("publish", title), {
    title: "เผยแพร่บทความ",
    message: "เผยแพร่ “คู่มือเลือกอะไหล่” บนเว็บไซต์หรือไม่?",
    confirmLabel: "เผยแพร่",
    variant: "primary",
  });
  assert.deepEqual(
    confirmationModule.getArticleConfirmation("unpublish", title),
    {
      title: "ยกเลิกเผยแพร่",
      message: "นำ “คู่มือเลือกอะไหล่” ออกจากหน้าเว็บไซต์หรือไม่?",
      confirmLabel: "ยกเลิกเผยแพร่",
      variant: "warning",
    },
  );
  assert.deepEqual(confirmationModule.getArticleConfirmation("archive", title), {
    title: "เก็บบทความถาวร",
    message:
      "เก็บ “คู่มือเลือกอะไหล่” เข้าคลังหรือไม่? บทความจะถูกยกเลิกเผยแพร่ด้วย",
    confirmLabel: "เก็บถาวร",
    variant: "warning",
  });
  assert.deepEqual(confirmationModule.getArticleConfirmation("restore", title), {
    title: "นำบทความกลับมา",
    message: "นำ “คู่มือเลือกอะไหล่” กลับมาเป็นฉบับร่างหรือไม่?",
    confirmLabel: "นำกลับมา",
    variant: "primary",
  });
  assert.deepEqual(confirmationModule.getArticleConfirmation("delete", title), {
    title: "ลบร่างบทความ",
    message:
      "ลบร่าง “คู่มือเลือกอะไหล่” ถาวรหรือไม่? การทำรายการนี้ย้อนกลับไม่ได้",
    confirmLabel: "ลบร่าง",
    variant: "danger",
  });
});
