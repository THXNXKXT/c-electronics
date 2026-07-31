import { getAdminService } from "@/lib/service-queries";
import { notFound } from "next/navigation";
import { ServiceForm } from "../../service-form";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const service = await getAdminService((await params).id);
  if (!service) notFound();
  return <ServiceForm service={service} />;
}
