import { useMutation } from "@tanstack/react-query"
import { setOperationPassword } from "../api/operationPasswordApi"

export function useSetOperationPassword() {
	return useMutation({
		mutationFn: setOperationPassword,
	})
}