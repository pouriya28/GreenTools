import { z } from "zod"
import type { Address } from "../../types/Address"

// همانند قاعده‌ی بک‌اند: با 09 شروع شود و دقیقاً 11 رقم باشد.
const PHONE_PATTERN = /^09\d{9}$/
const POSTAL_CODE_PATTERN = /^\d{10}$/

/**
 * منبع واحد حقیقت برای قواعد والیدیشن فرم آدرس در کلاینت.
 * قواعد اینجا عیناً با قواعد FormRequest بک‌اند هم‌راستا نگه داشته شوند؛ این کار فقط UX را بهتر می‌کند و هرگز جایگزین منبع نهایی امنیت (بک‌اند) نیست.
 */
export const addressFormSchema = z.object({
	recipient_name: z
		.string()
		.trim()
		.min(1, "نام تحویل گیرنده الزامی است.")
		.max(100, "نام تحویل گیرنده نمی‌تواند بیشتر از 100 کاراکتر باشد."),
	recipient_phone: z
		.string()
		.trim()
		.regex(PHONE_PATTERN, "شماره تماس باید معتبر باشد (مانند 09123456789)."),
	province_id: z.number({
		required_error: "انتخاب استان الزامی است.",
		invalid_type_error: "انتخاب استان الزامی است.",
	}),
	city_id: z.number({
		required_error: "انتخاب شهر الزامی است.",
		invalid_type_error: "انتخاب شهر الزامی است.",
	}),
	postal_code: z
		.union([
			z.literal(""),
			z.string().trim().regex(POSTAL_CODE_PATTERN, "کد پستی باید دقیقاً 10 رقم باشد."),
		])
		.optional(),
	address_line: z
		.string()
		.trim()
		.min(1, "آدرس کامل الزامی است.")
		.max(1000, "آدرس کامل نمی‌تواند بیشتر از 1000 کاراکتر باشد."),
	district: z.string().trim().optional(),
	latitude: z.number().nullable(),
	longitude: z.number().nullable(),
	map_provider: z.union([z.literal("neshan"), z.null()]),
	map_place_id: z.string().nullable(),
})

export type AddressFormValues = z.infer<typeof addressFormSchema>

export function toDefaultValues(address?: Address): AddressFormValues {
	return {
		recipient_name: address?.recipient_name ?? "",
		recipient_phone: address?.recipient_phone ?? "",
		// مقدار اولیه عمداً undefined است تا zod خطای "الزامی" بدهد، نه خطای نوعی.
		province_id: (address?.province.id ?? undefined) as unknown as number,
		city_id: (address?.city.id ?? undefined) as unknown as number,
		postal_code: address?.postal_code ?? "",
		address_line: address?.address_line ?? "",
		district: address?.district ?? "",
		latitude: address?.latitude ?? null,
		longitude: address?.longitude ?? null,
		map_provider: address?.map_provider === "neshan" ? "neshan" : null,
		map_place_id: address?.map_place_id ?? null,
	}
}
