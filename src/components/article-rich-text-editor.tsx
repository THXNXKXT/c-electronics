"use client";

import type { ArticleDocument } from "@/lib/articles";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Unlink,
} from "lucide-react";
import { useRef, useState } from "react";

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-9 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
        active
          ? "bg-primary text-white"
          : "text-muted hover:bg-canvas-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function ArticleRichTextEditor({
  value,
  onChange,
}: {
  value: ArticleDocument;
  onChange: (value: ArticleDocument) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3] },
        underline: false,
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: "noopener noreferrer",
          },
        },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: { class: "article-inline-image" },
      }),
      Placeholder.configure({
        placeholder:
          "เริ่มเขียนเนื้อหา… ใช้หัวข้อ H2/H3 เพื่อสร้างสารบัญอัตโนมัติ",
      }),
    ],
    content: value,
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getJSON() as ArticleDocument);
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[420px] px-5 py-5 outline-none [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-primary-tint/40 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_img]:my-6 [&_img]:max-h-[520px] [&_img]:w-full [&_img]:rounded-2xl [&_img]:object-cover",
      },
    },
  });

  if (!editor) {
    return (
      <div className="flex min-h-[480px] items-center justify-center rounded-2xl border border-black/10 bg-white">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }
  const currentEditor = editor;

  function setLink() {
    const current = currentEditor.getAttributes("link").href as string | undefined;
    const href = window.prompt(
      "ใส่ URL เช่น /booking หรือ https://example.com",
      current ?? "",
    );
    if (href === null) return;
    if (!href.trim()) {
      currentEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    currentEditor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: href.trim() })
      .run();
  }

  async function uploadInlineImage(file: File) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      setUploadError("ยังไม่ได้ตั้งค่า Cloudinary");
      return;
    }

    const alt = window.prompt(
      "อธิบายภาพนี้สำหรับผู้ใช้โปรแกรมอ่านหน้าจอ",
      file.name.replace(/\.[^.]+$/, ""),
    );
    if (!alt?.trim()) {
      setUploadError("ต้องใส่คำอธิบายภาพก่อนอัปโหลด");
      return;
    }

    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", preset);
      formData.append("folder", "c-electronics/articles");
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );
      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error?.message ?? `HTTP ${response.status}`);
      }

      const src = String(result.secure_url).replace(
        "/upload/",
        "/upload/f_auto,q_auto/",
      );
      currentEditor.chain().focus().setImage({ src, alt: alt.trim() }).run();
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "อัปโหลดรูปไม่สำเร็จ",
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white focus-within:border-primary">
      <div className="flex flex-wrap items-center gap-1 border-b border-black/5 bg-canvas-muted/70 p-2">
        <ToolbarButton
          label="ย้อนกลับ"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="ทำซ้ำ"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-6 w-px bg-black/10" />
        <ToolbarButton
          label="หัวข้อ H2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="หัวข้อ H3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="ตัวหนา"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="ตัวเอียง"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="ขีดฆ่า"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="รายการ"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="รายการตัวเลข"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="ข้อความอ้างอิง"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="เพิ่มหรือแก้ลิงก์"
          active={editor.isActive("link")}
          onClick={setLink}
        >
          <LinkIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="นำลิงก์ออก"
          disabled={!editor.isActive("link")}
          onClick={() =>
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
          }
        >
          <Unlink className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="เพิ่มรูป"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
        </ToolbarButton>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadInlineImage(file);
          }}
        />
      </div>
      {uploadError && (
        <p className="border-b border-negative/10 bg-negative/5 px-4 py-2 text-xs text-negative">
          {uploadError}
        </p>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
