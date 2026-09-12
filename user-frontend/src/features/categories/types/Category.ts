export interface CategoryMeta {
  meta_title: string | null;
  meta_description: string | null;
}

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  tags: string[];
  meta: CategoryMeta | null;
  children: Category[];
  created_at: string | null;
  deleted_at: string | null;
}