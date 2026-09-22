import { api } from "@/lib/axios"

export interface SetOperationPasswordInput {
	current_login_password: string
	operation_password: string
	operation_password_confirmation: string
}

/** تنظیم یا تغییر رمز عملیاتی. نیاز به رمز ورود فعلی دارد (step-up security). */
export async function setOperationPassword(input: SetOperationPasswordInput): Promise<void> {
	await api.post("/auth/staff/operation-password/set", input)
}