"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ServiceForm } from "./service-form";

export function ServiceCreatePanel() {
  return (
    <div
      id="create-service-panel"
      className="mt-4 rounded-[24px] border border-primary/10 bg-canvas-muted p-4 sm:p-5"
    >
      <ServiceForm embedded />
    </div>
  );
}

export function ServiceQuickCreate() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="create-service-panel"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Plus
          className={`size-4 transition-transform ${open ? "rotate-45" : ""}`}
        />
        {open ? "ย่อ" : "เพิ่มบริการ"}
      </button>
      {open && <ServiceCreatePanel />}
    </div>
  );
}
