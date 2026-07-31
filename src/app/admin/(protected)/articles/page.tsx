import {
  listAdminArticles,
  listArticleEditorOptions,
} from "@/lib/article-queries";
import { Archive, FileText, Search } from "lucide-react";
import { ArticleQuickCreate } from "./article-quick-create";
import { ArticleRowActions } from "./article-row-actions";

const statusOptions = [
  { value: "all", label: "ทั้งหมด" },
  { value: "draft", label: "ฉบับร่าง" },
  { value: "published", label: "เผยแพร่แล้ว" },
  { value: "archived", label: "เก็บถาวร" },
] as const;

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const status = statusOptions.some((option) => option.value === params.status)
    ? (params.status as (typeof statusOptions)[number]["value"])
    : "all";
  const [allArticles, editorOptions] = await Promise.all([
    listAdminArticles({
      query: params.q,
      status,
    }),
    listArticleEditorOptions(),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            จัดการบทความ
          </h1>
          <p className="mt-1 text-sm text-muted">
            {allArticles.length} รายการในมุมมองนี้
          </p>
        </div>
      </div>

      <ArticleQuickCreate options={editorOptions} />

      <form className="mb-5 grid gap-3 rounded-[20px] border border-black/5 bg-white p-4 sm:grid-cols-[1fr_180px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="ค้นหาชื่อ, slug หรือหมวดหมู่"
            className="w-full rounded-xl border border-black/10 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold hover:border-ink"
        >
          กรอง
        </button>
      </form>

      <div className="overflow-hidden rounded-[20px] border border-black/5 bg-white">
        {allArticles.length === 0 ? (
          <div className="py-16 text-center">
            <FileText
              className="mx-auto size-12 text-subtle"
              strokeWidth={1}
            />
            <p className="mt-3 text-sm text-muted">
              ไม่พบบทความตามตัวกรอง
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wider text-subtle">
                  <th className="px-4 py-3 font-semibold">บทความ</th>
                  <th className="px-4 py-3 font-semibold">หมวดหมู่</th>
                  <th className="px-4 py-3 font-semibold">สถานะ</th>
                  <th className="px-4 py-3 font-semibold">แก้ไขล่าสุด</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {allArticles.map((article) => (
                  <tr
                    key={article.id}
                    className="border-b border-black/5 last:border-0"
                  >
                    <td className="max-w-md px-4 py-3">
                      <p className="font-semibold">{article.title}</p>
                      <p className="mt-0.5 truncate font-mono text-xs text-muted">
                        /articles/{article.slug}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {article.category}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          article.archived
                            ? "bg-canvas-muted text-muted"
                            : article.status === "published"
                              ? "bg-positive/10 text-positive"
                              : "bg-warning/10 text-warning"
                        }`}
                      >
                        {article.archived && <Archive className="size-3" />}
                        {article.archived
                          ? "เก็บถาวร"
                          : article.status === "published"
                            ? "เผยแพร่แล้ว"
                            : "ฉบับร่าง"}
                        {article.noIndex && " · noindex"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                      {article.updatedAt.toLocaleDateString("th-TH", {
                        dateStyle: "medium",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <ArticleRowActions article={article} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
