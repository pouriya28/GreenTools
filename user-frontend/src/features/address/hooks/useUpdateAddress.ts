import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateAddress } from "../api/addressApi"
import { addressQueryKeys } from "../utils/addressQueryKeys"
import type { UpdateAddressInput } from "../types/Address"
import { notificationService } from "@/shared/notification/notification.service"

export function useUpdateAddress() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, input }: { id: number; input: UpdateAddressInput }) => updateAddress(id, input),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: addressQueryKeys.all })
			notificationService.success("آدرس ویرایش شد.")
		},
	})
}
