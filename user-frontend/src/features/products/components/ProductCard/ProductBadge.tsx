import type { ComputedBadge } from "./productBadges";

interface ProductBadgeProps {
  badges: ComputedBadge[];
}

const BADGE_STYLES: Record<ComputedBadge["type"], string> = {
  discount: "bg-error",
  featured: "bg-primary",
  outOfStock: "bg-muted",
  preorder: "bg-info",
  new: "bg-success",
  bestSeller: "bg-warning",
};

export function ProductBadge({ badges }: ProductBadgeProps) {
  if (!badges.length) return null;

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      {badges.map((badge) => (
        <span
          key={badge.type}
          className={`
            px-3 h-8 rounded-full flex items-center justify-center
            text-xs font-bold shadow-lg text-white whitespace-nowrap
            ${BADGE_STYLES[badge.type]}
          `}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}