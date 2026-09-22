import { useMutation, useQueryClient } from "@tanstack/react-query"
import { closeStore, openStore } from "../api/storeStatusApi"

export function useStoreStatusMutations() {
	const queryClient = useQueryClient()

	const invalidate = () => queryClient.invalidateQueries({ queryKey: ["store-status"] })

	const close = useMutation({
		mutationFn: (reason?: string) => closeStore(reason),
		onSuccess: invalidate,
	})

	const open = useMutation({
		mutationFn: () => openStore(),
		onSuccess: invalidate,
	})

	return { close, open }
}