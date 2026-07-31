"use client";

import {
  Archive,
  ArchiveRestore,
  Pencil,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
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

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "ดำเนินการไม่สำเร็จ",
        );
      }
    });
  }

  return (
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
          onClick={() => {
            const publish = article.status !== "published";
            if (
              !publish ||
              window.confirm(`เผยแพร่บทความ “${article.title}” หรือไม่?`)
            ) {
              run(() =>
                setArticlePublicationAction(article.id, publish),
              );
            }
          }}
          className="rounded-lg p-2 text-subtle hover:bg-positive/5 hover:text-positive"
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
          run(() =>
            setArticleArchivedAction(article.id, !article.archived),
          )
        }
        className="rounded-lg p-2 text-subtle hover:bg-warning/5 hover:text-warning"
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
          onClick={() => {
            if (
              window.confirm(
                `ลบร่าง “${article.title}” ถาวรหรือไม่? การทำรายการนี้ย้อนกลับไม่ได้`,
              )
            ) {
              run(() => deleteDraftArticleAction(article.id));
            }
          }}
          className="rounded-lg p-2 text-subtle hover:bg-negative/5 hover:text-negative"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
