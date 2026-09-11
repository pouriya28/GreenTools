import { useState } from "react"
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { api } from "@/shared/lib/axios"
import { useOperationVerificationStore } from "../store/operationVerificationStore"
import { resolveOperationVerification } from "../utils/operationVerificationBridge"
import { ApiError } from "@/shared/lib/apiError"

/**
 * مودال سراسری رمز عملیاتی — توسط اینترسپتور axios باز می‌شود، مستقل از این‌که
 * کدام کامپوننت درخواست حساس را زده (حذف دسته، اعطای امتیاز و...). یک‌بار در
 * ریشه‌ی اپ mount می‌شود (نه در هر صفحه). بعد از verify موفق، خودِ اینترسپتور
 * درخواست اصلی رو دوباره می‌فرستد؛ این کامپوننت فقط verify می‌کند.
 */
export function OperationVerificationDialog() {
	const { isOpen, isBusy, errorMessage, setBusy, setError } = useOperationVerificationStore()
	const [password, setPassword] = useState("")

	function handleCancel() {
		setPassword("")
		resolveOperationVerification(false)
	}

	async function handleConfirm() {
		if (!password) return
		setBusy(true)
		setError(null)
		try {
			await api.post("/auth/staff/operation-password/verify", {
				operation_password: password,
			})
			setPassword("")
			resolveOperationVerification(true)
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "رمز عملیاتی نادرست است.")
			setBusy(false)
		}
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={(next) => !isBusy && !next && handleCancel()}>
			<AlertDialogContent dir="rtl">
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2">
						<ShieldCheck className="h-5 w-5 text-primary" />
						تایید رمز عملیاتی
					</AlertDialogTitle>
					<AlertDialogDescription>
						این عملیات حساس است و نیاز به تایید رمز عملیاتی (جدا از رمز ورود) دارد.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<input
					type="password"
					autoFocus
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault()
							handleConfirm()
						}
					}}
					placeholder="رمز عملیاتی"
					disabled={isBusy}
					dir="ltr"
					className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
				/>

				{errorMessage && (
					<div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
						<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
						<span>{errorMessage}</span>
					</div>
				)}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={isBusy} onClick={handleCancel}>
						انصراف
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault()
							handleConfirm()
						}}
						disabled={isBusy || !password}
					>
						{isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
						تایید
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}