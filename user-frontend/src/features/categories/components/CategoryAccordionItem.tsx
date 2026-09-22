import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { Category } from "../types/Category";

interface CategoryAccordionItemProps {
  category: Category;
  depth?: number;
}

export function CategoryAccordionItem({ category, depth = 0 }: CategoryAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children.length > 0;

  return (
    <div
      className="rounded-2xl border border-border bg-surface/60 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_24px_var(--primary-glow)]"
      style={depth > 0 ? { marginRight: `${depth * 1.25}rem` } : undefined}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <Link
          to={`/products?category_slug=${category.slug}`}
          className="flex-1 text-sm font-medium text-text transition-colors hover:text-primary"
        >
          {category.name}
        </Link>

        {hasChildren && (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-label={isOpen ? "بستن زیردسته‌ها" : "نمایش زیردسته‌ها"}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <motion.svg
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </motion.svg>
          </button>
        )}
      </div>

      {hasChildren && (
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="children"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 px-4 pb-4">
                {category.children.map((child) => (
                  <CategoryAccordionItem key={child.id} category={child} depth={depth + 1} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}