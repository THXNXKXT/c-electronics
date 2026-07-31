import { listPublicServiceCards } from "@/lib/service-queries";
import { ServicesClient } from "./services-client";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const allServices = await listPublicServiceCards();

  return <ServicesClient services={allServices} />;
}
