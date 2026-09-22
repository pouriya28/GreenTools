import type { AuthUser } from "@/features/auth/types/auth.types";
import { MaskedEmail } from "@/features/loyalty/components/MaskedEmail";
import { MaskedPhone } from "@/features/loyalty/components/MaskedPhone";

interface UserIdentityProps {
  user: AuthUser;
  className?: string;
}

export function UserIdentity({
  user,
  className = "",
}: UserIdentityProps) {
  if (user.phone) {
    return (
      <MaskedPhone
        phone={user.phone}
        className={className}
      />
    );
  }

  if (user.email) {
    return (
      <MaskedEmail
        email={user.email}
        className={className}
      />
    );
  }

  return (
    <span className={className}>
      حساب کاربری
    </span>
  );
}