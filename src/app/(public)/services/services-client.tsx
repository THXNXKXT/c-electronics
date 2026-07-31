"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import type { PublicServiceCard } from "@/lib/service-queries";
import { getPublishedServiceHref } from "@/lib/services";

// ponytail: icon names come from DB as strings — resolve at render time
function getIcon(name: string | null): Icons.LucideIcon {
  if (!name) return Icons.Wrench;
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name];
  return Icon ?? Icons.Wrench;
}

export function ServicesClient({ services }: { services: PublicServiceCard[] }) {
  return (
    <>
      <section className="border-b border-black/5 bg-canvas-muted">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">บริการของเรา</h1>
          <p className="mt-2 text-muted">ติดตั้งและซ่อมครบทุกอย่างในที่เดียว — โดยช่างผู้เชี่ยวชาญในเชียงราย</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {services.map((s, i) => {
            const Icon = getIcon(s.icon);
            const features = s.features ? s.features.split("|").filter(Boolean) : [];
            const detailHref = getPublishedServiceHref(s);
            const bookingHref = `/booking?service=${encodeURIComponent(s.slug)}`;
            const image = s.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt={s.imageAlt || s.name} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Icon className="size-12 text-primary" strokeWidth={1.5} />
              </div>
            );
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "0px 0px 300px 0px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="overflow-hidden rounded-[20px] border border-black/5 bg-white sm:flex"
              >
                {detailHref ? (
                  <Link
                    href={detailHref}
                    aria-label={`ดูรายละเอียด ${s.name}`}
                    className="aspect-video shrink-0 overflow-hidden bg-surface-tint sm:aspect-square sm:w-56 sm:flex-shrink-0"
                  >
                    {image}
                  </Link>
                ) : (
                  <div className="aspect-video shrink-0 overflow-hidden bg-surface-tint sm:aspect-square sm:w-56 sm:flex-shrink-0">
                    {image}
                  </div>
                )}
                <div className="flex-1 p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                      {detailHref ? (
                        <Link href={detailHref} className="hover:text-primary">
                          {s.name}
                        </Link>
                      ) : (
                        s.name
                      )}
                    </h2>
                    {s.price && <span className="shrink-0 whitespace-nowrap rounded-full bg-primary-tint px-3 py-1 text-xs font-semibold text-primary">{s.price}</span>}
                  </div>
                  {s.description && <p className="mt-2 text-sm text-muted sm:text-base">{s.description}</p>}
                  {features.length > 0 && (
                    <ul className="mt-4 grid grid-cols-2 gap-2">
                      {features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted">
                          <span className="size-1.5 shrink-0 rounded-full bg-primary" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href={bookingHref} className="mt-5 inline-block whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
                    จองบริการ →
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </>
  );
}
