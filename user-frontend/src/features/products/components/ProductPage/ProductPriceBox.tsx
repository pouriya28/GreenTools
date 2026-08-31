// src/features/products/components/ProductPage/ProductPriceBox.tsx
interface ProductPriceBoxProps {
  price: number;
  finalPrice: number;
  discountPercentage: number | null;
  hasActiveDiscount: boolean;
}

const formatToman = (value: number) => `${value.toLocaleString("fa-IR")} تومان`;

export function ProductPriceBox({ price, finalPrice, discountPercentage, hasActiveDiscount }: ProductPriceBoxProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4" dir="rtl">
      {hasActiveDiscount && discountPercentage ? (
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
            {discountPercentage}٪ تخفیف
          </span>
          <span className="text-sm text-muted line-through">{formatToman(price)}</span>
        </div>
      ) : null}
      <span className="text-2xl font-bold text-text">{formatToman(finalPrice)}</span>
    </div>
  );
}