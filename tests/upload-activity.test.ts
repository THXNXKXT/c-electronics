import assert from "node:assert/strict";
import test from "node:test";
import { createUploadActivityTracker } from "../src/lib/upload-activity";

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
