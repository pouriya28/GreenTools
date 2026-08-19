interface ProductCarouselDotsProps {
  scrollSnaps: number[];
  selectedIndex: number;
  onDotClick: (index: number) => void;
}

export function ProductCarouselDots({ scrollSnaps, selectedIndex, onDotClick }: ProductCarouselDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {scrollSnaps.map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          aria-label={`صفحه ${index + 1}`}
          className={`
            rounded-full transition-all duration-300 ease-out
            ${index === selectedIndex 
              ? "w-6 h-2.5 bg-primary" 
              : "w-2.5 h-2.5 bg-muted hover:bg-text-secondary"
            }
          `}
        />
      ))}
    </div>
  );
}