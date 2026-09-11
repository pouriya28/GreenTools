import { useState } from "react"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { useSetOperationPassword } from "../hooks/useSetOperationPassword"
import { ApiError } from "@/shared/error/ApiError"

/** فرم تنظیم/تغییر رمز عملیاتی — در صفحه‌ی تنظیمات حساب کاربری ادمین. */
export function SetOperationPasswordForm() {
	const [currentLoginPassword, setCurrentLoginPassword] = useState("")
	const [operationPassword, setOperationPassword] = useState("")
	const [confirmation, setConfirmation] = useState("")
	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	const mutation = useSetOperationPassword()
	const errorMessage = mutation.isError && mutation.error instanceof ApiError ? mutation.error.message : null

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setSuccessMessage(null)
		try {
			await mutation.mutateAsync({
				current_login_password: currentLoginPassword,
				operation_password: operationPassword,
				operation_password_confirmation: confirmation,
			})
			setSuccessMessage("رمز تأیید عملیات با موفقیت تنظیم شد.")
			setCurrentLoginPassword("")
			setOperationPassword("")
			setConfirmation("")
		} catch {
			// خطا در errorMessage نمایش داده می‌شود
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4" dir="rtl">
			<h2 className="font-bold text-text">رمز تأیید عملیات</h2>
			<p className="text-sm text-text-secondary">
				این رمز، جدا از رمز ورود شماست و برای تایید عملیات‌های حساس (مثل حذف قطعی یا مدیریت امتیاز مشتری) استفاده می‌شود.
			</p>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm text-text-secondary">رمز ورود فعلی</label>
				<input
					type="password"
					value={currentLoginPassword}
					onChange={(e) => setCurrentLoginPassword(e.target.value)}
					required
					className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm text-text-secondary">رمز عملیاتی جدید (حداقل ۸ کاراکتر، شامل حرف و عدد)</label>
				<input
					type="password"
					value={operationPassword}
					onChange={(e) => setOperationPassword(e.target.value)}
					required
					className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-sm text-text-secondary">تکرار رمز عملیاتی</label>
				<input
					type="password"
					value={confirmation}
					onChange={(e) => setConfirmation(e.target.value)}
					required
					className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
				/>
			</div>

			{errorMessage && (
				<div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
					<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
					<span>{errorMessage}</span>
				</div>
			)}
			{successMessage && (
				<div className="flex items-start gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600">
					<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
					<span>{successMessage}</span>
				</div>
			)}

			<button
				type="submit"
				disabled={mutation.isPending}
				className="self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
			>
				{mutation.isPending ? "در حال ذخیره…" : "ذخیره‌ی رمز عملیاتی"}
			</button>
		</form>
	)
}