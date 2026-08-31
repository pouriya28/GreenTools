// src/features/products/components/ProductPage/ProductGallery.tsx
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ProductImage } from "../ProductCard/ProductTypes";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const primaryIndex = sorted.findIndex((img) => img.is_primary);
  const [activeIndex, setActiveIndex] = useState(primaryIndex === -1 ? 0 : primaryIndex);
  const active = sorted[activeIndex];

  if (!active) {
    return <div className="aspect-square w-full rounded-2xl border border-border bg-surface" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface">
        <AnimatePresence mode="wait">
          <motion.img
            key={active.id}
            src={active.url}
            alt={active.alt_text ?? productName}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full w-full object-contain"
          />
        </AnimatePresence>
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto" dir="rtl">
          {sorted.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${productName} - تصویر ${index + 1}`}
              className={`shrink-0 overflow-hidden rounded-lg border transition-colors duration-150 ${
                index === activeIndex ? "border-primary" : "border-border"
              }`}
            >
              <img src={img.url} alt={img.alt_text ?? productName} className="h-16 w-16 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}