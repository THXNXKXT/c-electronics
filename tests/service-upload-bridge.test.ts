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

  assert.match(source, /onUploadingChange=\{setImageUploading\}/);
  assert.match(source, /const busy = isServiceFormBusy\(pending, imageUploading\)/);
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
