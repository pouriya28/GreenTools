import { api } from "@/lib/axios";
import type { LoyaltySummary } from "@/features/auth/types/auth.types";

export const loyaltyApi = {
  getMe: async (): Promise<LoyaltySummary | null> => {
    const { data } = await api.get<{ data: LoyaltySummary | null }>("/v1/customer/loyalty/me");
    return data.data;
  },
};