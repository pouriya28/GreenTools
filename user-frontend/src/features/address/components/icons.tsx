type IconProps = { className?: string }

/**
 * آیکون‌های داخلی SVG بدون وابستگی به پکج خارجی. همه از currentColor استفاده می‌کنند
 * تا با کلاس رنگ والد (مثلاً text-primary) در هر سه تم (light/dark/neon) هماهنگ باشند.
 */

export function IconUser({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
			<path d="M4.5 20c1-3.6 4-5.5 7.5-5.5s6.5 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
		</svg>
	)
}

export function IconPhone({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path
				d="M6 4h2.2l1.3 3.6-1.7 1.6c1 2.1 2.7 3.8 4.8 4.8l1.6-1.7 3.6 1.3V16c0 1.1-.9 2-2 2C9.6 18 4 12.4 4 6c0-1.1.9-2 2-2Z"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function IconBank({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path d="M4 9.5 12 4l8 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M5 10v8M9 10v8M15 10v8M19 10v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
			<path d="M3.5 20.5h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
		</svg>
	)
}

export function IconMapPin({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path
				d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinejoin="round"
			/>
			<circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.6" />
		</svg>
	)
}

export function IconCard({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
			<path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
			<path d="M6 14.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
		</svg>
	)
}

export function IconHome({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path d="M4 10.5 12 4l8 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M6 9.5V20h12V9.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
			<path d="M10 20v-5h4v5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
		</svg>
	)
}

export function IconTruck({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path d="M2.5 7h11v8h-11z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
			<path d="M13.5 10h3.5l3 3v2h-6.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
			<circle cx="6.5" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.5" />
			<circle cx="16.5" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	)
}

export function IconShield({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path
				d="M12 3.5 19 6.2v5.3c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6.2L12 3.5Z"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinejoin="round"
			/>
			<path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export function IconBox({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path d="M4 8.2 12 4l8 4.2v7.6L12 20l-8-4.2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
			<path d="M4 8.2 12 12l8-3.8M12 12v8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
		</svg>
	)
}

export function IconChevronDown({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export function IconArrowRight({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export function IconPencil({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
		</svg>
	)
}

export function IconTrash({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export function IconStar({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className}>
			<path d="M12 3.5l2.5 5.6 6 .6-4.5 4 1.3 6-5.3-3.2-5.3 3.2 1.3-6-4.5-4 6-.6Z" />
		</svg>
	)
}

export function IconPlus({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	)
}

export function IconClose({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	)
}

export function IconCheck({ className }: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path d="m5 13 4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
