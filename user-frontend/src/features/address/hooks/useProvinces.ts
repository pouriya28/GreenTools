import { useQuery } from "@tanstack/react-query"
import { fetchProvincesWithCities } from "../api/mapApi"
import { addressQueryKeys } from "../utils/addressQueryKeys"

// Provinces/cities are near-static reference data (also cached server-side
// for a day) — safe to keep in the client cache for a long time too.
export function useProvinces() {
	return useQuery({
		queryKey: addressQueryKeys.locations,
		queryFn: fetchProvincesWithCities,
		staleTime: 24 * 60 * 60 * 1000,
		gcTime: 24 * 60 * 60 * 1000,
	})
}
