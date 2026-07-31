import type { ArticleDocument } from "./articles";
import {
  canDeleteServicePermanently,
  type ServiceFaq,
  type ServiceProcessStep,
  type ServiceStatus,
} from "./services";

export type ServiceEditorState = {
  content: ArticleDocument;
  image: string;
  imagePublicId: string;
  features: string[];
  processSteps: ServiceProcessStep[];
  faqs: ServiceFaq[];
};

export function serializeServiceEditorState(
  state: ServiceEditorState,
): Record<
  "content" | "image" | "imagePublicId" | "features" | "processSteps" | "faqs",
  string
> {
  return {
    content: JSON.stringify(state.content),
    image: state.image,
    imagePublicId: state.imagePublicId,
    features: state.features
      .map((feature) => feature.trim())
      .filter(Boolean)
      .join("|"),
    processSteps: JSON.stringify(
      state.processSteps.filter(
        (step) => step.title.trim() || step.description.trim(),
      ),
    ),
    faqs: JSON.stringify(
      state.faqs.filter((faq) => faq.question.trim() || faq.answer.trim()),
    ),
  };
}

export function getServiceRowActionAvailability(service: {
  status: ServiceStatus;
  archived: boolean;
  publishedAt: Date | null;
}): {
  publication: "publish" | "unpublish" | null;
  archive: "archive" | "restore";
  canDelete: boolean;
} {
  return {
    publication: service.archived
      ? null
      : service.status === "published"
        ? "unpublish"
        : "publish",
    archive: service.archived ? "restore" : "archive",
    canDelete: canDeleteServicePermanently(service),
  };
}

export function isServiceFormBusy(
  mutationPending: boolean,
  imageUploading: boolean,
): boolean {
  return mutationPending || imageUploading;
}

export function isServicePublicationBlocked(
  action: "publish" | "unpublish",
  editorDirty: boolean,
  busy: boolean,
): boolean {
  return busy || (action === "publish" && editorDirty);
}
