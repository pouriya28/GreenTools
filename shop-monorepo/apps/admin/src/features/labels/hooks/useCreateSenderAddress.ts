import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createSenderAddress } from "../api/labelsApi"

export function useCreateSenderAddress() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createSenderAddress,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sender-addresses"] })
        },
    })
}