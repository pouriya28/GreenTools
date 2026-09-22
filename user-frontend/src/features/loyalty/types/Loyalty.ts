// src/features/loyalty/types/Loyalty.ts
export type LoyaltyLevel = { code: string; name: string; icon: string | null }
export type LoyaltyNextLevel = LoyaltyLevel & { points_required: number; points_remaining: number }
export type LoyaltyInfo = {
	points: number
	level: LoyaltyLevel | null
	next_level: LoyaltyNextLevel | null
	progress_percent: number | null
}