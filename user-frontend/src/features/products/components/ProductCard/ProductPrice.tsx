interface ProductPriceProps {
  price: number;
  finalPrice: number;
  hasActiveDiscount: boolean;
}

// فرض: قیمت‌ها به تومان از بکند میان (عدد صحیح) — اگه ریاله یا واحد دیگه، بگو تا اصلاح کنم
const formatToman = (value: number) => `${value.toLocaleString("fa-IR")} تومان`;

export function ProductPrice({ price, finalPrice, hasActiveDiscount }: ProductPriceProps) {
  return (
    <div className="flex flex-col gap-1">
      {hasActiveDiscount ? (
        <>
          <span className="text-muted line-through text-sm">{formatToman(price)}</span>
          <span className="text-primary font-black text-xl">{formatToman(finalPrice)}</span>
        </>
      ) : (
        <span className="text-text font-black text-xl">{formatToman(price)}</span>
      )}
    </div>
  );
}