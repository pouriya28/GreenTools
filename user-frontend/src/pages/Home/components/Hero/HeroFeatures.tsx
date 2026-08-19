// src/pages/Home/components/Hero/HeroFeatures.tsx
export function HeroFeatures() {
  const features = [
    {
      id: 1,
      title: "ارسال سریع",
      // آیکون موشک/ارسال
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 2,
      title: "پرداخت امن",
      // آیکون سپر
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: 3,
      title: "پشتیبانی قوی",
      // آیکون هدفون/پشتیبانی
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex justify-between items-center gap-4 my-8 px-2">
      {features.map((item) => (
        <div key={item.id} className="flex flex-col items-center gap-3">
          {/* دایره نئونی */}
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full border-2 border-primary flex items-center justify-center text-primary bg-primary/10 shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all hover:scale-110 hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] cursor-default">
            {item.icon}
          </div>
          {/* متن زیر دایره */}
          <span className="text-text text-xs lg:text-sm font-bold whitespace-nowrap">
            {item.title}
          </span>
        </div>
      ))}
    </div>
  );
}