import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getPublishedServiceHref } from "../src/lib/services";

const publishedAt = new Date("2026-07-31T08:00:00.000Z");

test("builds a detail URL only for a currently published service", () => {
  assert.equal(
    getPublishedServiceHref({
      slug: "ติดตั้งจานดาวเทียม เชียงราย",
      status: "published",
      publishedAt,
      archived: false,
    }),
    "/services/%E0%B8%95%E0%B8%B4%E0%B8%94%E0%B8%95%E0%B8%B1%E0%B9%89%E0%B8%87%E0%B8%88%E0%B8%B2%E0%B8%99%E0%B8%94%E0%B8%B2%E0%B8%A7%E0%B9%80%E0%B8%97%E0%B8%B5%E0%B8%A2%E0%B8%A1%20%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B8%A3%E0%B8%B2%E0%B8%A2",
  );
  assert.equal(
    getPublishedServiceHref({
      slug: "draft-service",
      status: "draft",
      publishedAt: null,
      archived: false,
    }),
    null,
  );
  assert.equal(
    getPublishedServiceHref({
      slug: "archived-service",
      status: "published",
      publishedAt,
      archived: true,
    }),
    null,
  );
});

test("service hub keeps drafts visible but links only published title and image", async () => {
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost/test";
  const { ServicesClient } = await import(
    "../src/app/(public)/services/services-client"
  );
  const markup = renderToStaticMarkup(
    React.createElement(ServicesClient, {
      services: [
        {
          id: "published",
          name: "ติดตั้งจานดาวเทียม",
          slug: "ติดตั้งจานดาวเทียม",
          description: "บริการที่เผยแพร่",
          price: "เริ่มต้น 1,200 บาท",
          icon: "Satellite",
          image: "/published.webp",
          imageAlt: "ช่างกำลังปรับจานดาวเทียม",
          features: null,
          status: "published",
          publishedAt,
          archived: false,
        },
        {
          id: "draft",
          name: "บริการฉบับร่าง",
          slug: "บริการฉบับร่าง",
          description: "ยังไม่เผยแพร่รายละเอียด",
          price: null,
          icon: "Wrench",
          image: "/draft.webp",
          imageAlt: "ภาพบริการฉบับร่าง",
          features: null,
          status: "draft",
          publishedAt: null,
          archived: false,
        },
      ],
    }),
  );

  assert.match(
    markup,
    /href="\/services\/%E0%B8%95%E0%B8%B4%E0%B8%94%E0%B8%95%E0%B8%B1%E0%B9%89%E0%B8%87%E0%B8%88%E0%B8%B2%E0%B8%99%E0%B8%94%E0%B8%B2%E0%B8%A7%E0%B9%80%E0%B8%97%E0%B8%B5%E0%B8%A2%E0%B8%A1"/,
  );
  assert.doesNotMatch(markup, /href="\/services\/%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%89%E0%B8%9A%E0%B8%B1%E0%B8%9A%E0%B8%A3%E0%B9%88%E0%B8%B2%E0%B8%87"/);
  assert.match(markup, /บริการฉบับร่าง/);
  assert.match(markup, /alt="ช่างกำลังปรับจานดาวเทียม"/);
  assert.doesNotMatch(markup, /\/services#/);
});
