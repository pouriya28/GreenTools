export interface Province {
	id: number
	name: string
}

export interface City {
	id: number
	name: string
}

export interface ProvinceWithCities extends Province {
	cities: City[]
}

export type MapProvider = "neshan" | "mapir"

export interface Address {
	id: number
	title: string | null
	recipient_name: string
	recipient_phone: string
	province: Province
	city: City
	district: string | null
	postal_code: string | null
	address_line: string
	plaque: string | null
	unit: string | null
	latitude: number | null
	longitude: number | null
	map_provider: MapProvider | null
	map_place_id: string | null
	is_default: boolean
	created_at: string
	updated_at: string
}

// Mirrors StoreAddressRequest — keep in sync with the backend rules() array.
export interface AddressInput {
	title?: string | null
	recipient_name: string
	recipient_phone: string
	province_id: number
	city_id: number
	district?: string | null
	postal_code?: string | null
	address_line: string
	plaque?: string | null
	unit?: string | null
	latitude?: number | null
	longitude?: number | null
	map_provider?: MapProvider | null
	map_place_id?: string | null
	is_default?: boolean
}

// Mirrors UpdateAddressRequest — every field is optional (`sometimes`).
export type UpdateAddressInput = Partial<AddressInput>

// Mirrors MapController::reverseGeocode() response `data`.
export interface ReverseGeocodeResult {
	latitude: number
	longitude: number
	formatted_address: string | null
	province: Province | null
	city: City | null
	neighborhood: string | null
	street: string | null
	requires_manual_location: boolean
}
