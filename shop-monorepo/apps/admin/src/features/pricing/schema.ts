import { z } from "zod"

// همون قوانین ManualExchangeRateOverrideRequest بک‌اند (rate: عدد الزامی در
// بازه‌ی min/max sane rate که سمت سرور از config می‌خونه؛ reason: الزامی،
// ۱۰ تا ۵۰۰ کاراکتر). چون بازه‌ی دقیق sane rate سمت سرور از config میاد و به
// فرانت اکسپوز نشده، این‌جا فقط عدد مثبت رو چک می‌کنیم؛ پیام دقیق خطای
// خارج-از-بازه از پاسخ ۴۲۲ سرور نشون داده می‌شه.
export const manualOverrideSchema = z.object({
  rate: z
    .number({ required_error: "نرخ ارز را وارد کنید", invalid_type_error: "نرخ ارز باید عدد باشد" })
    .positive("نرخ ارز باید عددی مثبت باشد"),
  reason: z
    .string({ required_error: "دلیل ثبت نرخ الزامی است" })
    .min(10, "دلیل باید حداقل ۱۰ کاراکتر باشد تا برای audit قابل استفاده باشد")
    .max(500, "دلیل نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد"),
})

export type ManualOverrideFormValues = z.infer<typeof manualOverrideSchema>

// همون قوانین UpdatePriceProposalRequest بک‌اند
export const editProposalPriceSchema = z.object({
  edited_price_toman: z
    .number({ required_error: "قیمت جدید را وارد کنید", invalid_type_error: "قیمت باید عدد باشد" })
    .int("قیمت باید عدد صحیح (تومان) باشد")
    .min(1, "قیمت باید حداقل ۱ تومان باشد")
    .max(99999999999, "قیمت وارد شده خارج از بازه‌ی مجاز است"),
})

export type EditProposalPriceFormValues = z.infer<typeof editProposalPriceSchema>
