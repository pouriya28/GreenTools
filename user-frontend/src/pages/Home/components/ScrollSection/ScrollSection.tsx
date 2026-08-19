// src/pages/Home/components/ScrollSection/ScrollSection.tsx
import { forwardRef } from "react";
import type { HomeSection } from "../../data/homeContent";

interface ScrollSectionProps {
  section: HomeSection;
  index: number;
  children?: React.ReactNode; // ۱. اضافه کردن children به تایپ
}

export const ScrollSection = forwardRef<HTMLElement, ScrollSectionProps>(
  ({ section, index, children }, ref) => { // ۲. دریافت children
    const isEven = index % 2 === 0;

    return (
      <section
        ref={ref}
        data-section-id={section.id}
        className={`
          w-full min-h-[70vh] flex items-center justify-center
          px-5 sm:px-10 md:px-16 py-16
          ${isEven ? "bg-background" : "bg-surface"}
        `}
      >
        {/* ۳. تغییر کانتینر به max-w-7xl برای جای دادن کاروسل */}
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-12">
          
          {/* بخش تایتل و توضیحات */}
          <div className="max-w-2xl text-center flex flex-col gap-4">
            <h2 className="text-text text-2xl sm:text-3xl font-bold">
              {section.title}
            </h2>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
              {section.summary}
            </p>
          </div>

          {/* ۴. رندر کردن فرزندان (کاروسل) در اینجا */}
          {children}
          
        </div>
      </section>
    );
  }
);

ScrollSection.displayName = "ScrollSection";