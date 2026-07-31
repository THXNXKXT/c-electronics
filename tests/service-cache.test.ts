import assert from "node:assert/strict";
import test from "node:test";

test("revalidates every page that displays service data", async () => {
  const modulePath = "../src/lib/revalidate-service-pages";
  const serviceCacheModule = await import(modulePath).catch(() => null);

  assert.equal(
    typeof serviceCacheModule?.revalidateServicePages,
    "function",
    "revalidateServicePages must be implemented",
  );

  const revalidated: string[] = [];
  serviceCacheModule.revalidateServicePages(
    (path: string) => revalidated.push(path),
    ["old-slug", "new-slug"],
    ["cctv-guide"],
  );

  assert.deepEqual(revalidated, [
    "/admin/services",
    "/",
    "/services",
    "/booking",
    "/articles",
    "/sitemap.xml",
    "/services/old-slug",
    "/services/new-slug",
    "/articles/cctv-guide",
  ]);
});
