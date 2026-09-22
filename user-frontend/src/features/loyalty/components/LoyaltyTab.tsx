// src/features/loyalty/components/LoyaltyTab.tsx
import { useLoyalty } from "../hooks/useLoyalty"
import { LevelProgressArc } from "./LevelProgressArc"

// نسخه‌ی تب داشبورد از وضعیت سطح — همون داده‌ی useLoyalty موجود، فقط با
// نمایش نیم‌دایره به‌جای نوار خطی LoyaltyProgressCard.
export function LoyaltyTab() {
	const { data: loyalty, isLoading } = useLoyalty()

	if (isLoading) {
		return (
			<div className="flex flex-col items-center gap-4 py-6 animate-pulse">
				<div className="h-24 w-40 bg-border/60 rounded-full" />
				<div className="h-4 w-24 bg-border/60 rounded" />
			</div>
		)
	}

	if (!loyalty?.level) {
		return <p className="text-text-secondary text-center py-8">اطلاعات سطح در دسترس نیست.</p>
	}

	const { level, points, next_level, progress_percent } = loyalty

	return (
		<div className="flex flex-col items-center gap-4 py-6">
			<div className="relative flex flex-col items-center">
				<LevelProgressArc progressPercent={next_level ? progress_percent ?? 0 : 100} />
				<div className="absolute top-[52px] flex flex-col items-center gap-1">
					<span className="text-4xl leading-none" aria-hidden="true">
						{level.icon}
					</span>
					<span className="font-bold text-text">{level.name}</span>
				</div>
			</div>

			<div className="text-center">
				<p className="text-text-secondary text-sm">{points.toLocaleString("fa-IR")} امتیاز</p>
				{next_level ? (
					<p className="text-text-secondary text-xs mt-1">
						{next_level.points_remaining.toLocaleString("fa-IR")} امتیاز تا سطح{" "}
						<span className="font-medium text-text">{next_level.name}</span>
					</p>
				) : (
					<p className="text-success text-xs mt-1">شما به بالاترین سطح رسیده‌اید 👑</p>
				)}
			</div>
		</div>
	)
}