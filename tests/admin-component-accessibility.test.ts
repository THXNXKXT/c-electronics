import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConfirmModal } from "../src/components/confirm-modal";
import { ImageUpload } from "../src/components/image-upload";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

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
  assert.match(markup, /aria-label="ปิดหน้าต่างยืนยัน"/);
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
