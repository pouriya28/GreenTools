// src/pages/Home/components/Hero/HeroTopText.tsx
export function HeroTopText() {
  return (
    <div className="bg-surface/40 border border-primary/20 p-6 lg:p-8 rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(34,197,94,0.05)] text-right">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
        تیتر اصلی تستی شما در اینجا
      </h1>
      <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
        این یک متن تستی برای باکس بالایی است. شما می‌توانید توضیحات کلی سایت، شعار تبلیغاتی یا هر متن دیگری را اینجا قرار دهید تا با ظاهری مدرن نمایش داده شود.
      </p>
    </div>
  );
}