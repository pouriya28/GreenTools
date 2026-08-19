import { z } from "zod"

export const productSchema = z
  .object({
    category_id: z.number({ required_error: "دسته‌بندی را انتخاب کنید" }),
    name: z.string().min(2, "نام باید داقل ۲ کاراکتر باشد").max(200),
    sku: z
      .string()
      .min(1, "SKU الزامی است")
      .max(64)
      .regex(/^[a-zA-Z0-9_-]+$/, "SKU فقط می‌تواند شامل حروف انگلیسی، عدد، خط‌تیره و آندرلاین باشد"),
    short_description: z.string().max(500).nullable().optional(),
    description: z.string().max(20000).nullable().optional(),

    // قیمت حالا به دلار وارد می‌شه (نه تومان)؛ محدوده بر اساس رنج معقول
    // قیمت دلاری محصولات تنظیم شده، نه رنج قبلی ریالی.
    price_usd: z.number().min(0.01, "قیمت باید حداقل ۰.۰۱ دلار باشد").max(999999.99),
    discount_type: z.enum(["percent", "fixed"]).nullable().optional(),
    discount_value: z.number().min(0).nullable().optional(),
    discount_starts_at: z.string().nullable().optional(),
    discount_ends_at: z.string().nullable().optional(),

    stock_quantity: z.number().int().min(0).max(1000000),
    stock_status: z.enum(["in_stock", "out_of_stock", "preorder"]),
    weight_grams: z.number().int().min(0).max(1000000).nullable().optional(),

    is_active: z.boolean(),
    meta_title: z.string().max(180).nullable().optional(),
    meta_description: z.string().max(300).nullable().optional(),
  })
  // نکته‌ی مهم: قانون قبلی «تخفیف ثابت ≤ قیمت» حذف شد، چون price_usd الان
  // دلاریه ولی discount_type=fixed طبق منطق فعلی بک‌اند به تومان حساب می‌شه
  // و مقایسه‌ی مستقیم این دو عدد دیگه معنی نداره و فرم رو اشتباه رد می‌کرد. فقط
  // قانون درصد ≤۱۰۰ و ترتیب تاریخ‌ها باقی مونده. اگر بک‌اند برای تخفیف ثابت
  // واحد دلار رو هم قبول می‌کنه، بگو تا این قانون رو با واحد درست برگردونم.
  .superRefine((data, ctx) => {
    if (!data.discount_type) return

    if (data.discount_value === null || data.discount_value === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount_value"],
        message: "مقدار تخفیف را وارد کنید",
      })
      return
    }
    if (data.discount_type === "percent" && data.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount_value"],
        message: "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد",
      })
    }
    if (data.discount_starts_at && data.discount_ends_at) {
      if (new Date(data.discount_ends_at) <= new Date(data.discount_starts_at)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discount_ends_at"],
          message: "تاریخ پایان تخفیف باید بعد از تاریخ شروع باشد",
        })
      }
    }
  })

export type ProductFormValues = z.infer<typeof productSchema>
