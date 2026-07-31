import assert from "node:assert/strict";
import test from "node:test";
import {
  completeLegacyServiceFormData,
  parseServiceInput,
} from "../src/lib/service-input";

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

test("rejects malformed nested rich text with the Thai content error", () => {
  const form = validForm();
  form.set("content", JSON.stringify({ type: "doc", content: [null] }));
  assert.throws(() => parseServiceInput(form), /เนื้อหา/);
});

test("derives an owned Cloudinary public ID and ignores submitted IDs", () => {
  const form = validForm();
  form.set(
    "image",
    "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v123/c-electronics/services/cctv.cover.jpg",
  );
  form.set("imagePublicId", "c-electronics/services/unrelated-victim");
  assert.equal(
    parseServiceInput(form).imagePublicId,
    "c-electronics/services/cctv.cover",
  );

  const outsideFolder = validForm();
  outsideFolder.set(
    "image",
    "https://res.cloudinary.com/demo/image/upload/v123/other-folder/victim.jpg",
  );
  assert.throws(() => parseServiceInput(outsideFolder), /Cloudinary/);

  const local = validForm();
  local.set("image", "/images/service.jpg");
  local.set("imagePublicId", "c-electronics/services/unrelated-victim");
  assert.equal(parseServiceInput(local).imagePublicId, null);
});

test("completes legacy create and edit payloads without wiping rich metadata", () => {
  const createForm = new FormData();
  createForm.set("name", "Legacy CCTV Service");
  createForm.set(
    "description",
    "A sufficiently detailed legacy service description.",
  );
  completeLegacyServiceFormData(createForm);
  const created = parseServiceInput(createForm);
  assert.equal(created.slug, "legacy-cctv-service");
  assert.deepEqual(created.processSteps, []);
  assert.deepEqual(created.faqs, []);

  const editForm = new FormData();
  editForm.set("name", "Updated Legacy CCTV Service");
  editForm.set(
    "description",
    "An updated and sufficiently detailed service description.",
  );
  editForm.set(
    "image",
    "https://res.cloudinary.com/demo/image/upload/v123/c-electronics/services/cctv.jpg",
  );
  completeLegacyServiceFormData(editForm, {
    slug: "stable-service-slug",
    icon: "Camera",
    image:
      "https://res.cloudinary.com/demo/image/upload/v123/c-electronics/services/cctv.jpg",
    imageAlt: "กล้องวงจรปิด",
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Preserved rich body" }],
        },
      ],
    },
    processSteps: [{ title: "Survey", description: "Inspect the site" }],
    faqs: [{ question: "Remote view?", answer: "Yes" }],
    featured: true,
    seoTitle: "Preserved SEO title",
    seoDescription: "Preserved SEO description",
    canonicalUrl: "/services/stable-service-slug",
    noIndex: true,
  });
  const updated = parseServiceInput(editForm);
  assert.equal(updated.slug, "stable-service-slug");
  assert.equal(updated.content.content?.[0]?.content?.[0]?.text, "Preserved rich body");
  assert.deepEqual(updated.processSteps, [
    { title: "Survey", description: "Inspect the site" },
  ]);
  assert.equal(updated.imageAlt, "กล้องวงจรปิด");
  assert.equal(updated.featured, true);
  assert.equal(updated.seoTitle, "Preserved SEO title");
  assert.equal(updated.noIndex, true);
});
