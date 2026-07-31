export type ServiceConfirmationAction =
  | "publish"
  | "unpublish"
  | "archive"
  | "restore"
  | "delete"
  | "slug-change";

export function getServiceConfirmation(
  action: ServiceConfirmationAction,
  name: string,
  slugTransition?: { oldSlug: string; newSlug: string },
) {
  const slugChangeMessage = slugTransition
    ? `เปลี่ยน URL ของ “${name}” หรือไม่? URL เดิม: /services/${slugTransition.oldSlug} → URL ใหม่: /services/${slugTransition.newSlug} โดย URL เดิมจะเปลี่ยนเส้นทางถาวร`
    : `เปลี่ยน URL ของ “${name}” หรือไม่? URL เดิมจะเปลี่ยนเส้นทางมายัง URL ใหม่ถาวร`;
  const copy = {
    publish: ["เผยแพร่บริการ", `เผยแพร่ “${name}” บนเว็บไซต์หรือไม่?`, "เผยแพร่", "primary"],
    unpublish: ["ยกเลิกเผยแพร่", `นำรายละเอียด “${name}” ออกจากเว็บไซต์หรือไม่?`, "ยกเลิกเผยแพร่", "warning"],
    archive: ["เก็บบริการถาวร", `เก็บ “${name}” เข้าคลังหรือไม่? บริการจะถูกซ่อนจากเว็บไซต์ด้วย`, "เก็บถาวร", "warning"],
    restore: ["นำบริการกลับมา", `นำ “${name}” กลับมาเป็นฉบับร่างหรือไม่?`, "นำกลับมา", "primary"],
    delete: ["ลบร่างบริการ", `ลบร่าง “${name}” ถาวรหรือไม่? การทำรายการนี้ย้อนกลับไม่ได้`, "ลบร่าง", "danger"],
    "slug-change": ["เปลี่ยน URL บริการ", slugChangeMessage, "เปลี่ยน URL", "warning"],
  } as const;
  const [title, message, confirmLabel, variant] = copy[action];
  return { title, message, confirmLabel, variant };
}
