import assert from "node:assert/strict";
import test from "node:test";

test("public service cards filter only archived rows during migration", async () => {
  process.env.DATABASE_URL ??= "postgresql://user:password@localhost/test";
  const { buildPublicServiceCardsQuery } = await import(
    "../src/lib/service-queries"
  );
  const query = buildPublicServiceCardsQuery().toSQL();

  assert.match(query.sql, /"services"\."archived" = \$1/);
  assert.doesNotMatch(query.sql, /"services"\."status"/);
  assert.doesNotMatch(query.sql, /"services"\."published_at"/);
  assert.deepEqual(query.params, [false]);
});

test("public service cards project only the public card DTO", async () => {
  process.env.DATABASE_URL ??= "postgresql://user:password@localhost/test";
  const { buildPublicServiceCardsQuery } = await import(
    "../src/lib/service-queries"
  );
  const projection = buildPublicServiceCardsQuery()
    .toSQL()
    .sql.split(' from "services"')[0];

  assert.equal(
    projection,
    'select "id", "name", "slug", "description", "price", "icon", "image", "features", "image_alt", "status", "archived", "published_at"',
  );
  assert.doesNotMatch(
    projection,
    /content|process_steps|faqs|image_public_id|seo_|canonical_url|no_index|created_at|updated_at/,
  );
});

test("service sitemap query selects canonical data and every indexability guard", async () => {
  process.env.DATABASE_URL ??= "postgresql://user:password@localhost/test";
  const { buildIndexableServicesForSitemapQuery } = await import(
    "../src/lib/service-queries"
  );
  const query = buildIndexableServicesForSitemapQuery().toSQL();

  assert.match(
    query.sql,
    /^select "slug", "updated_at", "canonical_url" from "services"/,
  );
  assert.match(query.sql, /"services"\."status" = \$1/);
  assert.match(query.sql, /"services"\."archived" = \$2/);
  assert.match(query.sql, /"services"\."published_at" is not null/);
  assert.match(query.sql, /"services"\."no_index" = \$3/);
  assert.deepEqual(query.params, ["published", false, false]);
});
