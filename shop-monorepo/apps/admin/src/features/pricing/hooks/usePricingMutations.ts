import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import {
  approvePriceProposal,
  approveProposalBatch,
  rejectPriceProposal,
  rejectProposalBatch,
  submitManualExchangeRateOverride,
  updatePriceProposal,
} from "../api/pricingApi"
import type { ManualOverridePayload } from "../types"

function invalidateProposals(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["pricing", "proposals"] })
}

export function useUpdatePriceProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ proposalId, editedPriceToman }: { proposalId: number; editedPriceToman: number }) =>
      updatePriceProposal(proposalId, editedPriceToman),
    onSuccess: () => invalidateProposals(queryClient),
  })
}

export function useApprovePriceProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (proposalId: number) => approvePriceProposal(proposalId),
    onSuccess: () => invalidateProposals(queryClient),
  })
}

export function useRejectPriceProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (proposalId: number) => rejectPriceProposal(proposalId),
    onSuccess: () => invalidateProposals(queryClient),
  })
}

export function useApproveProposalBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (batchId: string) => approveProposalBatch(batchId),
    onSuccess: () => invalidateProposals(queryClient),
  })
}

export function useRejectProposalBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (batchId: string) => rejectProposalBatch(batchId),
    onSuccess: () => invalidateProposals(queryClient),
  })
}

export function useSubmitManualOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ManualOverridePayload) => submitManualExchangeRateOverride(payload),
    onSuccess: () => invalidateProposals(queryClient),
  })
}
