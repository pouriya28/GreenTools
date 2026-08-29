import { useQuery } from "@tanstack/react-query"
import { fetchPriceProposals } from "../api/pricingApi"
import type { PriceProposalFilters } from "../types"

export function usePriceProposals(filters: PriceProposalFilters) {
  return useQuery({
    queryKey: ["pricing", "proposals", filters.batch_id ?? "latest", filters.page ?? 1, filters.per_page ?? 50],
    queryFn: () => fetchPriceProposals(filters),
    // این لیست بین چند ادمین به‌اشتراک گذارده می‌شه (ممکنه یکی دیگه همین الان
    // تایید/رد/اصلاح کرده باشه)، پس staleTime رو کوتاه نگه می‌داریم.
    staleTime: 15_000,
  })
}
