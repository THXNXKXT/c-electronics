import { ServiceDetail } from "@/components/service-detail";
import {
  getAdminService,
  listPublishedArticlesForService,
} from "@/lib/service-queries";
import { ExternalLink, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
  title: "ตัวอย่างบริการ",
  robots: { index: false, follow: false },
};

export default async function ServicePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const service = await getAdminService((await params).id);
  if (!service) notFound();
  const relatedArticles = await listPublishedArticlesForService(service.id, 3);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-warning/20 bg-warning/5 px-5 py-4">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <TriangleAlert className="size-4 text-warning" aria-hidden="true" />
          <span>
            โหมดตัวอย่าง · สถานะ{" "}
            {service.archived
              ? "เก็บถาวร"
              : service.status === "published"
                ? "เผยแพร่แล้ว"
                : "ฉบับร่าง"}
          </span>
        </p>
        <div className="flex flex-wrap gap-3">
          {service.status === "published" && !service.archived && (
            <Link
              href={`/services/${encodeURIComponent(service.slug)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-active"
            >
              เปิดหน้าจริง <ExternalLink className="size-4" aria-hidden="true" />
            </Link>
          )}
          <Link
            href={`/admin/services/${service.id}/edit`}
            className="text-sm font-semibold text-primary-active"
          >
            กลับไปแก้ไข
          </Link>
        </div>
      </div>

      <ServiceDetail
        service={service}
        relatedArticles={relatedArticles}
        preview
      />
    </div>
  );
}
