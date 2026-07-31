import {
  sanitizeArticleUrl,
  slugifyArticleTitle,
  textFromArticleNode,
  type ArticleDocument,
  type ArticleMark,
  type ArticleNode,
} from "@/lib/articles";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

function renderMarkedText(
  text: string,
  marks: ArticleMark[] = [],
  key: string,
): ReactNode {
  return marks.reduce<ReactNode>((content, mark, index) => {
    const markKey = `${key}-mark-${index}`;
    switch (mark.type) {
      case "bold":
        return <strong key={markKey}>{content}</strong>;
      case "italic":
        return <em key={markKey}>{content}</em>;
      case "strike":
        return <s key={markKey}>{content}</s>;
      case "code":
        return (
          <code
            key={markKey}
            className="rounded bg-canvas-muted px-1.5 py-0.5 text-[0.9em]"
          >
            {content}
          </code>
        );
      case "link": {
        const href = sanitizeArticleUrl(mark.attrs?.href, "link");
        if (!href) return content;
        const external = href.startsWith("http");
        return (
          <Link
            key={markKey}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
          >
            {content}
          </Link>
        );
      }
      default:
        return content;
    }
  }, text);
}

export function ArticleContent({
  document,
}: {
  document: ArticleDocument;
}) {
  const headingIds = new Map<string, number>();

  function renderChildren(node: ArticleNode, path: string): ReactNode[] {
    return (node.content ?? []).map((child, index) =>
      renderNode(child, `${path}-${index}`),
    );
  }

  function renderNode(node: ArticleNode, key: string): ReactNode {
    if (node.type === "text") {
      return (
        <Fragment key={key}>
          {renderMarkedText(node.text ?? "", node.marks, key)}
        </Fragment>
      );
    }

    const children = renderChildren(node, key);
    switch (node.type) {
      case "paragraph":
        return <p key={key}>{children}</p>;
      case "heading": {
        const level = Number(node.attrs?.level) === 3 ? 3 : 2;
        const text = textFromArticleNode(node);
        const baseId = slugifyArticleTitle(text);
        const count = (headingIds.get(baseId) ?? 0) + 1;
        headingIds.set(baseId, count);
        const id = count === 1 ? baseId : `${baseId}-${count}`;
        return level === 3 ? (
          <h3 key={key} id={id}>
            {children}
          </h3>
        ) : (
          <h2 key={key} id={id}>
            {children}
          </h2>
        );
      }
      case "bulletList":
        return <ul key={key}>{children}</ul>;
      case "orderedList": {
        const start = Number(node.attrs?.start);
        return (
          <ol key={key} start={Number.isFinite(start) ? start : undefined}>
            {children}
          </ol>
        );
      }
      case "listItem":
        return <li key={key}>{children}</li>;
      case "blockquote":
        return <blockquote key={key}>{children}</blockquote>;
      case "hardBreak":
        return <br key={key} />;
      case "horizontalRule":
        return <hr key={key} />;
      case "image": {
        const src = sanitizeArticleUrl(node.attrs?.src, "image");
        if (!src) return null;
        const alt =
          typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={key}
            src={src}
            alt={alt}
            loading="lazy"
            className="my-8 max-h-[620px] w-full rounded-[20px] object-cover"
          />
        );
      }
      default:
        return null;
    }
  }

  return (
    <div className="article-content">
      {(document.content ?? []).map((node, index) =>
        renderNode(node, `node-${index}`),
      )}
    </div>
  );
}
