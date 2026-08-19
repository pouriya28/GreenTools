import { Link } from "react-router-dom";

import type { ProductCardProps } from "./ProductTypes";
import { computeBadges } from "./productBadges";

import { ProductImage } from "./ProductImage";
import { ProductBadge } from "./ProductBadge";
import { ProductPrice } from "./ProductPrice";
import { ProductTitle } from "./ProductTitle";
import { ProductStock } from "./ProductStock";
import { ProductActions } from "./ProductActions";
import { ProductPreview } from "./ProductPreview";

import { useProductCardInteraction } from "../../hooks/useProductCardInteraction";

export function ProductCard({ product }: ProductCardProps) {
  const { isMobile, open, openWithDelay, close, longPress } = useProductCardInteraction();
  const badges = computeBadges(product);

  return (
    <article
      className="
        group relative w-[320px] min-h-[460px] rounded-3xl
        bg-surface border border-border overflow-hidden
        transition-all duration-300 hover:-translate-y-2 hover:shadow-xl
      "
      onMouseEnter={() => !isMobile && openWithDelay(200)}
      onMouseLeave={() => !isMobile && close()}
      {...(isMobile ? longPress : {})}
    >
      <Link to={`/products/${product.slug}`} className="block h-full">
        <div className="relative">
          <ProductImage image={product.primary_image} name={product.name} />
          <ProductBadge badges={badges} />
        </div>

        <div className="flex flex-col gap-3 p-5">
          <ProductTitle name={product.name} />
          <ProductPrice
            price={product.price}
            finalPrice={product.final_price}
            hasActiveDiscount={product.has_active_discount}
          />
          <ProductStock status={product.stock_status} />
        </div>
      </Link>

      <ProductActions productId={product.id} disabled={product.stock_status === "out_of_stock"} />

      {open && <ProductPreview product={product} />}
    </article>
  );
}