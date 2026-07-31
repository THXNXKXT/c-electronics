import assert from "node:assert/strict";
import test from "node:test";
import { parseServiceInput } from "../src/lib/service-input";

function validForm() {
  const form = new FormData();
  form.set("name", "ติดตั้งกล้องวงจรปิด");
  form.set("slug", "ติดตั้งกล้องวงจรปิด-เชียงราย");
  form.set(
    "description",
    "ออกแบบและติดตั้งระบบกล้องสำหรับบ้าน ร้านค้า และสำนักงานในเชียงราย",
  );
  form.set("price", "เริ่มต้น 3,500 ฿");
  form.set("icon", "Camera");
  form.set("features", "สำรวจหน้างาน|ตั้งค่าดูผ่านมือถือ");
  form.set(
    "content",
    JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "รายละเอียดบริการที่ปลอดภัย" }],
        },
      ],
    }),
  );
  form.set(
    "processSteps",
    JSON.stringify([
      {
        title: "สำรวจ",
        description: "ตรวจตำแหน่งติดตั้งและระบบเครือข่าย",
      },
    ]),
  );
  form.set(
    "faqs",
    JSON.stringify([
      {
        question: "ดูกล้องผ่านมือถือได้ไหม",
        answer: "ตั้งค่าได้เมื่ออินเทอร์เน็ตและอุปกรณ์รองรับ",
      },
    ]),
  );
  return form;
}

test("parses a complete service form", () => {
  const result = parseServiceInput(validForm());
  assert.equal(result.slug, "ติดตั้งกล้องวงจรปิด-เชียงราย");
  assert.equal(result.features, "สำรวจหน้างาน|ตั้งค่าดูผ่านมือถือ");
  assert.equal(result.processSteps.length, 1);
  assert.equal(result.faqs.length, 1);
});

test("rejects unsafe rich text and foreign canonical URLs", () => {
  const unsafe = validForm();
  unsafe.set(
    "content",
    JSON.stringify({ type: "doc", content: [{ type: "script" }] }),
  );
  assert.throws(() => parseServiceInput(unsafe), /เนื้อหา/);

  const foreign = validForm();
  foreign.set("canonicalUrl", "https://example.com/service");
  assert.throws(() => parseServiceInput(foreign), /Canonical/);
});

test("bounds process and FAQ content", () => {
  const form = validForm();
  form.set(
    "faqs",
    JSON.stringify(
      Array.from({ length: 21 }, (_, i) => ({
        question: `คำถาม ${i}`,
        answer: "คำตอบ",
      })),
    ),
  );
  assert.throws(() => parseServiceInput(form), /FAQ/);
});

test("rejects non-text process and FAQ fields", () => {
  const processForm = validForm();
  processForm.set(
    "processSteps",
    JSON.stringify([{ title: 123, description: "รายละเอียดขั้นตอน" }]),
  );
  assert.throws(() => parseServiceInput(processForm), /ขั้นตอน/);

  const faqForm = validForm();
  faqForm.set(
    "faqs",
    JSON.stringify([{ question: "คำถาม", answer: { html: "unsafe" } }]),
  );
  assert.throws(() => parseServiceInput(faqForm), /FAQ/);
});
