import { z } from "zod"

// Mirrors the backend's ManualExchangeRateOverrideRequest rules (rate: required
// number within the min/max sane-rate range read from server config; reason:
// required, 10-500 chars). Since the exact sane-rate range lives in server
// config and isn't exposed to the frontend, we only validate a positive number
// here; the precise out-of-range message is shown from the server's 422 response.
export const manualOverrideSchema = z.object({
  // Bug fix: this field is coerced from the <Input type="number"> element's
  // raw string value (register() no longer uses valueAsNumber - see
  // ManualOverrideDialog.tsx for why). z.coerce.number() turns an empty
  // string into Number.NaN, which zod already reports via invalid_type_error
  // below, so an empty field still shows a clear Persian message.
  rate: z.coerce
    .number({ invalid_type_error: "نرخ ارز را به‌صورت یک عدد معتبر وارد کنید" })
    .positive("نرخ ارز باید عددی مثبت باشد"),
  reason: z
    .string({ required_error: "دلیل ثبت نرخ الزامی است" })
    .min(10, "دلیل باید حداقل ۱۰ کاراکتر باشد تا برای audit قابل استفاده باشد")
    .max(500, "دلیل نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد"),
})

export type ManualOverrideFormValues = z.infer<typeof manualOverrideSchema>

// Mirrors the backend's UpdatePriceProposalRequest rules
export const editProposalPriceSchema = z.object({
  edited_price_toman: z
    .number({ required_error: "قیمت جدید را وارد کنید", invalid_type_error: "قیمت باید عدد باشد" })
    .int("قیمت باید عدد صحیح (تومان) باشد")
    .min(1, "قیمت باید حداقل ۱ تومان باشد")
    .max(99999999999, "قیمت وارد شده خارج از بازه‌ی مجاز است"),
})

export type EditProposalPriceFormValues = z.infer<typeof editProposalPriceSchema>

// Mirrors Store/UpdateExchangeRateScheduleRequest's conditional rules exactly:
// days_of_week is required only for "weekly", days_of_month only for "monthly".
export const exchangeRateScheduleSchema = z
  .object({
    frequency: z.enum(["daily", "weekly", "monthly"], {
      required_error: "نوع زمان‌بندی را انتخاب کن",
    }),
    run_time: z
      .string({ required_error: "ساعت اجرا را وارد کن" })
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "ساعت باید به‌صورت HH:mm باشد"),
    days_of_week: z.array(z.number().int().min(0).max(6)).optional(),
    days_of_month: z.array(z.number().int().min(1).max(31)).optional(),
    is_active: z.boolean().default(true),
  })
  .superRefine((values, ctx) => {
    if (values.frequency === "weekly" && (!values.days_of_week || values.days_of_week.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["days_of_week"],
        message: "برای زمان‌بندی هفتگی، حداقل یک روز هفته را انتخاب کن",
      })
    }
    if (values.frequency === "monthly" && (!values.days_of_month || values.days_of_month.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["days_of_month"],
        message: "برای زمان‌بندی ماهانه، حداقل یک روز از ماه را انتخاب کن",
      })
    }
  })

export type ExchangeRateScheduleFormValues = z.infer<typeof exchangeRateScheduleSchema>
