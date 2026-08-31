// src/features/products/components/ProductPage/ProductSpecsTabs.tsx
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ProductDetail } from "../../types/ProductDetail";

interface ProductSpecsTabsProps {
  product: ProductDetail;
}

type TabKey = "description" | "specs" | "reviews";

const TABS: { key: TabKey; label: string }[] = [
  { key: "description", label: "توضیحات" },
  { key: "specs", label: "مشخصات فنی" },
  { key: "reviews", label: "نظرات کاربران" },
];

export function ProductSpecsTabs({ product }: ProductSpecsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("description");

  return (
    <div dir="rtl">
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
              activeTab === tab.key ? "text-primary" : "text-muted hover:text-text"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.span
                layoutId="active-tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="py-4 text-sm leading-7 text-text-secondary"
        >
          {activeTab === "description" && (
            <p>{product.description ?? "توضیحاتی برای این محصول ثبت نشده است."}</p>
          )}

          {activeTab === "specs" && (
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <SpecRow label="دسته‌بندی" value={product.category.name} />
              <SpecRow label="کد محصول (SKU)" value={product.sku} />
              {product.weight_grams != null && <SpecRow label="وزن" value={`${product.weight_grams} گرم`} />}
              <SpecRow
                label="وضعیت موجودی"
                value={
                  product.stock_status === "in_stock"
                    ? "موجود در انبار"
                    : product.stock_status === "preorder"
                      ? "پیش‌فروش"
                      : "ناموجود"
                }
              />
            </dl>
          )}

          {activeTab === "reviews" && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
              بخش نظرات کاربران هنوز به بک‌اند وصل نشده — این placeholder است تا API نظرات آماده شود.
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between rounded-lg border border-border bg-surface px-3 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-text">{value}</dd>
    </div>
  );
}