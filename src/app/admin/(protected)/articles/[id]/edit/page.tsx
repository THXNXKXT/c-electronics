import {
  getAdminArticle,
  listArticleEditorOptions,
} from "@/lib/article-queries";
import { notFound } from "next/navigation";
import { ArticleForm } from "../../article-form";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [article, options] = await Promise.all([
    getAdminArticle(id),
    listArticleEditorOptions(),
  ]);
  if (!article) notFound();

  return <ArticleForm article={article} options={options} />;
}
