import mascotLogo from "@/assets/mascot-logo.png"

interface LogoProps {
	className?: string
}

/**
 * لوگوی ماسکوت پروژه (سوسمار پستی). فقط در بنر بالای فرم آدرس/چک‌اوت
 * استفاده می‌شود، جایگزین آیکون جعبهٔ قبلی.
 */
export function Logo({ className = "h-16 w-16" }: LogoProps) {
	return (
		<img
			src={mascotLogo}
			alt="لوگوی پستی"
			className={`${className} shrink-0 rounded-xl object-contain`}
			draggable={false}
		/>
	)
}
