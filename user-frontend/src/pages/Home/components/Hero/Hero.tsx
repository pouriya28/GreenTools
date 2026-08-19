// src/pages/Home/components/Hero/Hero.tsx
import { forwardRef } from "react";
// وارد کردن کامپوننت‌های جدید (فایل HeroText.tsx قبلی دیگه اینجا لازم نیست)
import { HeroTopText } from "./HeroTopText";
import { HeroFeatures } from "./HeroFeatures";
import { HeroBottomText } from "./HeroBottomText";

import { HeroShapes } from "./HeroShapes";
import { homeContent } from "../../data/homeContent";

interface HeroProps {
  shapesRef: React.RefObject<HTMLDivElement>;
  activeSectionIndex: number;
}

export const Hero = forwardRef<HTMLElement, HeroProps>(
  ({ shapesRef, activeSectionIndex }, ref) => {
    return (
      <section
        ref={ref}
        className="
          relative w-full min-h-[50vh] md:min-h-screen
          flex flex-col-reverse md:flex-row-reverse
          items-center justify-between
          gap-8 md:gap-10 px-6 sm:px-10 md:px-14 py-16 md:py-12
          pt-28 md:pt-32 pb-16 md:py-12
          bg-background overflow-hidden
        "
      >
        {/* === سمت راست: ساختار جدید متنی و دایره‌ها === */}
        <div className="w-full md:w-[35%] lg:w-[32%] shrink-0 z-10 flex flex-col justify-center">
          <HeroTopText />
          <HeroFeatures />
          <HeroBottomText />
        </div>

        {/* === سمت چپ: شکل‌های انیمیشنی (بدون هیچ تغییری) === */}
        <div className="hidden md:flex w-full md:w-[65%] lg:w-[68%] justify-center md:justify-start">
          <HeroShapes
            ref={shapesRef}
            sections={homeContent.sections}
            activeIndex={activeSectionIndex}
          />
        </div>
      </section>
    );
  }
);

Hero.displayName = "Hero";