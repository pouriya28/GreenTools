import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";

interface PriceRangeFilterProps {
  minPrice?: number;
  maxPrice?: number;
  onChange: (min: number | null, max: number | null) => void;
}

export function PriceRangeFilter({ minPrice, maxPrice, onChange }: PriceRangeFilterProps) {
  const [min, setMin] = useState(minPrice?.toString() ?? "");
  const [max, setMax] = useState(maxPrice?.toString() ?? "");
  const debouncedMin = useDebouncedValue(min, 500);
  const debouncedMax = useDebouncedValue(max, 500);

  useEffect(() => {
    // پارس امن - فقط عدد نامنفی قبول میشه، هر چیز دیگه (حتی رشته‌ی مخرب) نادیده گرفته میشه
    const minNum = debouncedMin.trim() === "" ? null : Number(debouncedMin);
    const maxNum = debouncedMax.trim() === "" ? null : Number(debouncedMax);
    onChange(
      minNum !== null && Number.isFinite(minNum) && minNum >= 0 ? minNum : null,
      maxNum !== null && Number.isFinite(maxNum) && maxNum >= 0 ? maxNum : null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMin, debouncedMax]);

  return (
    <div>
      <h4 className="text-text font-bold text-sm mb-2">محدوده قیمت (تومان)</h4>
      <div className="flex items-center gap-2">
        <input type="number" inputMode="numeric" min={0} placeholder="از" value={min}
          onChange={(e) => setMin(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary" />
        <span className="text-muted">–</span>
        <input type="number" inputMode="numeric" min={0} placeholder="تا" value={max}
          onChange={(e) => setMax(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
    </div>
  );
}