// features/products/components/ProductCard/ProductActions.tsx
import { FaHeart, FaShoppingCart, FaEye } from "react-icons/fa";

interface ProductActionsProps {
  productId: number;
  disabled?: boolean;
}

export function ProductActions({ disabled }: ProductActionsProps) {
  return (
    <div
      className="
        absolute bottom-5 left-1/2 -translate-x-1/2
        flex items-center gap-3
        pointer-events-none
        opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto
        transition-all duration-300 z-20
      "
    >
      <button type="button" aria-label="افزودن به علاقه‌مندی‌ها" className="w-11 h-11 rounded-full bg-surface/80 backdrop-blur-xl border border-border flex items-center justify-center text-error hover:scale-110 transition">
        <FaHeart />
      </button>
      <button
        type="button"
        aria-label="افزودن به سبد خرید"
        disabled={disabled}
        className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 transition disabled:opacity-40 disabled:hover:scale-100"
      >
        <FaShoppingCart />
      </button>
      <button type="button" aria-label="مشاهده سریع" className="w-11 h-11 rounded-full bg-surface/80 backdrop-blur-xl border border-border flex items-center justify-center text-info hover:scale-110 transition">
        <FaEye />
      </button>
    </div>
  );
}