// src/features/products/components/ProductPage/ProductPage.tsx (به‌روزرسانی)
import { useState } from "react";
import { useParams } from "react-router-dom";
import { ProductGallery } from "./ProductGallery";
import { ProductPriceBox } from "./ProductPriceBox";
import { ProductPurchaseRequirementNotice } from "./ProductPurchaseRequirementNotice";
import { ProductQuantityAndCart } from "./ProductQuantityAndCart";
import { ProductSpecsTabs } from "./ProductSpecsTabs";
import { useProductDetail } from "../../hooks/useProductDetail";


export function ProductPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError } = useProductDetail(slug);
  const [purchaseConfirmed, setPurchaseConfirmed] = useState(false);

  if (isLoading) return <ProductPageSkeleton />;

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted" dir="rtl">
        محصول مورد نظر پیدا نشد.
      </div>
    );
  }

  const canAddToCart = !product.purchase_confirmation_required || purchaseConfirmed;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs text-muted">{product.category.name}</span>
            <h1 className="mt-1 text-xl font-bold text-text sm:text-2xl">{product.name}</h1>
            {product.short_description && (
              <p className="mt-2 text-sm text-text-secondary">{product.short_description}</p>
            )}
          </div>

          <ProductPriceBox
            price={product.price}
            finalPrice={product.final_price}
            discountPercentage={product.discount_percentage}
            hasActiveDiscount={product.has_active_discount}
          />

          <ProductPurchaseRequirementNotice
            product={product}
            confirmed={purchaseConfirmed}
            onConfirmedChange={setPurchaseConfirmed}
          />

          <ProductQuantityAndCart product={product} canAddToCart={canAddToCart} purchaseConfirmed={purchaseConfirmed}/>
        </div>
      </div>

      <div className="mt-10">
        <ProductSpecsTabs product={product} />
      </div>
      
    </div>
  );
}

function ProductPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8" dir="rtl">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="aspect-square rounded-2xl bg-surface" />
        <div className="flex flex-col gap-4">
          <div className="h-6 w-2/3 rounded bg-surface" />
          <div className="h-24 rounded bg-surface" />
          <div className="h-12 rounded bg-surface" />
        </div>
      </div>
    </div>
  );
}