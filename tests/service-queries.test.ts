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
