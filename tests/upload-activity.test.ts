import assert from "node:assert/strict";
import test from "node:test";
import {
  SAFE_IMAGE_UPLOAD_ERROR,
  createUploadActivityTracker,
  createUploadBusyCounter,
  toSafeImageUploadError,
} from "../src/lib/upload-activity";

test("upload activity reports one busy interval", () => {
  const states: boolean[] = [];
  const tracker = createUploadActivityTracker((uploading) =>
    states.push(uploading),
  );

  tracker.start();
  tracker.start();
  tracker.finish();
  tracker.finish();

  assert.deepEqual(states, [true, false]);
});

test("disposing an active upload clears parent busy state exactly once", () => {
  const states: boolean[] = [];
  const tracker = createUploadActivityTracker((uploading) =>
    states.push(uploading),
  );

  tracker.start();
  tracker.dispose();
  tracker.finish();

  assert.deepEqual(states, [true, false]);
});

test("upload counter stays busy until overlapping sources both finish", () => {
  const states: boolean[] = [];
  const counter = createUploadBusyCounter((uploading) =>
    states.push(uploading),
  );

  counter.setSourceActive("cover", true);
  counter.setSourceActive("inline", true);
  counter.setSourceActive("cover", false);
  assert.deepEqual(states, [true]);
  counter.setSourceActive("inline", false);

  assert.deepEqual(states, [true, false]);
});

test("disposed upload counter ignores Strict Mode cleanup replays", () => {
  const states: boolean[] = [];
  const counter = createUploadBusyCounter((uploading) =>
    states.push(uploading),
  );

  counter.setSourceActive("inline", true);
  counter.dispose();
  counter.setSourceActive("inline", false);
  counter.setSourceActive("cover", true);

  assert.deepEqual(states, [true]);
});

test("upload rejection details are logged but never shown to the user", () => {
  const rawError = new Error("HTTP 401 cloud token secret");
  const logged: unknown[] = [];

  const message = toSafeImageUploadError(rawError, (error) =>
    logged.push(error),
  );

  assert.equal(message, SAFE_IMAGE_UPLOAD_ERROR);
  assert.deepEqual(logged, [rawError]);
  assert.doesNotMatch(message, /HTTP|401|cloud|token|secret/i);
});
