import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConfirmModal } from "../src/components/confirm-modal";
import { ImageUpload } from "../src/components/image-upload";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { getServiceConfirmation } from "../src/lib/service-confirmations";

test("confirmation dialog exposes its title and named close control", () => {
  const markup = renderToStaticMarkup(
    React.createElement(ConfirmModal, {
      open: true,
      title: "ยืนยันการเผยแพร่",
      message: "เผยแพร่บริการหรือไม่",
      onConfirm() {},
      onCancel() {},
    }),
  );

  assert.match(markup, /role="dialog"/);
  assert.match(markup, /aria-modal="true"/);
  assert.match(markup, /aria-labelledby="confirm-modal-title"/);
  assert.match(markup, /aria-describedby="confirm-modal-description"/);
  assert.match(markup, /id="confirm-modal-description"/);
  assert.match(markup, /aria-label="ปิดหน้าต่างยืนยัน"/);
  assert.match(
    markup,
    /role="dialog"[^>]*class="[^"]*max-h-\[calc\(100dvh-2rem\)\][^"]*overflow-y-auto/,
  );
});

test("slug confirmation visibly and safely renders the exact URL transition", () => {
  const copy = getServiceConfirmation("slug-change", "บริการทดสอบ", {
    oldSlug: "เดิม<script>alert(1)</script>",
    newSlug: "ใหม่<img src=x>",
  });
  const markup = renderToStaticMarkup(
    React.createElement(ConfirmModal, {
      open: true,
      ...copy,
      onConfirm() {},
      onCancel() {},
    }),
  );

  assert.match(markup, /URL เดิม/);
  assert.match(markup, /URL ใหม่/);
  assert.match(markup, /เดิม&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(markup, /ใหม่&lt;img src=x&gt;/);
  assert.match(markup, /→/);
  assert.doesNotMatch(markup, /<script>|<img src=x>/);
});

test("slug confirmation wraps and preserves the longest accepted transition", () => {
  const oldSlug = "ก".repeat(2_048);
  const newSlug = "ข".repeat(180);
  const copy = getServiceConfirmation("slug-change", "บริการทดสอบ", {
    oldSlug,
    newSlug,
  });
  const markup = renderToStaticMarkup(
    React.createElement(ConfirmModal, {
      open: true,
      ...copy,
      onConfirm() {},
      onCancel() {},
    }),
  );

  assert.ok(markup.includes(`/services/${oldSlug}`));
  assert.ok(markup.includes(`/services/${newSlug}`));
  assert.match(
    markup,
    /id="confirm-modal-description"[^>]*class="[^"]*break-all/,
  );
});

test("image upload uses a keyboard button and names image removal", () => {
  const markup = renderToStaticMarkup(
    React.createElement(ImageUpload, {
      value: "/service.jpg",
      onChange() {},
    }),
  );

  assert.match(
    markup,
    /<button[^>]*type="button"[^>]*aria-label="เปลี่ยนรูป"/,
  );
  assert.match(markup, /aria-label="ลบรูปที่อัปโหลด"/);
  assert.match(markup, /<input[^>]*type="file"/);
});

test("service row action names include the service and hide unsafe delete", async () => {
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost/test";
  const { ServiceRowActions } = await import(
    "../src/app/admin/(protected)/services/service-row-actions"
  );
  const renderActions = (archived: boolean, publishedAt: Date | null) =>
    renderToStaticMarkup(
      React.createElement(
        AppRouterContext.Provider,
        { value: {} as never },
        React.createElement(ServiceRowActions, {
          service: {
            id: "service-1",
            name: "ติดตั้งแอร์",
            status: "draft",
            archived,
            publishedAt,
          },
        }),
      ),
    );

  const draftMarkup = renderActions(false, null);
  assert.match(draftMarkup, /aria-label="เผยแพร่ ติดตั้งแอร์"/);
  assert.match(draftMarkup, /aria-label="เก็บถาวร ติดตั้งแอร์"/);
  assert.match(draftMarkup, /aria-label="ลบร่าง ติดตั้งแอร์"/);

  const archivedMarkup = renderActions(
    true,
    new Date("2026-07-31T00:00:00.000Z"),
  );
  assert.match(archivedMarkup, /aria-label="นำกลับมา ติดตั้งแอร์"/);
  assert.doesNotMatch(archivedMarkup, /aria-label="เผยแพร่ ติดตั้งแอร์"/);
  assert.doesNotMatch(archivedMarkup, /aria-label="ลบร่าง ติดตั้งแอร์"/);
});
