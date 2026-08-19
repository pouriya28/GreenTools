import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";

import { ProductCard } from "../ProductCard";
import { ProductCarouselHeader } from "./ProductCarouselHeader";
import { ProductCarouselArrows } from "./ProductCarouselArrows";
import { ProductCarouselDots } from "./ProductCarouselDots";
import type { ProductCarouselProps } from "./ProductCarouselTypes";

export function ProductCarousel({ title, url, products }: ProductCarouselProps) {
  // direction: 'rtl' برای راست‌چین بودن حرکت کاروسل تنظیم شده است
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    direction: "rtl", 
    loop: false, 
    align: "start", 
    containScroll: "trimSnaps" 
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  // ثبت تعداد صفحات (حباب‌ها) برای صفحه‌بندی
  const onSelect = useCallback((api: EmblaCarouselType) => {
    setScrollSnaps(api.scrollSnapList());
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on("select", () => onSelect(emblaApi));
    emblaApi.on("reInit", () => onSelect(emblaApi));
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  return (
    <section className="w-full max-w-7xl mx-auto py-8">
      <ProductCarouselHeader title={title} url={url} />

      <div className="relative">
        {/* viewport کاروسل */}
        <div ref={emblaRef} className="overflow-hidden px-2 md:px-0">
          <div className="flex">
            {products.map((product) => (
              <div
                key={product.id}
                className="
                  flex-[0_0_100%]       /* موبایل: 1 کارت */
                  sm:flex-[0_0_50%]     /* تبلت: 2 کارت */
                  lg:flex-[0_0_33.333%] /* دسکتاپ: 3 کارت */
                  xl:flex-[0_0_25%]     /* دسکتاپ بزرگ: 4 کارت */
                  min-w-0 pl-4 md:pl-6
                "
              >
                {/* 
                  استفاده از flex و h-full باعث می‌شود اگر ارتفاع کارت‌ها فرق داشت، 
                  همه یک دست و مرتب به نظر برسند 
                */}
                <div className="flex h-full">
                  <ProductCard product={product} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* دکمه‌های ناوبری (فقط دسکتاپ) */}
        <ProductCarouselArrows onPrev={scrollPrev} onNext={scrollNext} />
      </div>

      {/* حباب‌های صفحه‌بندی */}
      <ProductCarouselDots 
        scrollSnaps={scrollSnaps} 
        selectedIndex={selectedIndex} 
        onDotClick={scrollTo} 
      />
    </section>
  );
}