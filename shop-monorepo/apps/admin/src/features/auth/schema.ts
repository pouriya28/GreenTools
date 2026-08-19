import { z } from "zod"

export const loginSchema = z.object({
  login: z.string().min(1, "ایمیل یا نام کاربری الزامی است"),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const totpSchema = z.object({
  totp_code: z.string().length(6, "کد باید ۶ رقم باشد"),
})

export type TotpFormValues = z.infer<typeof totpSchema>