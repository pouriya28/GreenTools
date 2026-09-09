import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useProvinces } from "../hooks/useProvinces"
import { useCreateAddress } from "../hooks/useCreateAddress"
import { useUpdateAddress } from "../hooks/useUpdateAddress"
import { MapPickerButton } from "./MapPickerButton"
import { MapPickerModal } from "./MapPickerModal"
import { Select } from "./Select"
import { Logo } from "./Logo"
import type { Address, AddressInput, ReverseGeocodeResult } from "../types/Address"
import { ApiError } from "@/shared/error/ApiError"
import { addressFormSchema, toDefaultValues, type AddressFormValues } from "./schemas/addressFormSchema"
import {
	IconUser,
	IconPhone,
	IconBank,
	IconMapPin,
	IconCard,
	IconHome,
	IconTruck,
	IconShield,
	IconArrowRight,
} from "./icons"

interface AddressFormProps {
	/** Pass an existing address to edit it in place; omit to create a new one. */
	address?: Address
	submitLabel?: string
	onSuccess?: (address: Address) => void
	onCancel?: () => void
}

/* ---------------------------------------------------------------------- */
/* کلاس‌های مشترک (فقط توکن‌های تم از themes.css — هیچ رنگ ثابتی)      */
/* ---------------------------------------------------------------------- */
const fieldWrapClass =
	"rounded-2xl bg-surface border border-border px-4 py-3.5 transition focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--primary-glow)]"
const inputBaseClass =
	"w-full bg-transparent text-text placeholder:text-muted outline-none text-sm sm:text-base"
const labelRowClass = "flex items-center gap-2 mb-2 text-text-secondary text-sm sm:text-[15px]"
const errorClass = "mt-1 block text-xs text-error"

/**
 * فرم ثبت/ویرایش آدرس — قابل‌استفاده هم در داشبورد کاربر (مدیریت آدرس‌ها) و
 * هم در ادامه‌ی فرایند سبد/چک‌اوت.
 *
 * والیدیشن: با react-hook-form + zod (اسکمای مشترک در schemas/addressFormSchema.ts) انجام می‌شود؛
 * قواعد عیناً با StoreAddressRequest/UpdateAddressRequest بک‌اند هم‌راستاست اما مرجع نهایی امنیت همیشه بک‌اند است؛
 * این والیدیشن فقط UX را بهتر می‌کند. خطاهای 422 بک‌اند با setError روی فیلد مربوطه نمایش داده می‌شوند.
 * همه‌ی مقادیر به‌صورت خام به API ارسال می‌شوند (بدون dangerouslySetInnerHTML در هیچ‌جا)، قتی رک XSS از این مسیر وجود ندارد.
 *
 * طراح/UI استان و شهر: دراپداون سفارشی در Select.tsx رندر می‌شود (جایگزین <select> خام مرورگری که قابل‌استایل‌دهی نبود).
 */
export function AddressForm({
	address,
	submitLabel = "ثبت آدرس و ادامهٔ خرید",
	onSuccess,
	onCancel,
}: AddressFormProps) {
	const [isMapOpen, setIsMapOpen] = useState(false)
	const [manualLocationNotice, setManualLocationNotice] = useState(false)
	const provincesQuery = useProvinces()
	const createAddress = useCreateAddress()
	const updateAddress = useUpdateAddress()
	const isEditing = Boolean(address)

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		trigger,
		setError,
		formState: { errors, isSubmitting: isFormSubmitting },
	} = useForm<AddressFormValues>({
		resolver: zodResolver(addressFormSchema),
		defaultValues: toDefaultValues(address),
		mode: "onBlur",
	})

	const isSubmitting = isFormSubmitting || createAddress.isPending || updateAddress.isPending
	const provinceId = watch("province_id")
	const cityId = watch("city_id")
	const addressLine = watch("address_line")
	const previousProvinceId = useRef(provinceId)

	useEffect(() => {
		if (previousProvinceId.current !== provinceId) {
			// تفاوت استان، شهر قبلی را بی‌اعتبار می‌کند — بک‌اند city_idی که متعلق به province_id نباشد را رد می‌کند.
			setValue("city_id", undefined as unknown as number, { shouldValidate: false })
			previousProvinceId.current = provinceId
		}
	}, [provinceId, setValue])

	const citiesForSelectedProvince = useMemo(() => {
		if (!provincesQuery.data || !provinceId) return []
		return provincesQuery.data.find((p) => p.id === provinceId)?.cities ?? []
	}, [provincesQuery.data, provinceId])

	function handleMapConfirm(result: ReverseGeocodeResult) {
		// فقط زمانی استان/شهر را بازنویسی می‌کنیم که تطبیق مطمئن داریم؛ هیچ‌وقت مقدار اشتباه را بی‌صدا قرار نمی‌دهیم.
		if (result.province?.id) setValue("province_id", result.province.id, { shouldValidate: true })
		if (result.city?.id) setValue("city_id", result.city.id, { shouldValidate: true })
		if (result.neighborhood) setValue("district", result.neighborhood)
		setValue("address_line", result.formatted_address ?? result.street ?? addressLine, { shouldValidate: true })
		setValue("latitude", result.latitude)
		setValue("longitude", result.longitude)
		setValue("map_provider", "neshan")
		setValue("map_place_id", null)
		// وقتی سرویس نقشه مطمئن نیست، به کاربر هشدار می‌دهیم که آدرس را دستی دقیق کند.
		setManualLocationNotice(result.requires_manual_location)
		setIsMapOpen(false)
	}

	async function onSubmit(values: AddressFormValues) {
		const payload: AddressInput = {
			title: values.title?.trim() || null,
			recipient_name: values.recipient_name.trim(),
			recipient_phone: values.recipient_phone.trim(),
			province_id: values.province_id,
			city_id: values.city_id,
			district: values.district?.trim() || null,
			postal_code: values.postal_code?.trim() || null,
			address_line: values.address_line.trim(),
			plaque: values.plaque?.trim() || null,
			unit: values.unit?.trim() || null,
			latitude: values.latitude,
			longitude: values.longitude,
			map_provider: values.map_provider,
			map_place_id: values.map_place_id,
			is_default: values.is_default,
		}
		try {
			const saved =
				isEditing && address
					? await updateAddress.mutateAsync({ id: address.id, input: payload })
					: await createAddress.mutateAsync(payload)
			onSuccess?.(saved)
		} catch (err) {
			if (err instanceof ApiError && err.errors) {
				// خطاهای سمت کاربر (422) را روی فیلد مربوطه در همان فرم react-hook-form می‌نشانیم.
				for (const [field, messages] of Object.entries(err.errors)) {
					if (messages?.[0] && field in values) {
						setError(field as keyof AddressFormValues, { type: "server", message: messages[0] })
					}
				}
			}
			// خطاهای فیر 422 قبلاً توسط اینترسپتور axios به‌صورت سراسری toast می‌شوند.
		}
	}

	return (
		<div dir="rtl" className="min-h-screen bg-background text-text">
			<div className="mx-auto w-full max-w-md sm:max-w-lg md:max-w-xl px-4 sm:px-6 pb-10">
				{/* هدر */}
				<div className="flex items-center justify-between py-5">
					<button
						type="button"
						onClick={onCancel}
						disabled={!onCancel}
						aria-label="بازگشت"
						className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
					>
						<IconArrowRight className="w-5 h-5" />
					</button>
					<h1 className="text-base sm:text-lg font-bold">آدرس تحویل کالا</h1>
					<MapPickerButton onClick={() => setIsMapOpen(true)} disabled={isSubmitting} />
				</div>

				<form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
					{/* بنر بالای فرم با لوگوی برند — لوگو عمداً سمت چپ (مطابق درخواست کاربر) قرار گرفته می‌شود: */}
					<div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 flex items-center gap-4">
						<div className="border-l border-border pl-4 flex-1">
							<p className="font-bold text-[15px] sm:text-base">آدرس خود را با دقت وارد کنید</p>
							<p className="text-xs sm:text-sm text-muted mt-1">کالای شما به آدرس ثبت شده ارسال خواهد شد</p>
						</div>
						<Logo />
					</div>

					{/* CTA بزرگ و کاملاً قابل‌رویت برای انتخاب از روی نقشه — علاوه بر دکمهٔ کوچک کنار عنوان بالا */}
					<button
						type="button"
						onClick={() => setIsMapOpen(true)}
						disabled={isSubmitting}
						className="flex items-center gap-3 rounded-2xl border border-dashed border-primary/50 bg-primary/5 px-4 py-3.5 text-right transition hover:bg-primary/10 disabled:opacity-50"
					>
						<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
							<IconMapPin className="h-5 w-5" />
						</span>
						<span className="flex-1">
							<span className="block text-sm font-bold text-text">انتخاب آدرس از نقشه</span>
							<span className="block text-xs text-muted mt-0.5">موقعیت را روی نقشه مشخص کن تا استان/شهر/آدرس اتوماتیک تکمیل شود</span>
						</span>
					</button>

					{manualLocationNotice && (
						<div className="rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-xs sm:text-sm text-warning">
							موقعیت انتخابی روی نقشه دقیق نبود؛ لطفاً آدرس را دستی بازبینی کنید.
						</div>
					)}

					{/* عنوان آدرس (اختیاری) */}
					<div>
						<div className={labelRowClass}>
							<IconHome className="w-5 h-5 text-primary" />
							<span>عنوان آدرس (مثلاً خانه یا محل کار)</span>
						</div>
						<div className={fieldWrapClass}>
							<input
								type="text"
								maxLength={50}
								placeholder="مثال: خانه"
								className={inputBaseClass}
								{...register("title")}
							/>
						</div>
						{errors.title && <small className={errorClass}>{errors.title.message}</small>}
					</div>

					{/* نام تحویل گیرنده */}
					<div>
						<div className={labelRowClass}>
							<IconUser className="w-5 h-5 text-primary" />
							<span>
								نام تحویل گیرنده <span className="text-error">*</span>
							</span>
						</div>
						<div className={fieldWrapClass}>
							<input
								type="text"
								maxLength={100}
								autoComplete="name"
								placeholder="مثال: علی رضایی"
								className={inputBaseClass}
								{...register("recipient_name")}
							/>
						</div>
						{errors.recipient_name && <small className={errorClass}>{errors.recipient_name.message}</small>}
					</div>

					{/* شماره تلفن */}
					<div>
						<div className={labelRowClass}>
							<IconPhone className="w-5 h-5 text-primary" />
							<span>
								شماره تلفن <span className="text-error">*</span>
							</span>
						</div>
						<div className={fieldWrapClass}>
							<input
								type="tel"
								maxLength={11}
								inputMode="numeric"
								autoComplete="tel"
								dir="ltr"
								placeholder="مثال: 09125456789"
								className={`${inputBaseClass} text-right`}
								{...register("recipient_phone")}
							/>
						</div>
						{errors.recipient_phone && <small className={errorClass}>{errors.recipient_phone.message}</small>}
					</div>

					{/* استان / شهر — دراپداون سفارشی هماهنگ با تم (به‌جای <select> خام) */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<div className={labelRowClass}>
								<IconBank className="w-5 h-5 text-primary" />
								<span>
									استان <span className="text-error">*</span>
								</span>
							</div>
							<div className={fieldWrapClass}>
								<Select
									name="province_id"
									value={provinceId}
									onChange={(value) => setValue("province_id", value, { shouldValidate: true })}
									onBlur={() => trigger("province_id")}
									options={(provincesQuery.data ?? []).map((province) => ({
										value: province.id,
										label: province.name,
									}))}
									placeholder="انتخاب استان"
									disabled={provincesQuery.isLoading}
									loading={provincesQuery.isLoading}
									aria-invalid={Boolean(errors.province_id)}
								/>
							</div>
							{errors.province_id && <small className={errorClass}>{errors.province_id.message}</small>}
						</div>
						<div>
							<div className={labelRowClass}>
								<IconMapPin className="w-5 h-5 text-primary" />
								<span>
									شهر <span className="text-error">*</span>
								</span>
							</div>
							<div className={fieldWrapClass}>
								<Select
									name="city_id"
									value={cityId}
									onChange={(value) => setValue("city_id", value, { shouldValidate: true })}
									onBlur={() => trigger("city_id")}
									options={citiesForSelectedProvince.map((city) => ({ value: city.id, label: city.name }))}
									placeholder="انتخاب شهر"
									disabled={!provinceId}
									aria-invalid={Boolean(errors.city_id)}
								/>
							</div>
							{errors.city_id && <small className={errorClass}>{errors.city_id.message}</small>}
						</div>
					</div>

					{/* پلاک / واحد */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<div className={labelRowClass}>
								<span>پلاک</span>
							</div>
							<div className={fieldWrapClass}>
								<input
									type="text"
									maxLength={20}
									placeholder="مثال: 12"
									className={inputBaseClass}
									{...register("plaque")}
								/>
							</div>
							{errors.plaque && <small className={errorClass}>{errors.plaque.message}</small>}
						</div>
						<div>
							<div className={labelRowClass}>
								<span>واحد</span>
							</div>
							<div className={fieldWrapClass}>
								<input
									type="text"
									maxLength={20}
									placeholder="مثال: 3"
									className={inputBaseClass}
									{...register("unit")}
								/>
							</div>
							{errors.unit && <small className={errorClass}>{errors.unit.message}</small>}
						</div>
					</div>

					{/* کد پستی */}
					<div>
						<div className={labelRowClass}>
							<IconCard className="w-5 h-5 text-primary" />
							<span>کد پستی</span>
						</div>
						<div className={fieldWrapClass}>
							<input
								type="text"
								maxLength={10}
								inputMode="numeric"
								autoComplete="postal-code"
								dir="ltr"
								placeholder="مثال: 1234567890"
								className={`${inputBaseClass} text-right`}
								{...register("postal_code")}
							/>
						</div>
						{errors.postal_code && <small className={errorClass}>{errors.postal_code.message}</small>}
					</div>

					{/* آدرس کامل */}
					<div>
						<div className={labelRowClass}>
							<IconHome className="w-5 h-5 text-primary" />
							<span>
								آدرس کامل <span className="text-error">*</span>
							</span>
						</div>
						<div className={fieldWrapClass}>
							<textarea
								maxLength={1000}
								rows={3}
								placeholder="آدرس دقیق شامل کوچه، خیابان، پلاک و واحد ..."
								className={`${inputBaseClass} resize-none`}
								{...register("address_line")}
							/>
						</div>
						{errors.address_line && <small className={errorClass}>{errors.address_line.message}</small>}
					</div>

					{/* تنظیم به عنوان پیش‌فرض */}
					<label className="flex items-center gap-2 text-sm text-text-secondary select-none">
						<input type="checkbox" className="h-4 w-4 accent-primary" {...register("is_default")} />
						این آدرس را پیش‌فرض کن
					</label>

					{/* دکمه‌ها */}
					<div className="flex flex-col-reverse sm:flex-row gap-3 mt-2">
						{onCancel && (
							<button
								type="button"
								onClick={onCancel}
								disabled={isSubmitting}
								className="w-full sm:w-auto sm:px-6 py-3.5 rounded-2xl border border-border text-text-secondary text-sm font-medium disabled:opacity-50"
							>
								انصراف
							</button>
						)}
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-hover py-3.5 font-bold text-background shadow-[0_0_35px_var(--primary-glow)] active:scale-[0.99] transition disabled:opacity-60 disabled:shadow-none"
						>
							{isSubmitting ? (
								"در حال ذخیره…"
							) : (
								<>
									{submitLabel}
									<IconTruck className="w-5 h-5" />
								</>
							)}
						</button>
					</div>

					{/* فوتر امنیتی */}
					<p className="flex items-center justify-center gap-2 text-xs text-muted mt-1">
						اطلاعات شما با بالاترین امنیت محافظت می‌شود.
						<IconShield className="w-4 h-4 text-primary" />
					</p>
				</form>
			</div>
			<MapPickerModal open={isMapOpen} onClose={() => setIsMapOpen(false)} onConfirm={handleMapConfirm} />
		</div>
	)
}
