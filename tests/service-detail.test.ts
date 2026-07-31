import assert from "node:assert/strict";
import test from "node:test";
import { buildServiceStructuredData } from "../src/lib/services";

test("omits FAQPage when the page has no visible FAQ", () => {
  const data = buildServiceStructuredData({
    name: "ซ่อมเครื่องใช้ไฟฟ้า",
    slug: "ซ่อมเครื่องใช้ไฟฟ้า",
    description: "ตรวจอาการและประเมินความคุ้มค่าก่อนซ่อม",
    image: null,
    price: "ตามอาการ",
    faqs: [],
    updatedAt: new Date("2026-07-31"),
  });

  assert.equal(data.some((item) => item["@type"] === "FAQPage"), false);
  assert.equal(data.some((item) => item["@type"] === "Service"), true);
  assert.equal(JSON.stringify(data).includes("C.Electronics"), true);
});
