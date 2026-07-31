"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ArticleForm, type ArticleEditorOptions } from "./article-form";

export function ArticleCreatePanel({
  options,
}: {
  options: ArticleEditorOptions;
}) {
  return (
    <div
      id="create-article-panel"
      className="mt-4 rounded-[24px] border border-primary/10 bg-canvas-muted p-4 sm:p-5"
    >
      <ArticleForm options={options} embedded />
    </div>
  );
}

export function ArticleQuickCreate({
  options,
}: {
  options: ArticleEditorOptions;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="create-article-panel"
        className="flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        <Plus
          className={`size-4 transition-transform ${open ? "rotate-45" : ""}`}
        />
        {open ? "ย่อ" : "เพิ่มบทความ"}
      </button>

      {open && <ArticleCreatePanel options={options} />}
    </div>
  );
}
