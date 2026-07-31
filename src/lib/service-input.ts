import {
  isValidArticleDocument,
  sanitizeArticleUrl,
  sanitizeCanonical,
  type ArticleDocument,
} from "./articles";
import {
  slugifyServiceName,
  type ServiceFaq,
  type ServiceProcessStep,
} from "./services";

export type ServiceInput = {
  name: string;
  slug: string;
  description: string;
  price: string | null;
  icon: string;
  image: string | null;
  imageAlt: string | null;
  imagePublicId: string | null;
  features: string | null;
  content: ArticleDocument;
  processSteps: ServiceProcessStep[];
  faqs: ServiceFaq[];
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
};

function optionalText(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function parseJson(formData: FormData, key: string, label: string): unknown {
  try {
    return JSON.parse(String(formData.get(key) ?? ""));
  } catch {
    throw new Error(`รูปแบบ${label}ไม่ถูกต้อง`);
  }
}

function parseProcessSteps(formData: FormData): ServiceProcessStep[] {
  const value = parseJson(formData, "processSteps", "ขั้นตอนบริการ");
  if (!Array.isArray(value) || value.length > 12) {
    throw new Error("ขั้นตอนบริการต้องมีไม่เกิน 12 ขั้นตอน");
  }

  return value.map((step) => {
    if (!step || typeof step !== "object") {
      throw new Error("ข้อมูลขั้นตอนบริการไม่ถูกต้อง");
    }
    const rawTitle = (step as Record<string, unknown>).title;
    const rawDescription = (step as Record<string, unknown>).description;
    if (typeof rawTitle !== "string" || typeof rawDescription !== "string") {
      throw new Error("ข้อมูลขั้นตอนบริการต้องเป็นข้อความ");
    }
    const title = rawTitle.trim();
    const description = rawDescription.trim();
    if (!title || title.length > 180) {
      throw new Error("ชื่อขั้นตอนต้องมีไม่เกิน 180 ตัวอักษร");
    }
    if (!description || description.length > 1_000) {
      throw new Error("คำอธิบายขั้นตอนต้องมีไม่เกิน 1,000 ตัวอักษร");
    }
    return { title, description };
  });
}

function parseFaqs(formData: FormData): ServiceFaq[] {
  const value = parseJson(formData, "faqs", " FAQ");
  if (!Array.isArray(value) || value.length > 20) {
    throw new Error("FAQ ต้องมีไม่เกิน 20 รายการ");
  }

  return value.map((faq) => {
    if (!faq || typeof faq !== "object") {
      throw new Error("ข้อมูล FAQ ไม่ถูกต้อง");
    }
    const rawQuestion = (faq as Record<string, unknown>).question;
    const rawAnswer = (faq as Record<string, unknown>).answer;
    if (typeof rawQuestion !== "string" || typeof rawAnswer !== "string") {
      throw new Error("ข้อมูล FAQ ต้องเป็นข้อความ");
    }
    const question = rawQuestion.trim();
    const answer = rawAnswer.trim();
    if (!question || question.length > 180) {
      throw new Error("คำถาม FAQ ต้องมีไม่เกิน 180 ตัวอักษร");
    }
    if (!answer || answer.length > 1_000) {
      throw new Error("คำตอบ FAQ ต้องมีไม่เกิน 1,000 ตัวอักษร");
    }
    return { question, answer };
  });
}

export function parseServiceInput(formData: FormData): ServiceInput {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const requestedSlug = String(formData.get("slug") ?? "").trim();
  const rawContent = parseJson(formData, "content", "เนื้อหา");
  const canonicalInput = optionalText(formData, "canonicalUrl");
  const imageInput = optionalText(formData, "image");

  if (name.length < 3 || name.length > 120) {
    throw new Error("ชื่อบริการต้องมี 3–120 ตัวอักษร");
  }
  if (description.length < 20 || description.length > 500) {
    throw new Error("คำอธิบายต้องมี 20–500 ตัวอักษร");
  }

  const slug = slugifyServiceName(requestedSlug || name);
  if (!slug) throw new Error("กรุณาระบุ slug บริการ");

  if (!isValidArticleDocument(rawContent)) {
    throw new Error("เนื้อหามี node, link หรือรูปภาพที่ระบบไม่รองรับ");
  }
  if (canonicalInput && !sanitizeCanonical(canonicalInput)) {
    throw new Error(
      "Canonical ต้องเป็น path หรือ URL ของเว็บไซต์นี้เท่านั้น",
    );
  }
  if (imageInput && !sanitizeArticleUrl(imageInput, "image")) {
    throw new Error("รูปบริการต้องมาจาก Cloudinary หรือเว็บไซต์นี้");
  }

  const highlights = String(formData.get("features") ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  if (highlights.length > 12) {
    throw new Error("จุดเด่นบริการต้องมีไม่เกิน 12 รายการ");
  }

  return {
    name,
    slug,
    description,
    price: optionalText(formData, "price"),
    icon: optionalText(formData, "icon") ?? "Wrench",
    image: imageInput ? sanitizeArticleUrl(imageInput, "image") ?? null : null,
    imageAlt: optionalText(formData, "imageAlt"),
    imagePublicId: optionalText(formData, "imagePublicId"),
    features: highlights.length ? highlights.join("|") : null,
    content: rawContent,
    processSteps: parseProcessSteps(formData),
    faqs: parseFaqs(formData),
    featured: formData.get("featured") === "on",
    seoTitle: optionalText(formData, "seoTitle"),
    seoDescription: optionalText(formData, "seoDescription"),
    canonicalUrl: canonicalInput
      ? sanitizeCanonical(canonicalInput) ?? null
      : null,
    noIndex: formData.get("noIndex") === "on",
  };
}
