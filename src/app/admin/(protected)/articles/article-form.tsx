"use client";

import { ArticleRichTextEditor } from "@/components/article-rich-text-editor";
import { ConfirmModal } from "@/components/confirm-modal";
import { ImageUpload } from "@/components/image-upload";
import {
  getArticleConfirmation,
  type ArticleConfirmationAction,
} from "@/lib/article-confirmations";
import {
  slugifyArticleTitle,
  type ArticleDocument,
  type ArticleStatus,
} from "@/lib/articles";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Save,
  Send,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createArticleAction,
  setArticleArchivedAction,
  setArticlePublicationAction,
  updateArticleAction,
} from "./actions";

const EMPTY_DOCUMENT: ArticleDocument = {
  type: "doc",
  content: [{ type: "paragraph", content: [] }],
};

type EditableArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: ArticleDocument;
  category: string;
  tags: string[];
  coverImage: string | null;
  coverImageAlt: string | null;
  coverPublicId: string | null;
  relatedServiceId: string | null;
  productIds: string[];
  status: ArticleStatus;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  archived: boolean;
  publishedAt: Date | null;
};

export type ArticleEditorOptions = {
  services: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; category: string }>;
};

const fieldClass =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";

export function ArticleForm({
  article,
  options,
  embedded = false,
}: {
  article?: EditableArticle;
  options: ArticleEditorOptions;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(article));
  const [content, setContent] = useState<ArticleDocument>(
    article?.content ?? EMPTY_DOCUMENT,
  );
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? "");
  const [coverPublicId, setCoverPublicId] = useState(
    article?.coverPublicId ?? "",
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [confirmation, setConfirmation] =
    useState<ArticleConfirmationAction | null>(null);

  function runAction(action: () => Promise<void>) {
    setError("");
    setSaved("");
    startTransition(async () => {
      try {
        await action();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("content", JSON.stringify(content));
    formData.set("coverImage", coverImage);
    formData.set("coverPublicId", coverPublicId);

    runAction(async () => {
      const result = article
        ? await updateArticleAction(article.id, formData)
        : await createArticleAction(formData);
      setSaved("บันทึกแล้ว");

      if (!article) {
        router.replace(`/admin/articles/${result.id}/edit`);
      } else {
        router.refresh();
      }
    });
  }

  function confirmTransition() {
    if (!article || !confirmation) return;
    const action = confirmation;
    setConfirmation(null);

    runAction(async () => {
      if (action === "publish" || action === "unpublish") {
        await setArticlePublicationAction(article.id, action === "publish");
      } else if (action === "archive" || action === "restore") {
        await setArticleArchivedAction(article.id, action === "archive");
      }
      router.refresh();
    });
  }

  const slugLocked = Boolean(article?.publishedAt);
  const confirmationContent =
    article && confirmation
      ? getArticleConfirmation(confirmation, article.title)
      : null;

  return (
    <form onSubmit={handleSave}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          {!embedded && (
            <Link
              href="/admin/articles"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-4" /> กลับ
            </Link>
          )}
          <h1
            className={`${embedded ? "text-xl" : "mt-2 text-2xl"} font-bold tracking-tight`}
          >
            {article ? "แก้ไขบทความ" : "สร้างบทความใหม่"}
          </h1>
          {embedded && (
            <p className="mt-1 text-sm text-muted">
              กรอกข้อมูล เนื้อหา ความเกี่ยวข้อง และ SEO ให้ครบในฟอร์มเดียว
            </p>
          )}
          {article && (
            <p className="mt-1 text-sm text-muted">
              สถานะ:{" "}
              <span className="font-semibold text-ink">
                {article.archived
                  ? "เก็บถาวร"
                  : article.status === "published"
                    ? "เผยแพร่แล้ว"
                    : "ฉบับร่าง"}
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {article && (
            <>
              <Link
                href={`/admin/articles/${article.id}/preview`}
                target="_blank"
                className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold hover:border-ink"
              >
                <ExternalLink className="size-4" /> ดูตัวอย่าง
              </Link>
              <button
                type="button"
                disabled={pending || article.archived}
                onClick={() =>
                  setConfirmation(
                    article.status === "published" ? "unpublish" : "publish",
                  )
                }
                className="flex items-center gap-2 rounded-full border border-primary px-4 py-2.5 text-sm font-semibold text-primary disabled:opacity-40"
              >
                {article.status === "published" ? (
                  <Undo2 className="size-4" />
                ) : (
                  <Send className="size-4" />
                )}
                {article.status === "published" ? "ยกเลิกเผยแพร่" : "เผยแพร่"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  setConfirmation(article.archived ? "restore" : "archive")
                }
                className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
              >
                {article.archived ? (
                  <ArchiveRestore className="size-4" />
                ) : (
                  <Archive className="size-4" />
                )}
                {article.archived ? "นำกลับมา" : "เก็บถาวร"}
              </button>
            </>
          )}
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            บันทึกร่าง
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-negative/20 bg-negative/5 px-4 py-3 text-sm font-semibold text-negative">
          {error}
        </div>
      )}
      {saved && (
        <div className="mb-5 rounded-xl border border-positive/20 bg-positive/5 px-4 py-3 text-sm font-semibold text-positive">
          {saved}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-[20px] border border-black/5 bg-white p-5">
            <label className="block text-sm font-bold">
              ชื่อบทความ
              <input
                name="title"
                required
                value={title}
                onChange={(event) => {
                  const nextTitle = event.target.value;
                  setTitle(nextTitle);
                  if (!slugEdited) setSlug(slugifyArticleTitle(nextTitle));
                }}
                className={`${fieldClass} mt-2 text-lg font-semibold`}
                placeholder="ชื่อบทความที่บอกผู้อ่านชัดเจนว่าจะได้รู้อะไร"
              />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Slug
              <input
                name="slug"
                required
                value={slug}
                readOnly={slugLocked}
                onChange={(event) => {
                  setSlugEdited(true);
                  setSlug(slugifyArticleTitle(event.target.value));
                }}
                className={`${fieldClass} mt-2 font-mono ${
                  slugLocked ? "cursor-not-allowed bg-canvas-muted" : ""
                }`}
              />
              <span className="mt-1 block text-xs font-normal text-muted">
                {slugLocked
                  ? "Slug ถูกล็อกหลังเผยแพร่ครั้งแรก เพื่อไม่ให้ URL เดิมเสีย"
                  : `/articles/${slug || "slug-บทความ"}`}
              </span>
            </label>
            <label className="mt-4 block text-sm font-bold">
              คำโปรย
              <textarea
                name="excerpt"
                required
                defaultValue={article?.excerpt ?? ""}
                rows={4}
                maxLength={500}
                className={`${fieldClass} mt-2 resize-y`}
                placeholder="สรุปประโยชน์ของบทความใน 1–3 ประโยค"
              />
            </label>
          </section>

          <section>
            <div className="mb-2 flex items-end justify-between">
              <div>
                <h2 className="text-base font-bold">เนื้อหา</h2>
                <p className="text-xs text-muted">
                  H2/H3 จะถูกนำไปสร้างสารบัญอัตโนมัติ
                </p>
              </div>
            </div>
            <ArticleRichTextEditor value={content} onChange={setContent} />
            <input
              type="hidden"
              name="content"
              value={JSON.stringify(content)}
              readOnly
            />
          </section>

          <details className="rounded-[20px] border border-black/5 bg-white p-5">
            <summary className="cursor-pointer text-base font-bold">
              ตั้งค่า SEO เพิ่มเติม
            </summary>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-bold">
                SEO title (เว้นว่างเพื่อใช้ชื่อบทความ)
                <input
                  name="seoTitle"
                  defaultValue={article?.seoTitle ?? ""}
                  maxLength={180}
                  className={`${fieldClass} mt-2`}
                />
              </label>
              <label className="block text-sm font-bold">
                Meta description (เว้นว่างเพื่อใช้คำโปรย)
                <textarea
                  name="seoDescription"
                  defaultValue={article?.seoDescription ?? ""}
                  rows={3}
                  maxLength={500}
                  className={`${fieldClass} mt-2`}
                />
              </label>
              <label className="block text-sm font-bold">
                Canonical override
                <input
                  name="canonicalUrl"
                  defaultValue={article?.canonicalUrl ?? ""}
                  className={`${fieldClass} mt-2`}
                  placeholder="/articles/ชื่อบทความ"
                />
                <span className="mt-1 block text-xs font-normal text-muted">
                  รับเฉพาะ path หรือ URL บน c-electronics.online
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl bg-canvas-muted p-3 text-sm">
                <input
                  type="checkbox"
                  name="noIndex"
                  defaultChecked={article?.noIndex ?? false}
                  className="mt-1 size-4 accent-primary"
                />
                <span>
                  <strong className="block">
                    ไม่ให้ search engine ทำ index
                  </strong>
                  <span className="text-xs text-muted">
                    หน้ายังเปิดดูได้ แต่ไม่อยู่ใน sitemap และใช้ noindex
                  </span>
                </span>
              </label>
            </div>
          </details>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[20px] border border-black/5 bg-white p-5">
            <h2 className="text-sm font-bold">การจัดหมวดหมู่</h2>
            <label className="mt-4 block text-xs font-bold text-muted">
              หมวดหมู่
              <input
                name="category"
                required
                defaultValue={article?.category ?? ""}
                list="article-categories"
                className={`${fieldClass} mt-1`}
                placeholder="เช่น ระบบไฟฟ้า"
              />
              <datalist id="article-categories">
                {[
                  "เครื่องปรับอากาศ",
                  "กล้องวงจรปิด",
                  "ระบบไฟฟ้า",
                  "จานดาวเทียม",
                  "ซ่อมเครื่องใช้ไฟฟ้า",
                  "อะไหล่อิเล็กทรอนิกส์",
                ].map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </label>
            <label className="mt-4 block text-xs font-bold text-muted">
              Tags (คั่นด้วยเครื่องหมายจุลภาค)
              <input
                name="tags"
                defaultValue={article?.tags.join(", ") ?? ""}
                className={`${fieldClass} mt-1`}
                placeholder="BTU, แอร์บ้าน, ประหยัดไฟ"
              />
            </label>
            <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={article?.featured ?? false}
                className="size-4 accent-primary"
              />
              แสดงเป็นบทความเด่น
            </label>
          </section>

          <section className="rounded-[20px] border border-black/5 bg-white p-5">
            <h2 className="text-sm font-bold">ภาพปก</h2>
            <div className="mt-3">
              <ImageUpload
                value={coverImage}
                onChange={(url, publicId) => {
                  setCoverImage(url);
                  setCoverPublicId(publicId ?? "");
                }}
                folder="c-electronics/articles"
              />
            </div>
            <input type="hidden" name="coverImage" value={coverImage} />
            <input type="hidden" name="coverPublicId" value={coverPublicId} />
            <label className="mt-4 block text-xs font-bold text-muted">
              Alt text
              <input
                name="coverImageAlt"
                defaultValue={article?.coverImageAlt ?? ""}
                className={`${fieldClass} mt-1`}
                placeholder="อธิบายสิ่งที่อยู่ในภาพ"
              />
            </label>
          </section>

          <section className="rounded-[20px] border border-black/5 bg-white p-5">
            <h2 className="text-sm font-bold">เนื้อหาที่เกี่ยวข้อง</h2>
            <label className="mt-4 block text-xs font-bold text-muted">
              บริการ
              <select
                name="relatedServiceId"
                defaultValue={article?.relatedServiceId ?? ""}
                className={`${fieldClass} mt-1`}
              >
                <option value="">ไม่เลือก</option>
                {options.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="mt-4">
              <legend className="text-xs font-bold text-muted">สินค้า</legend>
              <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-xl border border-black/5 p-2">
                {options.products.length === 0 ? (
                  <p className="p-2 text-xs text-muted">ยังไม่มีสินค้า</p>
                ) : (
                  options.products.map((product) => (
                    <label
                      key={product.id}
                      className="flex gap-2 rounded-lg p-2 text-xs hover:bg-canvas-muted"
                    >
                      <input
                        type="checkbox"
                        name="productIds"
                        value={product.id}
                        defaultChecked={article?.productIds.includes(
                          product.id,
                        )}
                        className="mt-0.5 size-4 accent-primary"
                      />
                      <span>
                        <strong className="block text-ink">
                          {product.name}
                        </strong>
                        <span className="text-muted">{product.category}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </fieldset>
          </section>
        </aside>
      </div>

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
    </form>
  );
}
