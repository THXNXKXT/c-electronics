import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("service form bridges image upload activity into disabled actions", async () => {
  const source = await readFile(
    new URL(
      "../src/app/admin/(protected)/services/service-form.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(source, /onUploadingChange=\{handleCoverUploadingChange\}/);
  assert.match(source, /const busy = isServiceFormBusy\(pending, uploadsPending\)/);
  assert.match(source, /disabled=\{busy\}/);
  assert.match(source, /กำลังอัปโหลดรูป\.\.\./);
});

test("service form blocks stale publish and locks fields during a save snapshot", async () => {
  const source = await readFile(
    new URL(
      "../src/app/admin/(protected)/services/service-form.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(source, /onChange=\{markDirty\}/);
  assert.match(source, /<fieldset disabled=\{pending\}/);
  assert.match(source, /<ArticleRichTextEditor[\s\S]*?disabled=\{pending\}/);
  assert.match(source, /isServicePublicationBlocked\(/);
  assert.match(source, /setDirty\(false\)/);
  assert.match(source, /มีการแก้ไขที่ยังไม่ได้บันทึก/);
});

test("services table gives the actions column an accessible name", async () => {
  const source = await readFile(
    new URL(
      "../src/app/admin/(protected)/services/page.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(source, /aria-label="การดำเนินการ"/);
});

test("service form composes cover and inline upload activity", async () => {
  const [formSource, editorSource] = await Promise.all([
    readFile(
      new URL(
        "../src/app/admin/(protected)/services/service-form.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL("../src/components/article-rich-text-editor.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(editorSource, /onUploadingChange\?: \(uploading: boolean\) => void/);
  assert.match(formSource, /createUploadBusyCounter/);
  assert.match(formSource, /setSourceActive\("cover", uploading\)/);
  assert.match(formSource, /setSourceActive\("inline", uploading\)/);
  assert.match(formSource, /onUploadingChange=\{handleInlineUploadingChange\}/);
});

test("service save only clears dirty state for its captured revision", async () => {
  const source = await readFile(
    new URL(
      "../src/app/admin/(protected)/services/service-form.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(source, /editorRevision\.current \+= 1/);
  assert.match(source, /shouldAcknowledgeServiceSave\(/);
  assert.match(source, /save\(formData, editorRevision\.current\)/);
});

test("service clients map rejected runtime errors to a safe message", async () => {
  const sources = await Promise.all([
    readFile(
      new URL(
        "../src/app/admin/(protected)/services/service-form.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../src/app/admin/(protected)/services/service-row-actions.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  for (const source of sources) {
    assert.match(source, /setError\(toSafeServiceClientError\(caught\)\)/);
    assert.doesNotMatch(source, /caught instanceof Error \? caught\.message/);
  }
});

test("cover and inline image upload catches use the safe error mapper", async () => {
  const sources = await Promise.all([
    readFile(
      new URL("../src/components/image-upload.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/components/article-rich-text-editor.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  for (const source of sources) {
    assert.match(source, /toSafeImageUploadError\(/);
    assert.doesNotMatch(source, /setError\(err instanceof Error \? err\.message/);
    assert.doesNotMatch(source, /error instanceof Error \? error\.message/);
  }
});
