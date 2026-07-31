import assert from "node:assert/strict";
import test from "node:test";
import {
  canSubmitServiceSlugChangeConfirmation,
  getServiceRowActionAvailability,
  isServicePublicationBlocked,
  isServiceFormBusy,
  serializeServiceEditorState,
  shouldAcknowledgeServiceSave,
} from "../src/lib/service-admin-ui";

test("service editor serialization omits blank rows but preserves partial rows for validation", () => {
  const fields = serializeServiceEditorState({
    content: {
      type: "doc",
      content: [{ type: "paragraph", content: [] }],
    },
    image: "/service.jpg",
    imagePublicId: "",
    features: [" จุดเด่น ", ""],
    processSteps: [
      { title: "", description: "" },
      { title: "สำรวจ", description: "" },
    ],
    faqs: [
      { question: "", answer: "" },
      { question: "รับประกันไหม", answer: "รับประกันงานติดตั้ง" },
    ],
  });

  assert.equal(fields.features, "จุดเด่น");
  assert.equal(fields.image, "/service.jpg");
  assert.deepEqual(JSON.parse(fields.processSteps), [
    { title: "สำรวจ", description: "" },
  ]);
  assert.deepEqual(JSON.parse(fields.faqs), [
    { question: "รับประกันไหม", answer: "รับประกันงานติดตั้ง" },
  ]);
});

test("service row lifecycle gating follows publication and archive state", () => {
  assert.deepEqual(
    getServiceRowActionAvailability({
      status: "draft",
      archived: false,
      publishedAt: null,
    }),
    { publication: "publish", archive: "archive", canDelete: true },
  );
  assert.deepEqual(
    getServiceRowActionAvailability({
      status: "published",
      archived: false,
      publishedAt: new Date("2026-07-31T00:00:00.000Z"),
    }),
    { publication: "unpublish", archive: "archive", canDelete: false },
  );
  assert.deepEqual(
    getServiceRowActionAvailability({
      status: "draft",
      archived: true,
      publishedAt: new Date("2026-07-31T00:00:00.000Z"),
    }),
    { publication: null, archive: "restore", canDelete: false },
  );
});

test("service form stays busy for a mutation or an image upload", () => {
  assert.equal(isServiceFormBusy(false, false), false);
  assert.equal(isServiceFormBusy(true, false), true);
  assert.equal(isServiceFormBusy(false, true), true);
});

test("dirty editor state blocks publish but not unpublish", () => {
  assert.equal(isServicePublicationBlocked("publish", true, false), true);
  assert.equal(isServicePublicationBlocked("publish", false, false), false);
  assert.equal(isServicePublicationBlocked("unpublish", true, false), false);
  assert.equal(isServicePublicationBlocked("publish", false, true), true);
});

test("save acknowledgement never clears edits newer than its snapshot", () => {
  assert.equal(shouldAcknowledgeServiceSave(4, 4), true);
  assert.equal(shouldAcknowledgeServiceSave(4, 5), false);
});

test("slug confirmation submits only one current idle save snapshot", () => {
  assert.equal(
    canSubmitServiceSlugChangeConfirmation({
      submittedRevision: 4,
      currentRevision: 4,
      busy: false,
      alreadySubmitting: false,
    }),
    true,
  );
  assert.equal(
    canSubmitServiceSlugChangeConfirmation({
      submittedRevision: 4,
      currentRevision: 5,
      busy: false,
      alreadySubmitting: false,
    }),
    false,
  );
  assert.equal(
    canSubmitServiceSlugChangeConfirmation({
      submittedRevision: 4,
      currentRevision: 4,
      busy: true,
      alreadySubmitting: false,
    }),
    false,
  );
  assert.equal(
    canSubmitServiceSlugChangeConfirmation({
      submittedRevision: 4,
      currentRevision: 4,
      busy: false,
      alreadySubmitting: true,
    }),
    false,
  );
});
