import assert from "node:assert/strict";
import test from "node:test";
import {
  createUploadActivityTracker,
  createUploadBusyCounter,
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
