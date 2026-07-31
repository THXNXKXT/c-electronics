"use client";

import { ConfirmModal } from "@/components/confirm-modal";
import {
  getArticleConfirmation,
  type ArticleConfirmationAction,
} from "@/lib/article-confirmations";
import {
  Archive,
  ArchiveRestore,
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
  deleteDraftArticleAction,
  setArticleArchivedAction,
  setArticlePublicationAction,
} from "./actions";

export function ArticleRowActions({
  article,
}: {
  article: {
    id: string;
    title: string;
    status: "draft" | "published";
    archived: boolean;
    publishedAt: Date | null;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] =
    useState<ArticleConfirmationAction | null>(null);
  const [error, setError] = useState("");
  const confirmationContent = confirmation
    ? getArticleConfirmation(confirmation, article.title)
    : null;

  function run(action: () => Promise<void>) {
    setError("");
    startTransition(async () => {
      try {
        await action();
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
        run(() => setArticlePublicationAction(article.id, true));
        break;
      case "unpublish":
        run(() => setArticlePublicationAction(article.id, false));
        break;
      case "archive":
        run(() => setArticleArchivedAction(article.id, true));
        break;
      case "restore":
        run(() => setArticleArchivedAction(article.id, false));
        break;
      case "delete":
        run(() => deleteDraftArticleAction(article.id));
        break;
    }
  }

  return (
    <>
      <div className={`flex justify-end gap-1 ${pending ? "opacity-50" : ""}`}>
        <Link
          href={`/admin/articles/${article.id}/edit`}
          aria-label={`แก้ไข ${article.title}`}
          className="rounded-lg p-2 text-subtle hover:bg-primary/5 hover:text-primary"
        >
          <Pencil className="size-4" />
        </Link>
        {!article.archived && (
          <button
            type="button"
            disabled={pending}
            aria-label={
              article.status === "published" ? "ยกเลิกเผยแพร่" : "เผยแพร่"
            }
            onClick={() =>
              setConfirmation(
                article.status === "published" ? "unpublish" : "publish",
              )
            }
            className="rounded-lg p-2 text-subtle hover:bg-positive/5 hover:text-positive disabled:opacity-40"
          >
            {article.status === "published" ? (
              <Undo2 className="size-4" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          aria-label={article.archived ? "นำกลับมา" : "เก็บถาวร"}
          onClick={() =>
            setConfirmation(article.archived ? "restore" : "archive")
          }
          className="rounded-lg p-2 text-subtle hover:bg-warning/5 hover:text-warning disabled:opacity-40"
        >
          {article.archived ? (
            <ArchiveRestore className="size-4" />
          ) : (
            <Archive className="size-4" />
          )}
        </button>
        {article.status === "draft" && !article.publishedAt && (
          <button
            type="button"
            disabled={pending}
            aria-label="ลบร่าง"
            onClick={() => setConfirmation("delete")}
            className="rounded-lg p-2 text-subtle hover:bg-negative/5 hover:text-negative disabled:opacity-40"
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
            className="rounded p-1 hover:bg-negative/5"
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
