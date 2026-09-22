import { useOperationVerificationStore } from "../store/operationVerificationStore"

let isAwaitingVerification = false
let subscribers: Array<(verified: boolean) => void> = []

/**
 * از اینترسپتور axios صدا زده می‌شود وقتی پاسخ 403 با کد
 * OPERATION_VERIFICATION_REQUIRED برگردد. اگر چند درخواست هم‌زمان رد شده
 * باشند، مودال فقط یک‌بار باز می‌شود و همه منتظر همون یک تایید می‌مانند.
 */
export function waitForOperationVerification(): Promise<boolean> {
	if (!isAwaitingVerification) {
		isAwaitingVerification = true
		useOperationVerificationStore.getState().open()
	}
	return new Promise((resolve) => {
		subscribers.push(resolve)
	})
}

/** توسط مودال صدا زده می‌شود: بعد از verify موفق (true) یا انصراف (false). */
export function resolveOperationVerification(verified: boolean) {
	isAwaitingVerification = false
	subscribers.forEach((resolve) => resolve(verified))
	subscribers = []
	useOperationVerificationStore.getState().close()
}