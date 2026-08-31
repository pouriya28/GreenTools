# ProductCard Source


## features\products\components\ProductCard\index.ts

``ts
export { ProductCard } from "./ProductCard";

export type {
  Product,
  ProductCardProps,
} from "./ProductTypes";
``

## features\products\components\ProductCard\ProductActions.tsx

``tsx
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
        opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0
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
``

## features\products\components\ProductCard\ProductBadge.tsx

``tsx
import type { ComputedBadge } from "./productBadges";

interface ProductBadgeProps {
  badges: ComputedBadge[];
}

const BADGE_STYLES: Record<ComputedBadge["type"], string> = {
  discount: "bg-error",
  featured: "bg-primary",
  outOfStock: "bg-muted",
  preorder: "bg-info",
  new: "bg-success",
  bestSeller: "bg-warning",
};

export function ProductBadge({ badges }: ProductBadgeProps) {
  if (!badges.length) return null;

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      {badges.map((badge) => (
        <span
          key={badge.type}
          className={`
            px-3 h-8 rounded-full flex items-center justify-center
            text-xs font-bold shadow-lg text-white whitespace-nowrap
            ${BADGE_STYLES[badge.type]}
          `}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}
``

## features\products\components\ProductCard\productBadges.ts

``ts
// src/features/products/components/ProductCard/productBadges.ts
import type { Product } from "./ProductTypes";

export type BadgeType = "discount" | "featured" | "outOfStock" | "preorder" | "new" | "bestSeller";

export interface ComputedBadge {
  type: BadgeType;
  label: string;
}

const NEW_PRODUCT_DAYS = 14;        // محصول ایجادشده در ۱۴ روز اخیر = «جدید»
const BEST_SELLER_MIN_PURCHASES = 10; // آستانه‌ی «پرفروش» — بعداً می‌تونی بر اساس دیتای واقعی تنظیمش کنی

function isNewProduct(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false; // دفاعی: تاریخ نامعتبر رو کرش نده
  const diffDays = (Date.now() - created) / (1000 * 60 * 60 * 24);
  return diffDays <= NEW_PRODUCT_DAYS;
}

// امن: فقط عدد/enum/تاریخ استاندارد از بکند مصرف میشه، هیچ رشته‌ی خام رندر نمیشه
export function computeBadges(product: Product): ComputedBadge[] {
  const badges: ComputedBadge[] = [];

  if (product.has_active_discount && product.discount_percentage) {
    badges.push({ type: "discount", label: `${product.discount_percentage}%` });
  }

  if (product.stock_status === "out_of_stock") {
    badges.push({ type: "outOfStock", label: "ناموجود" });
  } else if (product.stock_status === "preorder") {
    badges.push({ type: "preorder", label: "پیش‌فروش" });
  }

  if (product.purchases_count >= BEST_SELLER_MIN_PURCHASES) {
    badges.push({ type: "bestSeller", label: "پرفروش" });
  } else if (isNewProduct(product.created_at)) {
    // "جدید" و "پرفروش" با هم نشون داده نمیشن تا کارت شلوغ نشه؛ پرفروش اولویت داره
    badges.push({ type: "new", label: "جدید" });
  }

  if (product.is_featured) {
    badges.push({ type: "featured", label: "ویژه" });
  }

  return badges.slice(0, 3); // سقف ۳ بج روی هر کارت — بیشتر از این شلوغ و زشت میشه
}
``

## features\products\components\ProductCard\ProductCard.tsx

``tsx
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
``

## features\products\components\ProductCard\ProductImage.tsx

``tsx
import type { ProductImage as ProductImageType } from "./ProductTypes";

interface ProductImageProps {
  image: ProductImageType | null;
  name: string;
}

export function ProductImage({ image, name }: ProductImageProps) {
  return (
    <div className="relative w-full h-[260px] overflow-hidden bg-background">
      {image ? (
        <img
          src={image.url}
          alt={image.alt_text || name}
          loading="lazy"
          className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted text-sm p-6 text-center">
          تصویری برای این محصول ثبت نشده است
        </div>
      )}
    </div>
  );
}
``

## features\products\components\ProductCard\ProductPreview.tsx

``tsx
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart, FaHeart, FaEye } from "react-icons/fa";

import type { Product } from "./ProductTypes";

interface ProductPreviewProps {
  product: Product;
}

export function ProductPreview({ product }: ProductPreviewProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.25 }}
        className="
          absolute inset-0 z-30 rounded-3xl
          bg-white/20 dark:bg-black/30 backdrop-blur-xl
          border border-white/20 shadow-2xl p-5
          flex flex-col gap-4
        "
      >
        <div className="w-full h-[180px] rounded-2xl overflow-hidden bg-background">
          {product.primary_image ? (
            <img
              src={product.primary_image.url}
              alt={product.primary_image.alt_text || product.name}
              className="w-full h-full object-contain p-4"
            />
          ) : null}
        </div>

        <h3 className="text-text font-black text-lg line-clamp-2">{product.name}</h3>

        <p className="text-text-secondary text-sm line-clamp-3">
          {product.short_description ?? "توضیحی برای این محصول ثبت نشده است."}
        </p>

        <div className="mt-auto flex justify-center gap-3">
          <button
            type="button"
            aria-label="افزودن به سبد خرید"
            className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center hover:scale-110 transition"
          >
            <FaShoppingCart />
          </button>
          <button
            type="button"
            aria-label="افزودن به علاقه‌مندی‌ها"
            className="w-11 h-11 rounded-full bg-surface text-error flex items-center justify-center hover:scale-110 transition"
          >
            <FaHeart />
          </button>
          <button
            type="button"
            aria-label="مشاهده سریع"
            className="w-11 h-11 rounded-full bg-surface text-info flex items-center justify-center hover:scale-110 transition"
          >
            <FaEye />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
``

## features\products\components\ProductCard\ProductPreviewCarousel.tsx

``tsx
import useEmblaCarousel from "embla-carousel-react";

import type { ProductImage } from "./ProductTypes";

import {
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import { useCallback } from "react";


interface ProductPreviewCarouselProps {

  images: ProductImage[];

}



export function ProductPreviewCarousel({

  images,

}: ProductPreviewCarouselProps) {


  const [
    emblaRef,
    emblaApi

  ] = useEmblaCarousel({

    loop:true,

  });



  const scrollPrev = useCallback(()=>{

    emblaApi?.scrollPrev();

  },[emblaApi]);



  const scrollNext = useCallback(()=>{

    emblaApi?.scrollNext();

  },[emblaApi]);



  return (

    <div
      className="
        relative
        w-full
        h-[180px]
        overflow-hidden
        rounded-2xl
      "
    >


      <div
        ref={emblaRef}
        className="
          overflow-hidden
          h-full
        "
      >

        <div
          className="
            flex
            h-full
          "
        >

          {
            images.map((image)=>(

              <div
                key={image.id}
                className="
                  flex-[0_0_100%]
                  min-w-0
                  h-full
                  flex
                  items-center
                  justify-center
                "
              >

                <img

                  src={image.url}

                  alt={image.alt}

                  className="
                    w-full
                    h-full
                    object-contain
                    p-4
                  "

                />

              </div>

            ))
          }


        </div>

      </div>



      {/* Previous */}

      <button

        type="button"

        onClick={scrollPrev}

        className="
          absolute
          left-3
          top-1/2
          -translate-y-1/2

          w-8
          h-8

          rounded-full

          bg-black/40
          backdrop-blur-md

          text-white

          flex
          items-center
          justify-center

          hover:bg-black/60

        "

      >

        <FaChevronLeft size={12}/>

      </button>




      {/* Next */}

      <button

        type="button"

        onClick={scrollNext}

        className="
          absolute
          right-3
          top-1/2
          -translate-y-1/2

          w-8
          h-8

          rounded-full

          bg-black/40
          backdrop-blur-md

          text-white

          flex
          items-center
          justify-center

          hover:bg-black/60

        "

      >

        <FaChevronRight size={12}/>

      </button>


    </div>

  );
}
``

## features\products\components\ProductCard\ProductPrice.tsx

``tsx
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
``

## features\products\components\ProductCard\ProductRating.tsx

``tsx
import { FaStar } from "react-icons/fa";


interface ProductRatingProps {

  rating:number;

  reviewsCount:number;

}



export function ProductRating({

rating,

reviewsCount,

}:ProductRatingProps){


return (

<div
className="
flex
items-center
gap-2
text-sm
"
>


<div
className="
flex
items-center
gap-1
text-warning
"
>

<FaStar />

<span>
{rating.toFixed(1)}
</span>


</div>



<span
className="
text-muted
"
>

({reviewsCount})

</span>



</div>

)

}
``

## features\products\components\ProductCard\ProductStock.tsx

``tsx
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
``

## features\products\components\ProductCard\ProductTitle.tsx

``tsx
interface ProductTitleProps {
  name: string;
}

export function ProductTitle({ name }: ProductTitleProps) {
  return (
    <h3 className="text-text font-bold text-base leading-relaxed line-clamp-2 min-h-[3rem]">
      {name}
    </h3>
  );
}
``

## features\products\components\ProductCard\ProductTypes.ts

``ts
// src/features/products/components/ProductCard/ProductTypes.ts

export type StockStatus = "in_stock" | "out_of_stock" | "preorder";

export interface ProductImage {
  id: number;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

// دقیقاً منطبق با app/Http/Resources/ProductListResource.php
export interface Product {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  price: number;
  final_price: number;
  discount_percentage: number | null;
  has_active_discount: boolean;
  stock_status: StockStatus;
  is_featured: boolean;
  purchases_count: number;
  created_at: string; // ISO 8601
  category: ProductCategory;
  primary_image: ProductImage | null;
}

export interface ProductCardProps {
  product: Product;
}
``
