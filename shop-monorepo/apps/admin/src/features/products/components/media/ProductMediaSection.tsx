import { ProductImageGrid } from "./ProductImageGrid"
import { ProductVideoList } from "./ProductVideoList"
import type { ProductImage, ProductVideo } from "../../types"

interface ProductMediaSectionProps {
  productId: number
  images: ProductImage[]
  videos: ProductVideo[]
}

// بخش مدیریت عکس/ویدیو. فقط وقتی رندر می‌شه که محصول واقعاً در دیتابیس وتایید شده
// باشه (productId موجود باشه)؛ یعنی اول فرم اصلی محصول با ولدیشن‌هاش باید با
// موفقیت ذخیره شده باشه، بعد عکس/ویدیو اضافه می‌شه — دقیقاً مطابق خواست کاربر.
export function ProductMediaSection({ productId, images, videos }: ProductMediaSectionProps) {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-bg-2/40 p-3">
      <p className="text-sm font-semibold text-text-1">مدیریت عکس و ویدیو</p>
      <ProductImageGrid productId={productId} images={images} />
      <div className="h-px bg-border" />
      <ProductVideoList productId={productId} videos={videos} />
    </div>
  )
}
