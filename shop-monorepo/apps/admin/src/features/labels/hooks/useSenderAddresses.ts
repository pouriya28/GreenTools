import { useQuery } from "@tanstack/react-query"
import { fetchSenderAddresses } from "../api/labelsApi"

export function useSenderAddresses() {
    return useQuery({
        queryKey: ["sender-addresses"],
        queryFn: fetchSenderAddresses,
    })
}