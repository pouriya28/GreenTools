import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import {
  confirmCurrentExchangeRate,
  fetchCurrentExchangeRate,
  fetchNowExchangeRate,
  submitManualExchangeRateOverride,
} from "../api/exchangeRateApi"
import type { ManualOverridePayload } from "../types"

export const CURRENT_EXCHANGE_RATE_QUERY_KEY = ["pricing", "exchange-rate", "current"] as const

// Shared by the manual-override dialog's "دریافت نرخ فعلی" button and the
// standalone status card's fetch-now/confirm actions, so all three read (and
// invalidate) the exact same cached value instead of drifting out of sync.
export function useCurrentExchangeRate() {
  return useQuery({
    queryKey: CURRENT_EXCHANGE_RATE_QUERY_KEY,
    queryFn: fetchCurrentExchangeRate,
  })
}

function invalidateExchangeRateAndProposals(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: CURRENT_EXCHANGE_RATE_QUERY_KEY })
  queryClient.invalidateQueries({ queryKey: ["pricing", "proposals"] })
}

export function useSubmitManualOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ManualOverridePayload) => submitManualExchangeRateOverride(payload),
    onSuccess: () => invalidateExchangeRateAndProposals(queryClient),
  })
}

export function useFetchNowExchangeRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => fetchNowExchangeRate(),
    onSuccess: () => invalidateExchangeRateAndProposals(queryClient),
  })
}

export function useConfirmCurrentExchangeRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => confirmCurrentExchangeRate(),
    onSuccess: () => invalidateExchangeRateAndProposals(queryClient),
  })
}
