import { useMutation, useQueryClient } from "@tanstack/react-query"
import { setDefaultAddress } from "../api/addressApi"
import { addressQueryKeys } from "../utils/addressQueryKeys"

export function useSetDefaultAddress() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: number) => setDefaultAddress(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: addressQueryKeys.all })
		},
	})
}
