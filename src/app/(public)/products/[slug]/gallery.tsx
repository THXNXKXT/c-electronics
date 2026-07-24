"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [idx, setIdx] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-[20px] border border-black/5 bg-surface-tint">
        <ImageIcon className="size-16 text-subtle" strokeWidth={1.5} />
      </div>
    );
  }

  const current = images[Math.min(idx, images.length - 1)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Big image */}
      <div className="aspect-square overflow-hidden rounded-[20px] border border-black/5 bg-surface-tint">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current} alt={name} className="size-full object-cover transition-opacity duration-200" />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`ดูภาพที่ ${i + 1}`}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-surface-tint transition-colors ${
                i === idx ? "border-primary" : "border-transparent hover:border-black/10"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${name} ${i + 1}`} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
