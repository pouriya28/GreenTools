import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { IconChevronDown } from "./icons"

export interface SelectOption {
	value: number
	label: string
}

interface SelectProps {
	value: number | undefined
	onChange: (value: number) => void
	onBlur?: () => void
	options: SelectOption[]
	placeholder: string
	disabled?: boolean
	loading?: boolean
	name?: string
	"aria-invalid"?: boolean
}

/**
 * دراپ‌داون سفارشی (بدون وابستگی خارجی) که کاملاً با توکن‌های تم (themes.css) هماهنگ است.
 * جایگزین <select> خام مرورگری می‌شود که قابل استایل‌دهی کامل نیست.
 *
 * امنیت/دسترس‌پذیری: مقادیر همیشه به‌صورت عدد (id واقعی استان/شهر) از options می‌آیند،
 * هیچ HTML خامی رندر نمی‌شود؛ role="listbox"/"option" و بستن با کلیک بیرون/Escape پیاده‌سازی شده.
 */
export function Select({
	value,
	onChange,
	onBlur,
	options,
	placeholder,
	disabled,
	loading,
	name,
	...rest
}: SelectProps) {
	const [open, setOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement | null>(null)
	const listboxId = useId()

	useEffect(() => {
		if (!open) return
		function handleClickOutside(event: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setOpen(false)
				onBlur?.()
			}
		}
		document.addEventListener("mousedown", handleClickOutside)
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [open, onBlur])

	const selected = options.find((option) => option.value === value)

	function handleSelect(option: SelectOption) {
		onChange(option.value)
		setOpen(false)
		onBlur?.()
	}

	function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault()
			if (!disabled && !loading) setOpen((prev) => !prev)
		} else if (event.key === "Escape") {
			setOpen(false)
		} else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault()
			if (!disabled && !loading) setOpen(true)
		}
	}

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				name={name}
				disabled={disabled || loading}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={listboxId}
				onClick={() => setOpen((prev) => !prev)}
				onKeyDown={handleTriggerKeyDown}
				className="flex w-full items-center justify-between bg-transparent text-right text-sm sm:text-base outline-none disabled:cursor-not-allowed disabled:opacity-50"
				{...rest}
			>
				<span className={selected ? "text-text" : "text-muted"}>
					{loading ? "در حال بارگذاری…" : selected ? selected.label : placeholder}
				</span>
				<IconChevronDown
					className={`h-4 w-4 shrink-0 text-primary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<ul
					role="listbox"
					id={listboxId}
					className="absolute inset-x-0 z-20 mt-2 max-h-56 overflow-auto rounded-2xl border border-border bg-surface p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
				>
					{options.length === 0 && (
						<li className="px-3 py-2 text-sm text-muted">موردی یافت نشد</li>
					)}
					{options.map((option) => (
						<li
							key={option.value}
							role="option"
							aria-selected={option.value === value}
							onClick={() => handleSelect(option)}
							className={`cursor-pointer rounded-xl px-3 py-2 text-sm transition ${
								option.value === value
									? "bg-primary/15 font-semibold text-primary"
									: "text-text hover:bg-primary/10"
							}`}
						>
							{option.label}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
