import { useQuery } from "@tanstack/react-query";
import { loyaltyApi } from "../api/loyalty.api";
import { useAuthStore } from "@/store/authStore";

// Seeds React Query's cache with whatever loyalty snapshot already came back
// from login/verify/refresh (via authStore), then keeps it fresh with a
// dedicated fetch — so the header badge renders instantly with no flicker,
// while dashboard-level components still get up-to-date numbers.
export function useLoyalty() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userType = useAuthStore((s) => s.user?.type);
  const cachedLoyalty = useAuthStore((s) => s.user?.loyalty ?? undefined);

  return useQuery({
    queryKey: ["loyalty", "me"],
    queryFn: loyaltyApi.getMe,
    enabled: isAuthenticated && userType === "customer",
    staleTime: 60_000,
    initialData: cachedLoyalty,
  });
}