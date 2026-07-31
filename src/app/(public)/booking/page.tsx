import { db } from "@/db";
import { settings } from "@/db/schema";
import { listPublicServiceCards } from "@/lib/service-queries";
import { resolveBookingServicePrefill } from "@/lib/services";
import { BookingClient } from "./booking-client";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string | string[] }>;
}) {
  const [params, allServices, settingsRows] = await Promise.all([
    searchParams,
    listPublicServiceCards(),
    db.select().from(settings).limit(1),
  ]);

  const serviceTypes = allServices.map((s) => s.name);
  const initialServiceType = resolveBookingServicePrefill(
    params.service,
    allServices,
  );
  const phone = settingsRows[0]?.phone || "0XX-XXX-XXXX";

  return (
    <BookingClient
      serviceTypes={serviceTypes}
      phone={phone}
      initialServiceType={initialServiceType}
    />
  );
}
