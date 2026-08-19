import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import type { ProductFiltersState } from "../../types/filters.types";
import { ProductFiltersPanel } from "./ProductFiltersPanel";

interface Props {
  open: boolean;
  onClose: () => void;
  filters: ProductFiltersState;
  activeCount: number;
  onCategoryChange: (slug: string | null) => void;
  onPriceChange: (min: number | null, max: number | null) => void;
  onToggle: (key: "in_stock" | "has_discount" | "is_featured") => void;
  onClearAll: () => void;
}

export function ProductFiltersSheet({ open, onClose, filters, activeCount, onCategoryChange, onPriceChange, onToggle, onClearAll }: Props) {
  // قفل اسکرول بدنه وقتی شیت بازه
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [open]);

  // بستن با ESC - دسترسی‌پذیری استاندارد
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" />

          <motion.div role="dialog" aria-modal="true" aria-label="فیلترهای محصولات"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-50 lg:hidden max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-text font-bold text-lg">
                فیلترها {activeCount > 0 && <span className="text-primary">({activeCount})</span>}
              </h3>
              <button type="button" onClick={onClose} aria-label="بستن فیلترها"
                className="w-9 h-9 rounded-full bg-background flex items-center justify-center">
                <FaTimes />
              </button>
            </div>

            <ProductFiltersPanel filters={filters} onCategoryChange={onCategoryChange} onPriceChange={onPriceChange} onToggle={onToggle} />

            <div className="flex gap-3 mt-6 sticky bottom-0 bg-surface pt-3 pb-1">
              <button type="button" onClick={onClearAll} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium">
                پاک کردن
              </button>
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium">
                نمایش نتایج
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}