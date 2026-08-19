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