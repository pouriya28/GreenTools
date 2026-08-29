import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import {
  approvePriceProposal,
  approveProposalBatch,
  rejectPriceProposal,
  rejectProposalBatch,
  updatePriceProposal,
} from "../api/pricingApi"

// Exchange-rate mutations (manual override, fetch-now, confirm, schedules)
// moved to "./useExchangeRateMutations" and "./useScheduleMutations" - this
// file now only touches product price proposals, matching the backend split.
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
