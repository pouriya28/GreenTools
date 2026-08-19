export interface Category {
  id: number
  parent_id: number | null
  name: string
  slug: string
  description: string | null
  image: string | null
  icon: string | null
  is_active: boolean
  sort_order: number
  children: Category[]
  created_at: string | null
  deleted_at?: string | null
}

export interface CategoryPayload {
  parent_id: number | null
  name: string
  description?: string | null
  icon?: string | null
  is_active?: boolean
  sort_order?: number
  meta_title?: string | null
  meta_description?: string | null
}

// شکل response لاراول برای JsonResource: تک آیتم زیر data، لیست هم زیر data
export interface ResourceEnvelope<T> {
  data: T
}