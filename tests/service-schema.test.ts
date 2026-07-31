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
