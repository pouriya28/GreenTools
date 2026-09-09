import { IconMapPin } from "./icons"

interface MapPickerButtonProps {
	onClick: () => void
	disabled?: boolean
}

/**
 * دکمه‌ی دایره‌ای «انتخاب آدرس از نقشه» داخل هدر فرم آدرس.
 * رنگ‌ها از توکن‌های themes.css می‌آیند تا در هر سه تم (light/dark/neon) هماهنگ باشد.
 */
export function MapPickerButton({ onClick, disabled }: MapPickerButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-haspopup="dialog"
			aria-label="انتخاب آدرس از نقشه"
			className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
		>
			<IconMapPin className="h-5 w-5" />
		</button>
	)
}
