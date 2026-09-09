import { useMutation } from "@tanstack/react-query"
import { reverseGeocode } from "../api/mapApi"

// Deliberately a mutation, not a query: this must only fire when the user
// explicitly drops/confirms a pin, never automatically on drag/zoom, to stay
// under the backend's 30/min per-user limiter (throttle:reverse-geocode).
export function useReverseGeocode() {
	return useMutation({
		mutationFn: reverseGeocode,
	})
}
