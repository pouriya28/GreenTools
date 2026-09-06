import { useLoyalty } from "../hooks/useLoyalty";

// Full loyalty status card for the customer dashboard: current level, point
// total, and a progress bar toward the next level (or a "top level reached"
// state when there is no next level).
export function LoyaltyProgressCard() {
  const { data: loyalty, isLoading } = useLoyalty();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 animate-pulse">
        <div className="h-5 w-32 bg-border/60 rounded mb-4" />
        <div className="h-2 w-full bg-border/60 rounded-full" />
      </div>
    );
  }

  if (!loyalty?.level) return null;

  const { level, points, next_level, progress_percent } = loyalty;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none" aria-hidden="true">
            {level.icon}
          </span>
          <div>
            <p className="font-bold text-text">{level.name}</p>
            <p className="text-xs text-text-secondary">
              {points.toLocaleString("fa-IR")} امتیاز
            </p>
          </div>
        </div>

        {next_level && (
          <span className="text-2xl leading-none opacity-40" aria-hidden="true">
            {next_level.icon}
          </span>
        )}
      </div>

      {next_level ? (
        <>
          <div className="h-2 w-full rounded-full bg-background overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress_percent ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary mt-2">
            {next_level.points_remaining.toLocaleString("fa-IR")} امتیاز تا سطح{" "}
            <span className="font-medium text-text">{next_level.name}</span>
          </p>
        </>
      ) : (
        <p className="text-xs text-text-secondary mt-1">شما به بالاترین سطح رسیده‌اید 👑</p>
      )}
    </div>
  );
}