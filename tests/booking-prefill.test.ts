import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("the booking select starts with the validated service name", async () => {
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost/test";
  const { BookingClient } = await import(
    "../src/app/(public)/booking/booking-client"
  );

  const markup = renderToStaticMarkup(
    React.createElement(BookingClient, {
      serviceTypes: ["บริการซ่อมแอร์", "ระบบไฟฟ้า"],
      phone: "0XX-XXX-XXXX",
      initialServiceType: "บริการซ่อมแอร์",
    }),
  );

  assert.match(
    markup,
    /<option value="บริการซ่อมแอร์" selected="">บริการซ่อมแอร์<\/option>/,
  );
  assert.doesNotMatch(
    markup,
    /<option value="ระบบไฟฟ้า" selected="">ระบบไฟฟ้า<\/option>/,
  );
});
