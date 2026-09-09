import { useQuery } from "@tanstack/react-query"
import { fetchAddresses } from "../api/addressApi"
import { addressQueryKeys } from "../utils/addressQueryKeys"

export function useAddresses() {
	return useQuery({
		queryKey: addressQueryKeys.all,
		queryFn: fetchAddresses,
	})
}
