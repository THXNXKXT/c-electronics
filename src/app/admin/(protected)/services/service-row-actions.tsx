"use client";

import { ConfirmModal } from "@/components/confirm-modal";
import {
  getServiceConfirmation,
  type ServiceConfirmationAction,
} from "@/lib/service-confirmations";
import { getServiceRowActionAvailability } from "@/lib/service-admin-ui";
import {
  unwrapServiceActionResult,
  type ServiceActionResult,
} from "@/lib/service-action-result";
import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  Pencil,
  Send,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteDraftServiceAction,
  setServiceArchivedAction,
  setServicePublicationAction,
} from "./actions";

export function ServiceRowActions({
  service,
}: {
  service: {
    id: string;
    name: string;
    status: "draft" | "published";
    archived: boolean;
    publishedAt: Date | null;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] =
    useState<ServiceConfirmationAction | null>(null);
  const [error, setError] = useState("");
  const confirmationContent = confirmation
    ? getServiceConfirmation(confirmation, service.name)
    : null;
  const availableActions = getServiceRowActionAvailability(service);

  function run(action: () => Promise<ServiceActionResult>) {
    setError("");
    startTransition(async () => {
      try {
        unwrapServiceActionResult(await action());
        router.refresh();
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "ดำเนินการไม่สำเร็จ",
        );
      }
    });
  }

  function confirmTransition() {
    const action = confirmation;
    if (!action) return;
    setConfirmation(null);

    switch (action) {
      case "publish":
        run(() => setServicePublicationAction(service.id, true));
        break;
      case "unpublish":
        run(() => setServicePublicationAction(service.id, false));
        break;
      case "archive":
        run(() => setServiceArchivedAction(service.id, true));
        break;
      case "restore":
        run(() => setServiceArchivedAction(service.id, false));
        break;
      case "delete":
        run(() => deleteDraftServiceAction(service.id));
        break;
      case "slug-change":
        break;
    }
  }

  return (
    <>
      <div className={`flex justify-end gap-1 ${pending ? "opacity-50" : ""}`}>
        <Link
          href={`/admin/services/${service.id}/edit`}
          aria-label={`แก้ไข ${service.name}`}
          className="rounded-lg p-2 text-subtle outline-none hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Pencil className="size-4" />
        </Link>
        <Link
          href={`/admin/services/${service.id}/preview`}
          target="_blank"
          aria-label={`ดูตัวอย่าง ${service.name}`}
          className="rounded-lg p-2 text-subtle outline-none hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ExternalLink className="size-4" />
        </Link>
        {availableActions.publication && (
          <button
            type="button"
            disabled={pending}
            aria-label={
              `${availableActions.publication === "unpublish" ? "ยกเลิกเผยแพร่" : "เผยแพร่"} ${service.name}`
            }
            onClick={() =>
              setConfirmation(availableActions.publication ?? "publish")
            }
            className="rounded-lg p-2 text-subtle outline-none hover:bg-positive/5 hover:text-positive focus-visible:ring-2 focus-visible:ring-positive disabled:opacity-40"
          >
            {availableActions.publication === "unpublish" ? (
              <Undo2 className="size-4" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          aria-label={`${availableActions.archive === "restore" ? "นำกลับมา" : "เก็บถาวร"} ${service.name}`}
          onClick={() => setConfirmation(availableActions.archive)}
          className="rounded-lg p-2 text-subtle outline-none hover:bg-warning/5 hover:text-warning focus-visible:ring-2 focus-visible:ring-warning disabled:opacity-40"
        >
          {availableActions.archive === "restore" ? (
            <ArchiveRestore className="size-4" />
          ) : (
            <Archive className="size-4" />
          )}
        </button>
        {availableActions.canDelete && (
          <button
            type="button"
            disabled={pending}
            aria-label={`ลบร่าง ${service.name}`}
            onClick={() => setConfirmation("delete")}
            className="rounded-lg p-2 text-subtle outline-none hover:bg-negative/5 hover:text-negative focus-visible:ring-2 focus-visible:ring-negative disabled:opacity-40"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-[110] flex max-w-sm items-start gap-3 rounded-2xl border border-negative/15 bg-white p-4 text-sm text-negative shadow-xl"
        >
          <span className="flex-1">{error}</span>
          <button
            type="button"
            aria-label="ปิดข้อความแจ้งเตือน"
            onClick={() => setError("")}
            className="rounded p-1 outline-none hover:bg-negative/5 focus-visible:ring-2 focus-visible:ring-negative"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmationContent)}
        title={confirmationContent?.title ?? ""}
        message={confirmationContent?.message ?? ""}
        confirmLabel={confirmationContent?.confirmLabel}
        variant={confirmationContent?.variant}
        busy={pending}
        onConfirm={confirmTransition}
        onCancel={() => setConfirmation(null)}
      />
    </>
  );
}
