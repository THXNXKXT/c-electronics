import assert from "node:assert/strict";
import test from "node:test";
import * as serviceDomain from "../src/lib/services";

const { buildServiceStructuredData } = serviceDomain;

test("omits FAQPage when the page has no visible FAQ", () => {
  const data = buildServiceStructuredData({
    name: "ซ่อมเครื่องใช้ไฟฟ้า",
    slug: "ซ่อมเครื่องใช้ไฟฟ้า",
    description: "ตรวจอาการและประเมินความคุ้มค่าก่อนซ่อม",
    image: null,
    price: "ตามอาการ",
    faqs: [],
    updatedAt: new Date("2026-07-31"),
    canonicalUrl:
      "https://www.c-electronics.online/services/%E0%B8%8B%E0%B9%88%E0%B8%AD%E0%B8%A1%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B9%83%E0%B8%8A%E0%B9%89%E0%B9%84%E0%B8%9F%E0%B8%9F%E0%B9%89%E0%B8%B2",
  });

  assert.equal(data.some((item) => item["@type"] === "FAQPage"), false);
  assert.equal(data.some((item) => item["@type"] === "Service"), true);
  assert.equal(JSON.stringify(data).includes("C.Electronics"), true);
});

test("normalizes every accepted service image form for next/image", () => {
  const normalizeImage = Reflect.get(
    serviceDomain,
    "normalizeServiceImageSource",
  );
  assert.equal(typeof normalizeImage, "function");

  const cloudinary =
    "https://res.cloudinary.com/demo/image/upload/c-electronics/services/air.jpg";
  assert.equal(normalizeImage(cloudinary), cloudinary);
  assert.equal(
    normalizeImage(
      "https://www.c-electronics.online/images/services/air.jpg?size=wide",
    ),
    "/images/services/air.jpg?size=wide",
  );
  assert.equal(
    normalizeImage(
      "https://www.c-electronics.online//images/services/air.jpg",
    ),
    "/images/services/air.jpg",
  );
  assert.equal(
    normalizeImage("/images/services/air.jpg"),
    "/images/services/air.jpg",
  );
  assert.equal(
    normalizeImage("//images/services/air.jpg"),
    "/images/services/air.jpg",
  );
  assert.equal(normalizeImage(null), null);
});

test("prefills booking only when the query matches a listed service slug", () => {
  const resolvePrefill = Reflect.get(
    serviceDomain,
    "resolveBookingServicePrefill",
  );
  assert.equal(typeof resolvePrefill, "function");

  const availableServices = [
    { slug: "ซ่อมแอร์", name: "บริการซ่อมแอร์" },
    { slug: "electrical", name: "ระบบไฟฟ้า" },
  ];

  assert.equal(
    resolvePrefill(
      "%E0%B8%8B%E0%B9%88%E0%B8%AD%E0%B8%A1%E0%B9%81%E0%B8%AD%E0%B8%A3%E0%B9%8C",
      availableServices,
    ),
    "บริการซ่อมแอร์",
  );
  assert.equal(resolvePrefill("not-a-service", availableServices), null);
  assert.equal(resolvePrefill(["electrical"], availableServices), null);
});
