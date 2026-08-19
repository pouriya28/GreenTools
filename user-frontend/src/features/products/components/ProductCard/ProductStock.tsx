import type { StockStatus } from "./ProductTypes";

interface ProductStockProps {
  status: StockStatus;
}

const STOCK_LABELS: Record<StockStatus, { label: string; className: string }> = {
  in_stock: { label: "موجود در انبار", className: "text-success" },
  out_of_stock: { label: "ناموجود", className: "text-error" },
  preorder: { label: "قابل پیش‌فروش", className: "text-info" },
};

export function ProductStock({ status }: ProductStockProps) {
  const { label, className } = STOCK_LABELS[status];
  return <span className={`text-xs font-medium ${className}`}>{label}</span>;
}