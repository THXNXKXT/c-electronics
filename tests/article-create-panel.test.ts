import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

test("the article create dropdown renders the complete article editor", async () => {
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost/test";

  const { ArticleCreatePanel } = await import(
    "../src/app/admin/(protected)/articles/article-quick-create"
  );

  assert.equal(typeof ArticleCreatePanel, "function");

  const markup = renderToStaticMarkup(
    React.createElement(
      AppRouterContext.Provider,
      { value: {} as never },
      React.createElement(ArticleCreatePanel, {
        options: {
          services: [{ id: "service-1", name: "ติดตั้งแอร์" }],
          products: [
            { id: "product-1", name: "คาปาซิเตอร์", category: "อะไหล่" },
          ],
        },
      }),
    ),
  );

  for (const field of [
    'name="title"',
    'name="slug"',
    'name="excerpt"',
    'name="content"',
    'name="category"',
    'name="tags"',
    'name="coverImageAlt"',
    'name="relatedServiceId"',
    'name="productIds"',
    'name="seoTitle"',
    'name="seoDescription"',
    'name="canonicalUrl"',
    'name="noIndex"',
  ]) {
    assert.match(markup, new RegExp(field), `missing full editor field ${field}`);
  }
});
