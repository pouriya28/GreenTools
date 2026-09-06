import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiShoppingCart, FiHeart, FiMessageCircle } from "react-icons/fi";
import { useAddCartItem } from "@/features/cart/hooks/useAddCartItem";
import type { ProductDetail } from "../../types/ProductDetail";
import { PURCHASE_REQUIREMENT_TONE } from "../../utils/purchaseRequirement";

// سطح ماژول — هم ProductQuantityAndCart هم RestrictedPurchaseCta بهش دسترسی دارن
const TONE_CLASSES: Record<string, string> = {
  neutral: "border-border bg-surface text-text-secondary",
  warning: "border-warning/40 bg-warning/10 text-warning",
  danger: "border-error/40 bg-error/10 text-error",
};

interface ProductQuantityAndCartProps {
  product: ProductDetail;
  canAddToCart?: boolean;
  purchaseConfirmed?: boolean;
}

export function ProductQuantityAndCart({
  product,
  canAddToCart = true,
  purchaseConfirmed = false,
}: ProductQuantityAndCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const addCartItemMutation = useAddCartItem();

  // فقط محصولات «محدود» اصلاً امکان افزودن به سبد ندارند — بقیه‌ی انواع
  // (نیاز به مشاوره / نصب تخصصی) روند خرید عادی را حفظ می‌کنند و فقط یک
  // دکمه‌ی تماس در ProductPurchaseRequirementNotice به آن‌ها اضافه می‌شود.
  if (product.purchase_requirement === "restricted") {
    return <RestrictedPurchaseCta product={product} />;
  }

  const isOutOfStock = product.stock_status === "out_of_stock";
  const maxQuantity = Math.max(1, product.stock_quantity);
  const isDisabled = isOutOfStock || !canAddToCart || addCartItemMutation.isPending;

  const handleAddToCart = () => {
    if (isDisabled) return;
    addCartItemMutation.mutate(
      { product_id: product.id, quantity, purchase_confirmed: purchaseConfirmed },
      {
        onSuccess: () => {
          setJustAdded(true);
          window.setTimeout(() => setJustAdded(false), 1200);
        },
      }
    );
  };

  const label = isOutOfStock
    ? "ناموجود"
    : !canAddToCart
      ? "ابتدا شرایط خرید را تأیید کنید"
      : addCartItemMutation.isPending
        ? "در حال افزودن..."
        : justAdded
          ? "به سبد افزوده شد ✓"
          : "افزودن به سبد خرید";

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      {product.purchase_requirement === "professional_installation" && product.installation_notice && (
        <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
          {product.installation_notice}
        </p>
      )}

      <div className="flex items-center gap-3">
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
    </div>
  );
}

function RestrictedPurchaseCta({ product }: { product: ProductDetail }) {
  const notice = product.technical_notice ?? product.compatibility_notice;
  const tone = PURCHASE_REQUIREMENT_TONE[product.purchase_requirement];

  return (
    <div className={`flex flex-col gap-3 rounded-lg border p-4 ${TONE_CLASSES[tone]}`} dir="rtl">
      <div>
        <p className="text-sm font-semibold">{product.purchase_requirement_label}</p>
        {notice && <p className="mt-1 text-xs text-text-secondary">{notice}</p>}
      </div>
      <Link
        to="/support"
        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors duration-150 hover:bg-primary-hover"
      >
        <FiMessageCircle />
        خرید این محصول فقط از طریق پشتیبانی
      </Link>
    </div>
  );
}