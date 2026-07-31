import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

test("service create dropdown contains the same complete editor fields", async () => {
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost/test";
  const { ServiceCreatePanel } = await import(
    "../src/app/admin/(protected)/services/service-quick-create"
  );
  const markup = renderToStaticMarkup(
    React.createElement(
      AppRouterContext.Provider,
      { value: {} as never },
      React.createElement(ServiceCreatePanel),
    ),
  );

  for (const field of [
    "name",
    "slug",
    "description",
    "price",
    "icon",
    "features",
    "content",
    "processSteps",
    "faqs",
    "imageAlt",
    "featured",
    "seoTitle",
    "seoDescription",
    "canonicalUrl",
    "noIndex",
  ]) {
    assert.match(
      markup,
      new RegExp(`name=["']${field}["']`),
      `missing ${field}`,
    );
  }
});

test("service edit form keeps one editable row for every structured list", async () => {
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost/test";
  const { ServiceForm } = await import(
    "../src/app/admin/(protected)/services/service-form"
  );
  const now = new Date("2026-07-31T00:00:00.000Z");
  const markup = renderToStaticMarkup(
    React.createElement(
      AppRouterContext.Provider,
      { value: {} as never },
      React.createElement(ServiceForm, {
        service: {
          id: "service-1",
          name: "บริการทดสอบ",
          slug: "บริการทดสอบ",
          description: "คำอธิบายบริการสำหรับใช้ตรวจสอบฟอร์มแก้ไข",
          price: null,
          icon: "Wrench",
          image: null,
          features: "",
          content: {
            type: "doc",
            content: [{ type: "paragraph", content: [] }],
          },
          processSteps: [],
          faqs: [],
          imageAlt: null,
          imagePublicId: null,
          status: "draft",
          featured: false,
          seoTitle: null,
          seoDescription: null,
          canonicalUrl: null,
          noIndex: false,
          archived: false,
          publishedAt: null,
          createdAt: now,
          updatedAt: now,
        },
      }),
    ),
  );

  assert.match(markup, /aria-label="จุดเด่นที่ 1"/);
  assert.match(markup, /aria-label="ชื่อขั้นตอนที่ 1"/);
  assert.match(markup, /aria-label="คำถาม FAQ ที่ 1"/);
});
