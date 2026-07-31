import { listArticleEditorOptions } from "@/lib/article-queries";
import { ArticleForm } from "../article-form";

export default async function NewArticlePage() {
  const options = await listArticleEditorOptions();
  return <ArticleForm options={options} />;
}
