// features/products/components/ProductCard/ProductPreview.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaHeart, FaEye } from "react-icons/fa";
import type { Product } from "./ProductTypes";

interface ProductPreviewProps {
  product: Product;
}

export function ProductPreview({ product }: ProductPreviewProps) {
  const navigate = useNavigate();
  const goToProduct = () => navigate(`/products/${product.slug}`);

  const stopAndRun = (event: React.MouseEvent, action?: () => void) => {
    event.stopPropagation();
    action?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={goToProduct}
        role="link"
        aria-label={`مشاهده صفحه‌ی ${product.name}`}
        className="
          absolute inset-0 z-30 rounded-3xl cursor-pointer
          bg-white/20 dark:bg-black/30 backdrop-blur-xl
          border border-white/20 shadow-2xl p-5
          flex flex-col gap-4
        "
      >
        <div className="w-full h-[180px] rounded-2xl overflow-hidden bg-background">
          {product.primary_image ? (
            <img
              src={product.primary_image.url}
              alt={product.primary_image.alt_text || product.name}
              className="w-full h-full object-contain p-4"
            />
          ) : null}
        </div>
        <h3 className="text-text font-black text-lg line-clamp-2">{product.name}</h3>
        <p className="text-text-secondary text-sm line-clamp-3">
          {product.short_description ?? "توضیحی برای این محصول ثبت نشده است."}
        </p>
        <div className="mt-auto flex justify-center gap-3">
          <button
            type="button"
            aria-label="افزودن به سبد خرید"
            onClick={(event) => stopAndRun(event)}
            className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center hover:scale-110 transition"
          >
            <FaShoppingCart />
          </button>
          <button
            type="button"
            aria-label="افزودن به علاقه‌مندی‌ها"
            onClick={(event) => stopAndRun(event)}
            className="w-11 h-11 rounded-full bg-surface text-error flex items-center justify-center hover:scale-110 transition"
          >
            <FaHeart />
          </button>
          <button
            type="button"
            aria-label="مشاهده سریع"
            onClick={(event) => stopAndRun(event, goToProduct)}
            className="w-11 h-11 rounded-full bg-surface text-info flex items-center justify-center hover:scale-110 transition"
          >
            <FaEye />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}