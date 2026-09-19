import { z } from "zod"

export const purchaseRequirementEnum = z.enum([
  "standard",
  "technical_consultation",
  "professional_installation",
  "restricted",
])

export const productSchema = z
  .object({
    category_id: z.string({ required_error: "دسته‌بندی را انتخاب کنید" }),
    name: z.string().min(2, "نام باید داقل ۲ کاراکتر باشد").max(200),
    sku: z
      .string()
      .max(64)
      .regex(/^[a-zA-Z0-9_-]*$/, "SKU فقط می‌تواند شامل حروف انگلیسی، عدد، خط‌تیره و آندرلاین باشد"),
    short_description: z.string().max(500).nullable().optional(),
    description: z.string().max(20000).nullable().optional(),

    price_usd: z.number().min(0.01, "قیمت باید حداقل ۰.۰۱ دلار باشد").max(999999.99),
    discount_type: z.enum(["percent", "fixed"]).nullable().optional(),
    discount_value: z.number().min(0).nullable().optional(),
    discount_starts_at: z.string().nullable().optional(),
    discount_ends_at: z.string().nullable().optional(),

    stock_quantity: z.number().int().min(0).max(1000000),
    stock_status: z.enum(["in_stock", "out_of_stock", "preorder"]),
    weight_grams: z.number().int().min(0).max(1000000).nullable().optional(),
    attributes: z
      .array(
        z.object({
          attribute_id: z.string().optional(),
          name: z.string().optional(),
          unit: z.string().nullable().optional(),
          value: z.string().min(1, "مقدار را وارد کنید"),
        }),
      )
      .optional()
      .default([]),
    is_active: z.boolean(),
    meta_title: z.string().max(180).nullable().optional(),
    meta_description: z.string().max(300).nullable().optional(),

    // فیلد مرکزی شرایط خرید + اطلاعات تکمیلی مرتبط
    purchase_requirement: purchaseRequirementEnum,
    technical_notice: z.string().max(500).nullable().optional(),
    installation_notice: z.string().max(500).nullable().optional(),
    compatibility_notice: z.string().max(500).nullable().optional(),
    support_contact_enabled: z.boolean(),
    purchase_confirmation_required: z.boolean(),
  })
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