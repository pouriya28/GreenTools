// src/pages/Home/data/homeContent.ts

export interface HomeSection {
  id: string;
  title: string;
  summary: string; // متن خلاصه‌ای که داخل ذوزنقه‌ها هم نشون داده میشه
}

export const homeContent = {
  hero: {
    title: "فروشگاهی نو، تجربه‌ای نو",
    description:
      "جدیدترین محصولات با بهترین کیفیت و ارسال سریع، همین حالا کشفشون کن.",
    ctaText: "مشاهده محصولات",
  },

  // هر آیتم اینجا هم یک سکشن مستقل توی صفحه‌ست و هم محتوای یکی از ذوزنقه‌های هیرو
  sections: [
    {
      id: "features",
      title: "چرا فروشگاه ما؟",
      summary:
        "ارسال سریع، ضمانت اصالت کالا و پشتیبانی ۲۴ ساعته در کنار شما هستیم.",
    },
    {
      id: "categories",
      title: "دسته‌بندی‌های پرطرفدار",
      summary: "از پوشاک و کفش تا لوازم دیجیتال، همه‌چیز رو یک‌جا پیدا کن.",
    },
    {
      id: "featured",
      title: "محصولات ویژه",
      summary: "جدیدترین و پرفروش‌ترین محصولات فروشگاه رو از دست نده.",
    },
    {
      id: "testimonials",
      title: "نظر مشتریان",
      summary: "هزاران خریدار راضی، تجربه خرید امن و مطمئن رو با ما داشتن.",
    },
  ] as HomeSection[],
};
