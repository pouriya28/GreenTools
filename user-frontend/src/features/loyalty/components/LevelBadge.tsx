import { useLoyalty } from "../hooks/useLoyalty";

interface LevelBadgeProps {
  showName?: boolean;
  className?: string;
}

// Small badge for the site header. Renders nothing for guests, staff
// accounts, or before the level has resolved — header space is tight, so
// there is no loading placeholder here on purpose.
export function LevelBadge({ showName = false, className = "" }: LevelBadgeProps) {
  const { data: loyalty } = useLoyalty();

  if (!loyalty?.level) return null;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full bg-surface border border-border px-2.5 py-1 text-xs ${className}`}
      title={`سطح: ${loyalty.level.name} — ${loyalty.points.toLocaleString("fa-IR")} امتیاز`}
    >
      <span className="text-sm leading-none" aria-hidden="true">
        {loyalty.level.icon}
      </span>
      {showName && <span className="font-medium text-text">{loyalty.level.name}</span>}
    </div>
  );
}