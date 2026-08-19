// src/pages/Home/components/Hero/HeroText.tsx
interface HeroTextProps {
  title: string;
  description: string;
  // ctaText حذف شد
}

export function HeroText({ title, description }: HeroTextProps) {
  return (
    <div className="flex flex-col gap-5 max-w-lg text-right shrink-0">
      <h1 className="text-text text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
        {title}
      </h1>
      <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
        {description}
      </p>
    </div>
  );
}