import {
  isValidArticleDocument,
  sanitizeArticleUrl,
  sanitizeCanonical,
  SITE_URL,
  type ArticleDocument,
} from "./articles";
import {
  slugifyServiceName,
  type ServiceFaq,
  type ServiceProcessStep,
} from "./services";

export type LegacyServiceMetadata = {
  slug: string;
  icon: string;
  image: string | null;
  imageAlt: string | null;
  content: ArticleDocument;
  processSteps: ServiceProcessStep[];
  faqs: ServiceFaq[];
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
};

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

function setIfMissing(formData: FormData, key: string, value: string) {
  if (!formData.has(key)) formData.set(key, value);
}

export function completeLegacyServiceFormData(
  formData: FormData,
  existing?: LegacyServiceMetadata,
): FormData {
  setIfMissing(
    formData,
    "slug",
    existing?.slug ?? String(formData.get("name") ?? ""),
  );
  setIfMissing(formData, "icon", existing?.icon ?? "Wrench");
  setIfMissing(
    formData,
    "content",
    JSON.stringify(
      existing?.content ?? {
        type: "doc",
        content: [{ type: "paragraph", content: [] }],
      },
    ),
  );
  setIfMissing(
    formData,
    "processSteps",
    JSON.stringify(existing?.processSteps ?? []),
  );
  setIfMissing(formData, "faqs", JSON.stringify(existing?.faqs ?? []));

  if (existing) {
    const submittedImage = String(formData.get("image") ?? "").trim();
    if (submittedImage === (existing.image ?? "")) {
      setIfMissing(formData, "imageAlt", existing.imageAlt ?? "");
    }
    setIfMissing(formData, "seoTitle", existing.seoTitle ?? "");
    setIfMissing(formData, "seoDescription", existing.seoDescription ?? "");
    setIfMissing(formData, "canonicalUrl", existing.canonicalUrl ?? "");
    if (existing.featured) setIfMissing(formData, "featured", "on");
    if (existing.noIndex) setIfMissing(formData, "noIndex", "on");
  }

  return formData;
}

export function deriveServiceImagePublicId(imageUrl: string): string | null {
  const url = new URL(imageUrl, SITE_URL);
  if (url.hostname.toLocaleLowerCase() !== "res.cloudinary.com") return null;

  const segments = url.pathname.split("/").filter(Boolean);
  const uploadIndex = segments.findIndex(
    (segment, index) => segment === "upload" && segments[index - 1] === "image",
  );
  const versionIndex = segments.findIndex(
    (segment, index) => index > uploadIndex && /^v\d+$/.test(segment),
  );
  if (uploadIndex < 1 || versionIndex < 0) {
    throw new Error("รูป Cloudinary ของบริการไม่ถูกต้อง");
  }

  const encodedAssetPath = segments.slice(versionIndex + 1).join("/");
  let assetPath: string;
  try {
    assetPath = decodeURIComponent(encodedAssetPath);
  } catch {
    throw new Error("รูป Cloudinary ของบริการไม่ถูกต้อง");
  }
  const extensionIndex = assetPath.lastIndexOf(".");
  const publicId = extensionIndex > 0
    ? assetPath.slice(0, extensionIndex)
    : assetPath;
  if (
    !publicId.startsWith("c-electronics/services/") ||
    publicId.length <= "c-electronics/services/".length ||
    publicId.includes("\\") ||
    publicId.split("/").includes("..")
  ) {
    throw new Error(
      "รูป Cloudinary ต้องอยู่ในโฟลเดอร์ c-electronics/services",
    );
  }
  return publicId;
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
  const image = imageInput
    ? sanitizeArticleUrl(imageInput, "image") ?? null
    : null;
  const imagePublicId = image ? deriveServiceImagePublicId(image) : null;

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
    image,
    imageAlt: optionalText(formData, "imageAlt"),
    imagePublicId,
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
