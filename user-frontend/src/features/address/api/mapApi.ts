import { api } from "@/lib/axios"
import type { ReverseGeocodeResult } from "../types/Address"
import type { ProvinceWithCities } from "../types/Address"

interface ApiEnvelope<T> {
    success: boolean
    data: T
    message: string | null
    code: string | null
    meta: { request_id: string | null; timestamp: string }
}

export interface ReverseGeocodeInput {
    latitude: number
    longitude: number
}

// POST /v1/map/reverse-geocode — auth:sanctum + throttle:reverse-geocode
// (30/min per user). Never call this on every map drag; only on "drop pin" /
// "confirm this point", to stay well under the limiter.
export async function reverseGeocode(input: ReverseGeocodeInput): Promise<ReverseGeocodeResult> {
    const { data } = await api.post<ApiEnvelope<ReverseGeocodeResult>>("/v1/map/reverse-geocode", input)
    return data.data
}

export interface SearchPlacesInput {
    term: string
    latitude: number
    longitude: number
}

export interface PlaceSearchResult {
    title: string
    address: string
    region: string
    neighbourhood: string | null
    category: string
    type: string
    latitude: number
    longitude: number
}

// POST /v1/map/search — auth:sanctum + throttle:search-address (20/min per
// user). Proxies Neshan's location-based Search API server-side so the
// "سرویس‌ها" key never reaches the browser. The frontend debounces calls
// (see useAddressSearch) to stay well under the limiter.
export async function searchPlaces(input: SearchPlacesInput): Promise<PlaceSearchResult[]> {
    const { data } = await api.post<ApiEnvelope<PlaceSearchResult[]>>("/v1/map/search", input)
    return data.data
}

// GET /v1/locations/provinces — public, cached, real database ids.
// This is the single source of truth for province_id/city_id; never derive
// these ids from the local assets/cities/cities.json (it has no ids and its
// names are not guaranteed to match the database).
export async function fetchProvincesWithCities(): Promise<ProvinceWithCities[]> {
    const { data } = await api.get<ApiEnvelope<ProvinceWithCities[]>>("/v1/locations/provinces")
    return data.data
}
