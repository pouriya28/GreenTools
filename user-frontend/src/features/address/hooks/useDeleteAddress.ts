import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteAddress } from "../api/addressApi"
import { addressQueryKeys } from "../utils/addressQueryKeys"
import { notificationService } from "@/shared/notification/notification.service"

export function useDeleteAddress() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: number) => deleteAddress(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: addressQueryKeys.all })
			notificationService.success("آدرس حذف شد.")
		},
	})
}
