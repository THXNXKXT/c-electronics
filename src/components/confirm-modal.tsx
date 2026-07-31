"use client";

import { AlertTriangle, X } from "lucide-react";

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "ลบ",
  variant = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "primary" | "warning" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  const tone = {
    primary: {
      icon: "bg-primary-tint text-primary",
      button: "bg-primary hover:bg-primary-hover",
    },
    warning: {
      icon: "bg-warning/10 text-warning",
      button: "bg-warning hover:bg-warning/80",
    },
    danger: {
      icon: "bg-negative/10 text-negative",
      button: "bg-negative hover:bg-negative/80",
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative w-full max-w-sm rounded-[20px] bg-white p-6 shadow-xl"
      >
        <button type="button" disabled={busy} onClick={onCancel} className="absolute right-4 top-4 rounded-lg p-1.5 text-subtle hover:bg-black/5 hover:text-ink disabled:opacity-40">
          <X className="size-4" />
        </button>

        <div className={`flex size-12 items-center justify-center rounded-full ${tone.icon}`}>
          <AlertTriangle className="size-6" strokeWidth={2} />
        </div>

        <h3 id="confirm-modal-title" className="mt-4 text-lg font-bold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm text-muted">{message}</p>

        <div className="mt-6 flex gap-3">
          <button type="button" disabled={busy} onClick={onCancel} className="flex-1 whitespace-nowrap rounded-full border border-black/10 bg-white py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:opacity-40">
            ยกเลิก
          </button>
          <button type="button" disabled={busy} onClick={onConfirm} className={`flex-1 whitespace-nowrap rounded-full py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${tone.button}`}>
            {busy ? "กำลังดำเนินการ..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
