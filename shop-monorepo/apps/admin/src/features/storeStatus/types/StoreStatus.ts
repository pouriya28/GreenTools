export interface StoreStatus {
	is_open: boolean
	closed_reason: string | null
	closed_by_user_id: number | null
	closed_at: string | null
}