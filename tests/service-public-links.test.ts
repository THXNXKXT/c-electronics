import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getPublishedServiceHref,
  getRelatedServiceHref,
} from "../src/lib/services";

const publishedAt = new Date("2026-07-31T08:00:00.000Z");

function getRenderedAttribute(tag: string, name: string): string | undefined {
  const match = tag.match(
    new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"),
  );
  return match?.[1] ?? match?.[2];
}

function enclosingAnchorHrefForImage(
  markup: string,
  imageSrc: string,
): string | null | undefined {
  const anchorHrefs: Array<string | null> = [];
  const tags = markup.matchAll(
    /<\/?([A-Za-z][A-Za-z0-9:-]*)(?:\s[^<>]*?)?\/?>/g,
  );

  for (const match of tags) {
    const tag = match[0];
    const name = match[1].toLocaleLowerCase();
    const closing = tag.startsWith("</");

    if (name === "a") {
      if (closing) anchorHrefs.pop();
      else anchorHrefs.push(getRenderedAttribute(tag, "href") ?? null);
      continue;
    }

    if (
      !closing &&
      name === "img" &&
      getRenderedAttribute(tag, "src") === imageSrc
    ) {
      return anchorHrefs.at(-1) ?? null;
    }
  }

  return undefined;
}

test("image link inspection ignores href props on non-anchor elements", () => {
  const falseAnchor = React.createElement(
    "div",
    { href: "/services/not-an-anchor" },
    React.createElement("img", { src: "/false-anchor.webp", alt: "" }),
  );
  const markup = renderToStaticMarkup(falseAnchor);

  assert.equal(
    enclosingAnchorHrefForImage(markup, "/false-anchor.webp"),
    null,
  );
});

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

test("related articles fall back to the service hub for non-public details", () => {
  const published = {
    slug: "published-service",
    status: "published" as const,
    publishedAt,
    archived: false,
  };
  const draft = {
    slug: "draft-service",
    status: "draft" as const,
    publishedAt: null,
    archived: false,
  };

  assert.equal(
    getRelatedServiceHref(published),
    "/services/published-service",
  );
  assert.equal(getRelatedServiceHref(draft), "/services");
  assert.doesNotMatch(getRelatedServiceHref(published), /#/);
  assert.doesNotMatch(getRelatedServiceHref(draft), /#/);
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

test("home cards link published details and keep draft booking actions", async () => {
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost/test";
  const { HomeClient } = await import("../src/app/(public)/home-client");
  const services = [
    {
      id: "published",
      name: "Published",
      slug: "published-service",
      description: null,
      price: null,
      icon: "Wrench",
      image: "/published-home.webp",
      imageAlt: "Published cover alt",
      features: null,
      status: "published" as const,
      publishedAt,
      archived: false,
    },
    {
      id: "draft",
      name: "Draft fallback name",
      slug: "draft-service",
      description: null,
      price: null,
      icon: "Wrench",
      image: "/draft-home.webp",
      imageAlt: null,
      features: null,
      status: "draft" as const,
      publishedAt: null,
      archived: false,
    },
  ];
  const markup = renderToStaticMarkup(
    React.createElement(HomeClient, {
      services,
      products: [],
      articles: [],
    }),
  );

  assert.equal(
    enclosingAnchorHrefForImage(markup, "/published-home.webp"),
    "/services/published-service",
  );
  assert.equal(
    enclosingAnchorHrefForImage(markup, "/draft-home.webp"),
    null,
  );
  assert.match(markup, /href="\/services\/published-service"/);
  assert.equal(
    markup.match(/href="\/services\/published-service"/g)?.length,
    2,
  );
  assert.doesNotMatch(markup, /href="\/services\/draft-service"/);
  assert.match(markup, /<img[^>]+alt="Published cover alt"/);
  assert.match(markup, /<img[^>]+alt="Draft fallback name"/);
  assert.match(
    markup,
    /<a[^>]+href="\/services\/published-service"[^>]*>Published<\/a>/,
  );
  assert.match(markup, /href="\/booking\?service=published-service"/);
  assert.match(markup, /href="\/booking\?service=draft-service"/);
  assert.doesNotMatch(markup, /\/services#/);
});
