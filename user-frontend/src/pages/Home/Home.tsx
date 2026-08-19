import { createRef, useRef, useState } from "react";
import { Hero } from "./components/Hero";
import { ScrollSection } from "./components/ScrollSection";
import { useHomeScrollAnimation } from "./hooks/useHomeScrollAnimation";
import { homeContent } from "./data/homeContent";
import { Header } from "@/components/layout/Header";

// ایمپورت کاروسل و هوک محصولات ویژه
import { ProductCarousel } from "@/features/products/components/ProductCarousel";
import { useFeaturedProducts } from "@/features/products/hooks/useFeaturedProducts";

export function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const shapesRef = useRef<HTMLDivElement>(null);

  const sectionRefs = useRef(
    homeContent.sections.map(() => createRef<HTMLElement>())
  ).current;

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  useHomeScrollAnimation({
    heroRef,
    shapesRef,
    sectionRefs,
    onSectionChange: setActiveSectionIndex,
  });

  // دریافت داده‌های محصولات ویژه از بک‌اند
  const { data: featuredProducts, isLoading } = useFeaturedProducts();

  return (
    <main className="w-full overflow-x-hidden bg-background">
      <Header />
      <Hero
        ref={heroRef}
        shapesRef={shapesRef}
        activeSectionIndex={activeSectionIndex}
      />

      {homeContent.sections.map((section, index) => (
        <ScrollSection
          key={section.id}
          ref={sectionRefs[index]}
          section={section}
          index={index}
        >
          {/* ======== شرایط نمایش کاروسل در سکشن featured ======== */}
          {section.id === "featured" && (
            <div className="w-full mt-8">
              {isLoading ? (
                // اسکلتون لودینگ ساده هنگام دریافت داده
                <div className="text-center text-muted py-20 animate-pulse">
                  در حال بارگذاری محصولات ویژه...
                </div>
              ) : featuredProducts && featuredProducts.length > 0 ? (
                // نمایش کاروسل در صورت وجود محصول
                <ProductCarousel 
                  title="محصولات ویژه" 
                  url="/products" // لینک صفحه آرشیو محصولات در فرانت‌اند
                  products={featuredProducts} 
                />
              ) : (
                // نمایش پیام در صورت خالی بودن
                <div className="text-center text-muted py-20">
                  محصولاتی برای نمایش وجود ندارد.
                </div>
              )}
            </div>
          )}
        </ScrollSection>
      ))}
    </main>
  );
}