// src/pages/Home/components/Hero/HeroBottomText.tsx
export function HeroBottomText() {
  return (
    <div className="bg-surface/40 border border-primary/20 p-5 lg:p-6 rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(34,197,94,0.05)] text-right relative overflow-hidden">
      {/* یک افکت نوری محو در پس‌زمینه باکس */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10" />
      
      <h2 className="text-xl lg:text-2xl font-bold text-white mb-3">
        باکس متنی پایین
      </h2>
      <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
        این بخش پایینی است که در طرح کشیده بودید. در اینجا هم می‌توانید لینک‌های مهم، دعوت به اقدام (CTA) یا اطلاعات تکمیلی اضافه کنید تا ساختار صفحه‌تان کامل شود.
      </p>
    </div>
  );
}