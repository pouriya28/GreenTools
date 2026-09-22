import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useCategories } from "../hooks/useCategories";

interface CategoryMegaMenuProps {
  isOpen: boolean;
}

export function CategoryMegaMenu({ isOpen }: CategoryMegaMenuProps) {
  const { data, isLoading } = useCategories();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-primary/15 bg-surface/95 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl"
          dir="rtl"
        >
          {isLoading && <p className="px-2 py-1 text-xs text-muted">در حال بارگذاری...</p>}

          {data && data.length > 0 && (
            <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
              {data.map((category) => (
                <div key={category.id} className="group rounded-lg px-2 py-1.5 transition-colors hover:bg-primary/5">
                  <Link
                    to={`/products?category_slug=${category.slug}`}
                    className="text-xs font-semibold text-text transition-colors group-hover:text-primary"
                  >
                    {category.name}
                  </Link>
                  {category.children.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                      {category.children.slice(0, 3).map((child) => (
                        <Link
                          key={child.id}
                          to={`/products?category_slug=${child.slug}`}
                          className="text-[11px] text-muted transition-colors hover:text-primary"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <Link
            to="/categories"
            className="mt-2 block border-t border-border pt-2 text-center text-[11px] font-medium text-primary hover:underline"
          >
            مشاهده‌ی همه‌ی دسته‌بندی‌ها ←
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}