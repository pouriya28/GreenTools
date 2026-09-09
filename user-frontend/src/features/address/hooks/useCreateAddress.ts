import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createAddress } from "../api/addressApi"
import { addressQueryKeys } from "../utils/addressQueryKeys"
import { notificationService } from "@/shared/notification/notification.service"

export function useCreateAddress() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: createAddress,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: addressQueryKeys.all })
			notificationService.success("آدرس با موفقیت ثبت شد.")
		},
		// 422 (validation) errors are intentionally NOT auto-toasted by the axios
		// interceptor — the form itself renders field-level messages from
		// error.errors. Only unexpected failures need a toast here.
	})
}
