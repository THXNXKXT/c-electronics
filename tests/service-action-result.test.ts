import assert from "node:assert/strict";
import test from "node:test";
import {
  SERVICE_ACTION_GENERIC_ERROR,
  ServiceUserFacingError,
  runAuthorizedServiceAction,
  toSafeServiceClientError,
  toServiceActionFailure,
  unwrapServiceActionResult,
} from "../src/lib/service-action-result";

test("client errors preserve typed messages and hide unexpected details", () => {
  const expected = new ServiceUserFacingError("ไม่พบบริการ");
  assert.equal(toSafeServiceClientError(expected), expected.message);

  const unexpected = new Error("auth token secret");
  assert.equal(toSafeServiceClientError(unexpected), SERVICE_ACTION_GENERIC_ERROR);
  assert.doesNotMatch(toSafeServiceClientError(unexpected), /auth|token|secret/i);
});

test("expected service failures preserve their Thai message without logging", () => {
  const logged: unknown[] = [];
  const result = toServiceActionFailure(
    new ServiceUserFacingError("ชื่อบริการไม่ถูกต้อง"),
    (error) => logged.push(error),
  );

  assert.deepEqual(result, { ok: false, error: "ชื่อบริการไม่ถูกต้อง" });
  assert.deepEqual(logged, []);
});

test("unexpected service failures are logged and return a safe message", () => {
  const secret = new Error("postgres password leaked");
  const logged: unknown[] = [];
  const result = toServiceActionFailure(secret, (error) => logged.push(error));

  assert.deepEqual(result, { ok: false, error: SERVICE_ACTION_GENERIC_ERROR });
  assert.deepEqual(logged, [secret]);
  assert.doesNotMatch(result.error, /postgres|password/i);
});

test("client result handling returns successful action data and throws returned errors", () => {
  assert.deepEqual(
    unwrapServiceActionResult({ ok: true, id: "service-1", slug: "air" }),
    { id: "service-1", slug: "air" },
  );
  assert.throws(
    () =>
      unwrapServiceActionResult({
        ok: false,
        error: "Slug นี้ถูกใช้งานแล้ว",
      }),
    /Slug นี้ถูกใช้งานแล้ว/,
  );
});

test("authorized action mapping never converts authentication failures", async () => {
  let operationCalled = false;

  await assert.rejects(
    () =>
      runAuthorizedServiceAction(
        async () => {
          throw new Error("unauthorized");
        },
        async () => {
          operationCalled = true;
          return {};
        },
      ),
    /unauthorized/,
  );
  assert.equal(operationCalled, false);
});

test("authorized action mapping serializes operation failures", async () => {
  const result = await runAuthorizedServiceAction(
    async () => {},
    async () => {
      throw new ServiceUserFacingError("ไม่พบบริการ");
    },
  );

  assert.deepEqual(result, { ok: false, error: "ไม่พบบริการ" });
});
