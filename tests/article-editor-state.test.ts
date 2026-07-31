import assert from "node:assert/strict";
import test from "node:test";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { setRichTextEditorDisabled } from "../src/components/article-rich-text-editor";
import { shouldAcknowledgeServiceSave } from "../src/lib/service-admin-ui";

test("pending editor locks do not create changes after a save snapshot", () => {
  let revision = 3;
  let dirty = true;
  const editor = new Editor({
    element: null,
    extensions: [StarterKit],
    content: { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate() {
      revision += 1;
      dirty = true;
    },
  });

  try {
    const submittedRevision = revision;
    setRichTextEditorDisabled(editor, true);
    setRichTextEditorDisabled(editor, false);

    if (shouldAcknowledgeServiceSave(submittedRevision, revision)) {
      dirty = false;
    }

    assert.equal(revision, submittedRevision);
    assert.equal(dirty, false);
  } finally {
    editor.destroy();
  }
});
