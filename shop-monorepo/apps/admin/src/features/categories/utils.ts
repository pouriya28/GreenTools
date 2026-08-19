import type { Category } from "./types"

export interface ParentOption {
  id: number
  name: string
  depth: number
}

function flatten(categories: Category[], depth: number): ParentOption[] {
  return categories.flatMap((category) => [
    { id: category.id, name: category.name, depth },
    ...flatten(category.children ?? [], depth + 1),
  ])
}

/** همه‌ی id های نوادگان یه دسته (بر اساس عمقی که بک‌اند eager-load کرده). */
function collectDescendantIds(category: Category): Set<number> {
  const ids = new Set<number>()

  function walk(node: Category) {
    for (const child of node.children ?? []) {
      ids.add(child.id)
      walk(child)
    }
  }

  walk(category)
  return ids
}

/**
 * لیست مسطح گزینه‌های «دسته‌ی والد» رو برای Select می‌سازه.
 *
 * توجه امنیتی: این فقط یه کمک UX سمت کلاینته (جلوگیری از انتخاب خود دسته یا
 * زیردسته‌هاش به‌عنوان والد، تا کاربر یه دور بیهوده به سرور نزنه). اعتبارسنجی
 * واقعی و قطعی حلقه‌ی پدر/فرزندی همیشه سمت بک‌اند انجام می‌شه
 * (UpdateCategoryRequest -> Category::hasDescendant)، چون دیتای فرانت فقط
 * یک سطح children رو داره و نمی‌تونه به‌تنهایی قابل‌اعتماد باشه.
 */
export function buildParentOptions(
  categories: Category[],
  excludeCategory?: Category | null
): ParentOption[] {
  const all = flatten(categories, 0)
  if (!excludeCategory) return all

  const blocked = collectDescendantIds(excludeCategory)
  blocked.add(excludeCategory.id)

  return all.filter((option) => !blocked.has(option.id))
}