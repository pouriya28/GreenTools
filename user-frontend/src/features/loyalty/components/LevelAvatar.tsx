import type { AuthUser } from "@/features/auth/types/auth.types";

interface LevelAvatarProps {
  user: AuthUser;
  className?: string;
}

// Small circular avatar for the header/dashboard user menu.
// Priority: level icon (customers with a resolved level) → last 4 digits of
// phone → generic "U". Covers staff accounts (no loyalty) and the rare case
// of a customer whose level hasn't resolved yet.
export function LevelAvatar({ user, className = "" }: LevelAvatarProps) {
  const icon = user.loyalty?.level?.icon;
  const fallback = user.phone ? user.phone.slice(-4) : "U";

  return (
    <div
      className={`w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs leading-none ${className}`}
      title={user.loyalty?.level?.name ?? undefined}
      aria-hidden={!!icon}
    >
      {icon ?? fallback}
    </div>
  );
}