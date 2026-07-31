export type ArticleConfirmationAction =
  | "publish"
  | "unpublish"
  | "archive"
  | "restore"
  | "delete";

export type ConfirmationVariant = "primary" | "warning" | "danger";

export type ArticleConfirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  variant: ConfirmationVariant;
};

export function getArticleConfirmation(
  action: ArticleConfirmationAction,
  articleTitle: string,
): ArticleConfirmation {
  switch (action) {
    case "publish":
      return {
        title: "เผยแพร่บทความ",
        message: `เผยแพร่ “${articleTitle}” บนเว็บไซต์หรือไม่?`,
        confirmLabel: "เผยแพร่",
        variant: "primary",
      };
    case "unpublish":
      return {
        title: "ยกเลิกเผยแพร่",
        message: `นำ “${articleTitle}” ออกจากหน้าเว็บไซต์หรือไม่?`,
        confirmLabel: "ยกเลิกเผยแพร่",
        variant: "warning",
      };
    case "archive":
      return {
        title: "เก็บบทความถาวร",
        message: `เก็บ “${articleTitle}” เข้าคลังหรือไม่? บทความจะถูกยกเลิกเผยแพร่ด้วย`,
        confirmLabel: "เก็บถาวร",
        variant: "warning",
      };
    case "restore":
      return {
        title: "นำบทความกลับมา",
        message: `นำ “${articleTitle}” กลับมาเป็นฉบับร่างหรือไม่?`,
        confirmLabel: "นำกลับมา",
        variant: "primary",
      };
    case "delete":
      return {
        title: "ลบร่างบทความ",
        message: `ลบร่าง “${articleTitle}” ถาวรหรือไม่? การทำรายการนี้ย้อนกลับไม่ได้`,
        confirmLabel: "ลบร่าง",
        variant: "danger",
      };
  }
}
