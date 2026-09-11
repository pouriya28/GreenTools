import { create } from "zustand"

interface OperationVerificationStore {
	isOpen: boolean
	isBusy: boolean
	errorMessage: string | null
	setBusy: (busy: boolean) => void
	setError: (message: string | null) => void
	open: () => void
	close: () => void
}

/**
 * وضعیت UI مودال رمز عملیاتی. خودِ منطق صف‌بندی/رزولوشن request های معلق
 * در `operationVerificationBridge.ts` است (خارج از React)، چون اینترسپتور axios
 * یک ماژول معمولی است، نه کامپوننت.
 */
export const useOperationVerificationStore = create<OperationVerificationStore>((set) => ({
	isOpen: false,
	isBusy: false,
	errorMessage: null,
	setBusy: (busy) => set({ isBusy: busy }),
	setError: (message) => set({ errorMessage: message }),
	open: () => set({ isOpen: true, errorMessage: null }),
	close: () => set({ isOpen: false, errorMessage: null, isBusy: false }),
}))