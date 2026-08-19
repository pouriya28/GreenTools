import { FaChevronRight, FaChevronLeft } from "react-icons/fa";

interface ProductCarouselArrowsProps {
  onPrev: () => void;
  onNext: () => void;
}

// در راست‌چین (RTL): دکمه بعدی سمت چپ، و دکمه قبلی سمت راست قرار می‌گیرد
export function ProductCarouselArrows({ onPrev, onNext }: ProductCarouselArrowsProps) {
  return (
    <>
      {/* دکمه قبلی (راست) */}
      <button
        onClick={onPrev}
        aria-label="قبلی"
        className="
          absolute z-20 top-1/2 right-2 -translate-y-1/2
          w-10 h-10 md:w-12 md:h-12 rounded-full
          bg-surface/80 backdrop-blur-md border border-border
          flex items-center justify-center
          text-text-secondary hover:text-primary hover:border-primary
          shadow-lg transition-all duration-300
          hover:scale-110
          hidden md:flex /* فقط در دسکتاپ نمایش داده شود */
        "
      >
        <FaChevronRight size={16} />
      </button>

      {/* دکمه بعدی (چپ) */}
      <button
        onClick={onNext}
        aria-label="بعدی"
        className="
          absolute z-20 top-1/2 left-2 -translate-y-1/2
          w-10 h-10 md:w-12 md:h-12 rounded-full
          bg-surface/80 backdrop-blur-md border border-border
          flex items-center justify-center
          text-text-secondary hover:text-primary hover:border-primary
          shadow-lg transition-all duration-300
          hover:scale-110
          hidden md:flex /* فقط در دسکتاپ نمایش داده شود */
        "
      >
        <FaChevronLeft size={16} />
      </button>
    </>
  );
}