"use client";

import { ArticleRichTextEditor } from "@/components/article-rich-text-editor";
import { ConfirmModal } from "@/components/confirm-modal";
import { ImageUpload } from "@/components/image-upload";
import type { services } from "@/db/schema";
import {
  getServiceConfirmation,
  type ServiceConfirmationAction,
} from "@/lib/service-confirmations";
import {
  createUploadBusyCounter,
  type UploadBusyCounter,
} from "@/lib/upload-activity";
import {
  canSubmitServiceSlugChangeConfirmation,
  isServiceFormBusy,
  isServicePublicationBlocked,
  serializeServiceEditorState,
  shouldAcknowledgeServiceSave,
} from "@/lib/service-admin-ui";
import {
  toSafeServiceClientError,
  unwrapServiceActionResult,
} from "@/lib/service-action-result";
import {
  markServiceSlugChangeConfirmed,
  slugifyServiceName,
  type ServiceFaq,
  type ServiceProcessStep,
} from "@/lib/services";
import type { ArticleDocument } from "@/lib/articles";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  createServiceAction,
  setServiceArchivedAction,
  setServicePublicationAction,
  updateServiceAction,
} from "./actions";

const EMPTY_DOCUMENT: ArticleDocument = {
  type: "doc",
  content: [{ type: "paragraph", content: [] }],
};

const EMPTY_PROCESS_STEP: ServiceProcessStep = {
  title: "",
  description: "",
};

const EMPTY_FAQ: ServiceFaq = {
  question: "",
  answer: "",
};

export type EditableService = typeof services.$inferSelect;

const fieldClass =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10";

export function ServiceForm({
  service,
  embedded = false,
}: {
  service?: EditableService;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(service?.name ?? "");
  const [slug, setSlug] = useState(service?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(service));
  const [content, setContent] = useState<ArticleDocument>(
    service?.content ?? EMPTY_DOCUMENT,
  );
  const [image, setImage] = useState(service?.image ?? "");
  const [imagePublicId, setImagePublicId] = useState(
    service?.imagePublicId ?? "",
  );
  const [features, setFeatures] = useState<string[]>(
    service?.features
      ? service.features.split("|").filter(Boolean)
      : [""],
  );
  const [processSteps, setProcessSteps] = useState<ServiceProcessStep[]>(
    service?.processSteps.length
      ? service.processSteps
      : [{ ...EMPTY_PROCESS_STEP }],
  );
  const [faqs, setFaqs] = useState<ServiceFaq[]>(
    service?.faqs.length ? service.faqs : [{ ...EMPTY_FAQ }],
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [dirty, setDirty] = useState(false);
  const [uploadsPending, setUploadsPending] = useState(false);
  const uploadCounterRef = useRef<UploadBusyCounter | null>(null);
  const editorRevision = useRef(0);
  const slugConfirmationSubmittingRef = useRef(false);
  const previewLinkRef = useRef<HTMLAnchorElement>(null);
  const [confirmation, setConfirmation] =
    useState<ServiceConfirmationAction | null>(null);
  const [pendingSave, setPendingSave] = useState<{
    formData: FormData;
    revision: number;
    expectedOldSlug: string;
    expectedNewSlug: string;
  } | null>(null);

  useEffect(() => {
    const counter = createUploadBusyCounter(setUploadsPending);
    uploadCounterRef.current = counter;
    return () => {
      counter.dispose();
      if (uploadCounterRef.current === counter) uploadCounterRef.current = null;
    };
  }, []);

  const handleCoverUploadingChange = useCallback((uploading: boolean) => {
    uploadCounterRef.current?.setSourceActive("cover", uploading);
  }, []);

  const handleInlineUploadingChange = useCallback((uploading: boolean) => {
    uploadCounterRef.current?.setSourceActive("inline", uploading);
  }, []);

  function markDirty() {
    editorRevision.current += 1;
    setDirty(true);
    setSaved("");
  }

  function runAction(action: () => Promise<void>) {
    setError("");
    setSaved("");
    startTransition(async () => {
      try {
        await action();
      } catch (caught) {
        setError(toSafeServiceClientError(caught));
      }
    });
  }

  function buildFormData(form: HTMLFormElement) {
    const formData = new FormData(form);
    const structuredFields = serializeServiceEditorState({
      content,
      image,
      imagePublicId,
      features,
      processSteps,
      faqs,
    });
    for (const [key, value] of Object.entries(structuredFields)) {
      formData.set(key, value);
    }
    return formData;
  }

  function save(
    formData: FormData,
    submittedRevision: number,
    onSettled?: () => void,
    onRejected?: () => void,
  ) {
    runAction(async () => {
      try {
        const result = unwrapServiceActionResult(
          service
            ? await updateServiceAction(service.id, formData)
            : await createServiceAction(formData),
        );
        if (
          shouldAcknowledgeServiceSave(
            submittedRevision,
            editorRevision.current,
          )
        ) {
          setSaved("บันทึกแล้ว");
          setDirty(false);
        } else {
          setSaved("");
          setDirty(true);
        }

        if (!service) {
          router.replace(`/admin/services/${result.id}/edit`);
        } else {
          router.refresh();
        }
      } catch (caught) {
        onRejected?.();
        throw caught;
      } finally {
        onSettled?.();
      }
    });
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isServiceFormBusy(pending, uploadsPending)) return;
    const formData = buildFormData(event.currentTarget);
    const nextSlug = slugifyServiceName(String(formData.get("slug") ?? ""));

    if (
      service?.publishedAt &&
      nextSlug !== slugifyServiceName(service.slug)
    ) {
      setPendingSave({
        formData,
        revision: editorRevision.current,
        expectedOldSlug: service.slug,
        expectedNewSlug: nextSlug,
      });
      setConfirmation("slug-change");
      return;
    }

    save(formData, editorRevision.current);
  }

  function confirmTransition() {
    const action = confirmation;
    if (!service || !action) return;
    setConfirmation(null);

    if (action === "slug-change") {
      const saveRequest = pendingSave;
      setPendingSave(null);
      if (
        !saveRequest ||
        !canSubmitServiceSlugChangeConfirmation({
          submittedRevision: saveRequest.revision,
          currentRevision: editorRevision.current,
          busy: isServiceFormBusy(pending, uploadsPending),
          alreadySubmitting: slugConfirmationSubmittingRef.current,
        })
      ) {
        if (saveRequest) {
          setError("ข้อมูลมีการเปลี่ยนแปลง กรุณากดบันทึกและยืนยันอีกครั้ง");
        }
        return;
      }
      slugConfirmationSubmittingRef.current = true;
      markServiceSlugChangeConfirmed(saveRequest.formData, {
        expectedOldSlug: saveRequest.expectedOldSlug,
        expectedNewSlug: saveRequest.expectedNewSlug,
      });
      save(
        saveRequest.formData,
        saveRequest.revision,
        () => {
          slugConfirmationSubmittingRef.current = false;
        },
        () => router.refresh(),
      );
      return;
    }

    runAction(async () => {
      if (action === "publish" || action === "unpublish") {
        unwrapServiceActionResult(
          await setServicePublicationAction(service.id, action === "publish"),
        );
      } else if (action === "archive" || action === "restore") {
        unwrapServiceActionResult(
          await setServiceArchivedAction(service.id, action === "archive"),
        );
      }
      router.refresh();
    });
  }

  const busy = isServiceFormBusy(pending, uploadsPending);
  const publicationAction =
    service?.status === "published" ? "unpublish" : "publish";
  const publicationBlocked = isServicePublicationBlocked(
    publicationAction,
    dirty,
    busy,
  );
  const serializedState = serializeServiceEditorState({
    content,
    image,
    imagePublicId,
    features,
    processSteps,
    faqs,
  });
  const confirmationContent =
    service && confirmation
      ? getServiceConfirmation(confirmation, service.name)
      : null;

  return (
    <form onSubmit={handleSave} onChange={markDirty}>
      <fieldset disabled={pending} className="contents">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          {!embedded && (
            <Link
              href="/admin/services"
              className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowLeft className="size-4" /> กลับ
            </Link>
          )}
          <h1
            className={`${embedded ? "text-xl" : "mt-2 text-2xl"} font-bold tracking-tight`}
          >
            {service ? "แก้ไขบริการ" : "สร้างบริการใหม่"}
          </h1>
          {embedded && (
            <p className="mt-1 text-sm text-muted">
              กรอกข้อมูล เนื้อหา ขั้นตอน FAQ และ SEO ให้ครบในฟอร์มเดียว
            </p>
          )}
          {service && (
            <>
              <p className="mt-1 text-sm text-muted">
                สถานะ:{" "}
                <span className="font-semibold text-ink">
                  {service.archived
                    ? "เก็บถาวร"
                    : service.status === "published"
                      ? "เผยแพร่แล้ว"
                      : "ฉบับร่าง"}
                </span>
              </p>
              {dirty && (
                <p role="status" className="mt-1 text-xs font-semibold text-warning">
                  มีการแก้ไขที่ยังไม่ได้บันทึก
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {service && (
            <>
              <Link
                ref={previewLinkRef}
                href={`/admin/services/${service.id}/preview`}
                target="_blank"
                className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ExternalLink className="size-4" /> ดูตัวอย่าง
              </Link>
              <button
                type="button"
                disabled={publicationBlocked || service.archived}
                title={
                  publicationAction === "publish" && dirty
                    ? "บันทึกการแก้ไขก่อนเผยแพร่"
                    : undefined
                }
                onClick={() =>
                  setConfirmation(publicationAction)
                }
                className="flex items-center gap-2 rounded-full border border-primary px-4 py-2.5 text-sm font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
              >
                {publicationAction === "unpublish" ? (
                  <Undo2 className="size-4" />
                ) : (
                  <Send className="size-4" />
                )}
                {publicationAction === "unpublish"
                  ? "ยกเลิกเผยแพร่"
                  : "เผยแพร่"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setConfirmation(service.archived ? "restore" : "archive")
                }
                className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
              >
                {service.archived ? (
                  <ArchiveRestore className="size-4" />
                ) : (
                  <Archive className="size-4" />
                )}
                {service.archived ? "นำกลับมา" : "เก็บถาวร"}
              </button>
            </>
          )}
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white outline-none hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            บันทึกร่าง
          </button>
          {uploadsPending && (
            <span
              role="status"
              className="self-center text-xs font-semibold text-primary"
            >
              กำลังอัปโหลดรูป...
            </span>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-negative/20 bg-negative/5 px-4 py-3 text-sm font-semibold text-negative"
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
      {saved && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-positive/20 bg-positive/5 px-4 py-3 text-sm font-semibold text-positive"
        >
          {saved}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-[20px] border border-black/5 bg-white p-5">
            <label className="block text-sm font-bold">
              ชื่อบริการ
              <input
                name="name"
                required
                minLength={3}
                maxLength={120}
                value={name}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setName(nextName);
                  if (!slugEdited) setSlug(slugifyServiceName(nextName));
                }}
                className={`${fieldClass} mt-2 text-lg font-semibold`}
                placeholder="เช่น ติดตั้งและล้างเครื่องปรับอากาศ"
              />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Slug
              <input
                name="slug"
                required
                value={slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  setSlug(slugifyServiceName(event.target.value));
                }}
                className={`${fieldClass} mt-2 font-mono`}
              />
              <span className="mt-1 block text-xs font-normal text-muted">
                {service?.publishedAt
                  ? "การเปลี่ยน URL หลังเผยแพร่ต้องยืนยัน และ URL เดิมจะเปลี่ยนเส้นทางให้อัตโนมัติ"
                  : `/services/${slug || "slug-บริการ"}`}
              </span>
            </label>
            <label className="mt-4 block text-sm font-bold">
              คำอธิบายบริการ
              <textarea
                name="description"
                required
                minLength={20}
                maxLength={500}
                rows={4}
                defaultValue={service?.description ?? ""}
                className={`${fieldClass} mt-2 resize-y`}
                placeholder="สรุปบริการและประโยชน์ที่ลูกค้าจะได้รับ"
              />
            </label>
          </section>

          <section>
            <div className="mb-2">
              <h2 className="text-base font-bold">เนื้อหาบริการ</h2>
              <p className="text-xs text-muted">
                ใช้ H2/H3 เพื่อจัดลำดับเนื้อหาและสร้างสารบัญอัตโนมัติ
              </p>
            </div>
            <ArticleRichTextEditor
              value={content}
              disabled={pending}
              onUploadingChange={handleInlineUploadingChange}
              onChange={(nextContent) => {
                setContent(nextContent);
                markDirty();
              }}
            />
            <input
              type="hidden"
              name="content"
              value={serializedState.content}
              readOnly
            />
          </section>

          <section className="rounded-[20px] border border-black/5 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold">ขั้นตอนบริการ</h2>
                <p className="mt-1 text-xs text-muted">
                  เรียงตามลำดับที่ลูกค้าจะได้รับบริการ สูงสุด 12 ขั้นตอน
                </p>
              </div>
              <button
                type="button"
                disabled={processSteps.length >= 12}
                onClick={() => {
                  markDirty();
                  setProcessSteps((current) => [
                    ...current,
                    { ...EMPTY_PROCESS_STEP },
                  ]);
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-black/10 px-3 py-2 text-xs font-semibold outline-none hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
              >
                <Plus className="size-3.5" /> เพิ่มขั้นตอน
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {processSteps.map((step, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-black/5 bg-canvas-muted p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-muted">
                      ขั้นตอนที่ {index + 1}
                    </p>
                    {processSteps.length > 1 && (
                      <button
                        type="button"
                        aria-label={`ลบขั้นตอนที่ ${index + 1}`}
                        onClick={() => {
                          markDirty();
                          setProcessSteps((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          );
                        }}
                        className="rounded-lg p-2 text-subtle outline-none hover:bg-negative/5 hover:text-negative focus-visible:ring-2 focus-visible:ring-negative"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <input
                    aria-label={`ชื่อขั้นตอนที่ ${index + 1}`}
                    value={step.title}
                    maxLength={180}
                    onChange={(event) =>
                      setProcessSteps((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, title: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={`${fieldClass} mt-2 font-semibold`}
                    placeholder="ชื่อขั้นตอน"
                  />
                  <textarea
                    aria-label={`คำอธิบายขั้นตอนที่ ${index + 1}`}
                    value={step.description}
                    maxLength={1000}
                    rows={3}
                    onChange={(event) =>
                      setProcessSteps((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, description: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={`${fieldClass} mt-2 resize-y`}
                    placeholder="อธิบายสิ่งที่เกิดขึ้นในขั้นตอนนี้"
                  />
                </div>
              ))}
            </div>
            <input
              type="hidden"
              name="processSteps"
              value={serializedState.processSteps}
              readOnly
            />
          </section>

          <section className="rounded-[20px] border border-black/5 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold">คำถามที่พบบ่อย</h2>
                <p className="mt-1 text-xs text-muted">สูงสุด 20 รายการ</p>
              </div>
              <button
                type="button"
                disabled={faqs.length >= 20}
                onClick={() => {
                  markDirty();
                  setFaqs((current) => [...current, { ...EMPTY_FAQ }]);
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-black/10 px-3 py-2 text-xs font-semibold outline-none hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
              >
                <Plus className="size-3.5" /> เพิ่ม FAQ
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-black/5 bg-canvas-muted p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-muted">
                      FAQ {index + 1}
                    </p>
                    {faqs.length > 1 && (
                      <button
                        type="button"
                        aria-label={`ลบ FAQ ที่ ${index + 1}`}
                        onClick={() => {
                          markDirty();
                          setFaqs((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          );
                        }}
                        className="rounded-lg p-2 text-subtle outline-none hover:bg-negative/5 hover:text-negative focus-visible:ring-2 focus-visible:ring-negative"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <input
                    aria-label={`คำถาม FAQ ที่ ${index + 1}`}
                    value={faq.question}
                    maxLength={180}
                    onChange={(event) =>
                      setFaqs((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, question: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={`${fieldClass} mt-2 font-semibold`}
                    placeholder="คำถาม"
                  />
                  <textarea
                    aria-label={`คำตอบ FAQ ที่ ${index + 1}`}
                    value={faq.answer}
                    maxLength={1000}
                    rows={3}
                    onChange={(event) =>
                      setFaqs((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, answer: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={`${fieldClass} mt-2 resize-y`}
                    placeholder="คำตอบที่ช่วยให้ลูกค้าตัดสินใจได้"
                  />
                </div>
              ))}
            </div>
            <input
              type="hidden"
              name="faqs"
              value={serializedState.faqs}
              readOnly
            />
          </section>

          <details className="rounded-[20px] border border-black/5 bg-white p-5">
            <summary className="cursor-pointer text-base font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary">
              ตั้งค่า SEO เพิ่มเติม
            </summary>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-bold">
                SEO title (เว้นว่างเพื่อใช้ชื่อบริการ)
                <input
                  name="seoTitle"
                  defaultValue={service?.seoTitle ?? ""}
                  maxLength={180}
                  className={`${fieldClass} mt-2`}
                />
              </label>
              <label className="block text-sm font-bold">
                Meta description (เว้นว่างเพื่อใช้คำอธิบาย)
                <textarea
                  name="seoDescription"
                  defaultValue={service?.seoDescription ?? ""}
                  rows={3}
                  maxLength={500}
                  className={`${fieldClass} mt-2 resize-y`}
                />
              </label>
              <label className="block text-sm font-bold">
                Canonical override
                <input
                  name="canonicalUrl"
                  defaultValue={service?.canonicalUrl ?? ""}
                  className={`${fieldClass} mt-2`}
                  placeholder="/services/ชื่อบริการ"
                />
                <span className="mt-1 block text-xs font-normal text-muted">
                  รับเฉพาะ path หรือ URL บน c-electronics.online
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl bg-canvas-muted p-3 text-sm">
                <input
                  type="checkbox"
                  name="noIndex"
                  defaultChecked={service?.noIndex ?? false}
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
            <h2 className="text-sm font-bold">รายละเอียดบริการ</h2>
            <label className="mt-4 block text-xs font-bold text-muted">
              ราคา
              <input
                name="price"
                defaultValue={service?.price ?? ""}
                className={`${fieldClass} mt-1`}
                placeholder="เช่น เริ่มต้น 1,500 ฿"
              />
            </label>
            <label className="mt-4 block text-xs font-bold text-muted">
              ไอคอน
              <input
                name="icon"
                defaultValue={service?.icon ?? "Wrench"}
                className={`${fieldClass} mt-1 font-mono`}
                placeholder="Wrench"
              />
            </label>
            <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={service?.featured ?? false}
                className="size-4 accent-primary"
              />
              แสดงเป็นบริการเด่น
            </label>
          </section>

          <section className="rounded-[20px] border border-black/5 bg-white p-5">
            <h2 className="text-sm font-bold">จุดเด่นบริการ</h2>
            <p className="mt-1 text-xs text-muted">สูงสุด 12 รายการ</p>
            <div className="mt-3 space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    aria-label={`จุดเด่นที่ ${index + 1}`}
                    value={feature}
                    onChange={(event) =>
                      setFeatures((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? event.target.value : item,
                        ),
                      )
                    }
                    className={fieldClass}
                    placeholder={`จุดเด่นข้อที่ ${index + 1}`}
                  />
                  {features.length > 1 && (
                    <button
                      type="button"
                      aria-label={`ลบจุดเด่นที่ ${index + 1}`}
                      onClick={() => {
                        markDirty();
                        setFeatures((current) =>
                          current.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        );
                      }}
                      className="rounded-lg p-2 text-subtle outline-none hover:bg-negative/5 hover:text-negative focus-visible:ring-2 focus-visible:ring-negative"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={features.length >= 12}
              onClick={() => {
                markDirty();
                setFeatures((current) => [...current, ""]);
              }}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
            >
              <Plus className="size-3.5" /> เพิ่มจุดเด่น
            </button>
            <input
              type="hidden"
              name="features"
              value={serializedState.features}
              readOnly
            />
          </section>

          <section className="rounded-[20px] border border-black/5 bg-white p-5">
            <h2 className="text-sm font-bold">ภาพบริการ</h2>
            <div className="mt-3">
              <ImageUpload
                value={image}
                onChange={(url, publicId) => {
                  setImage(url);
                  setImagePublicId(publicId ?? "");
                  markDirty();
                }}
                onUploadingChange={handleCoverUploadingChange}
                folder="c-electronics/services"
              />
            </div>
            <input type="hidden" name="image" value={image} readOnly />
            <input
              type="hidden"
              name="imagePublicId"
              value={imagePublicId}
              readOnly
            />
            <label className="mt-4 block text-xs font-bold text-muted">
              Alt text
              <input
                name="imageAlt"
                defaultValue={service?.imageAlt ?? ""}
                className={`${fieldClass} mt-1`}
                placeholder="อธิบายสิ่งที่อยู่ในภาพ"
              />
            </label>
          </section>
        </aside>
      </div>
      </fieldset>

      <ConfirmModal
        open={Boolean(confirmationContent)}
        title={confirmationContent?.title ?? ""}
        message={confirmationContent?.message ?? ""}
        confirmLabel={confirmationContent?.confirmLabel}
        variant={confirmationContent?.variant}
        busy={busy}
        confirmedRestoreFocusRef={previewLinkRef}
        onConfirm={confirmTransition}
        onCancel={() => {
          setConfirmation(null);
          setPendingSave(null);
        }}
      />
    </form>
  );
}
