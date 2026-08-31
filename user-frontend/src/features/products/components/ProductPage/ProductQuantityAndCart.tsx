// src/features/products/components/ProductPage/ProductQuantityAndCart.tsx (به‌روزرسانی)
import { useState } from "react";
import { motion } from "framer-motion";
import { FiShoppingCart, FiHeart } from "react-icons/fi";
import { useCartStore } from "@/store/cartStore";
import type { ProductDetail } from "../../types/ProductDetail";

interface ProductQuantityAndCartProps {
  product: ProductDetail;
  canAddToCart?: boolean;
}

export function ProductQuantityAndCart({ product, canAddToCart = true }: ProductQuantityAndCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const isOutOfStock = product.stock_status === "out_of_stock";
  const isDisabled = isOutOfStock || !canAddToCart;
  const maxQuantity = Math.max(1, product.stock_quantity);

  const handleAddToCart = () => {
    if (isDisabled) return;
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images.find((img) => img.is_primary)?.url ?? product.images[0]?.url ?? null,
        unitPrice: product.final_price,
      },
      quantity,
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  const label = isOutOfStock
    ? "ناموجود"
    : !canAddToCart
      ? "ابتدا شرایط خرید را تأیید کنید"
      : justAdded
        ? "به سبد افزوده شد ✓"
        : "افزودن به سبد خرید";

  return (
    <div className="flex items-center gap-3" dir="rtl">
      <div className="flex items-center rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          className="px-3 py-2 text-text transition-colors duration-150 hover:text-primary"
          aria-label="افزایش تعداد"
        >
          +
        </button>
        <span className="min-w-8 text-center text-text">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="px-3 py-2 text-text transition-colors duration-150 hover:text-primary"
          aria-label="کاهش تعداد"
        >
          -
        </button>
      </div>

      <motion.button
        type="button"
        onClick={handleAddToCart}
        disabled={isDisabled}
        whileTap={{ scale: isDisabled ? 1 : 0.97 }}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FiShoppingCart />
        {label}
      </motion.button>

      <button
        type="button"
        aria-label="افزودن به علاقه‌مندی‌ها"
        className="rounded-lg border border-border p-2.5 text-text transition-colors duration-150 hover:text-error"
      >
        <FiHeart />
      </button>
    </div>
  );
}