import assert from "node:assert/strict";
import test from "node:test";
import { withTimeout } from "../src/lib/cloudinary";

test("bounds an external cleanup that never settles", async () => {
  await assert.rejects(
    withTimeout(new Promise(() => {}), 10),
    /timed out/,
  );
});

test("returns a completed cleanup result before its deadline", async () => {
  assert.equal(await withTimeout(Promise.resolve("deleted"), 100), "deleted");
});
