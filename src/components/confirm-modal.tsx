"use client";

import { AlertTriangle, X } from "lucide-react";

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "ลบ",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-[20px] bg-white p-6 shadow-xl">
        <button onClick={onCancel} className="absolute right-4 top-4 rounded-lg p-1.5 text-subtle hover:bg-black/5 hover:text-ink">
          <X className="size-4" />
        </button>

        <div className="flex size-12 items-center justify-center rounded-full bg-negative/10">
          <AlertTriangle className="size-6 text-negative" strokeWidth={2} />
        </div>

        <h3 className="mt-4 text-lg font-bold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm text-muted">{message}</p>

        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 whitespace-nowrap rounded-full border border-black/10 bg-white py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink">
            ยกเลิก
          </button>
          <button onClick={onConfirm} className="flex-1 whitespace-nowrap rounded-full bg-negative py-2.5 text-sm font-semibold text-white transition-colors hover:bg-negative/80">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
