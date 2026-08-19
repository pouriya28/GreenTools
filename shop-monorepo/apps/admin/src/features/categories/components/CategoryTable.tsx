import { useState, type ReactNode } from "react"
import { ChevronDown, ChevronLeft, FolderTree, ImageOff, Pencil, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CategoryCardRow } from "./CategoryCardRow"
import type { Category } from "../types"

interface CategoryTableProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDeleteRequest: (category: Category) => void
}

interface FlatCategory {
  category: Category
  depth: number
}

function flattenVisible(list: Category[], depth: number, expandedIds: Set<number>): FlatCategory[] {
  return list.flatMap((category) => {
    const hasChildren = (category.children?.length ?? 0) > 0
    const isExpanded = expandedIds.has(category.id)
    const children =
      hasChildren && isExpanded ? flattenVisible(category.children, depth + 1, expandedIds) : []
    return [{ category, depth }, ...children]
  })
}

export function CategoryTable({ categories, onEdit, onDeleteRequest }: CategoryTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [openSwipeId, setOpenSwipeId] = useState<number | null>(null)

  function toggleExpanded(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-text-2">
        <FolderTree className="h-8 w-8 opacity-50" />
        <p className="text-sm">هنوز هیچ دسته‌بندی‌ای ثبت نشده.</p>
      </div>
    )
  }

  const flatRows = flattenVisible(categories, 0, expandedIds)

  return (
    <>
      {/* دسکتاپ/تبلت: جدول. دراپ‌داون عمداً حذف شده — به‌جاش دو تا دکمه‌ی ساده و
          همیشه‌قابل‌کلیک، چون Menu کتابخونه‌ی Base UI با این پروژه رفتار پایداری نداشت. */}
      <div className="hidden overflow-hidden rounded-xl border border-border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام</TableHead>
              <TableHead>اسلاگ</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>ترتیب</TableHead>
              <TableHead className="w-24 text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatRows.map(({ category, depth }): ReactNode => {
              const hasChildren = (category.children?.length ?? 0) > 0
              const isExpanded = expandedIds.has(category.id)

              return (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-2" style={{ paddingInlineStart: depth * 20 }}>
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(category.id)}
                          className="rounded p-0.5 text-text-2 hover:bg-bg-3 hover:text-text-1"
                          aria-label={isExpanded ? "بستن زیردسته‌ها" : "نمایش زیردسته‌ها"}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronLeft className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <span className="w-5" />
                      )}

                      {category.image ? (
                        <img
                          src={category.image}
                          alt=""
                          className="h-6 w-6 rounded object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-bg-3 text-text-3">
                          <ImageOff className="h-3.5 w-3.5" />
                        </span>
                      )}

                      <span className="font-medium text-text-1">{category.name}</span>
                      {hasChildren && (
                        <span className="text-xs text-text-3">({category.children.length})</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-text-2">{category.slug}</TableCell>

                  <TableCell>
                    {category.is_active ? (
                      <Badge variant="success">فعال</Badge>
                    ) : (
                      <Badge variant="muted">غیرفعال</Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-text-2">{category.sort_order}</TableCell>

                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="ویرایش"
                        onClick={() => onEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="حذف"
                        className="text-danger hover:bg-danger/10 hover:text-danger"
                        onClick={() => onDeleteRequest(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* موبایل: کارت با سوایپ به چپ برای نمایش دکمه‌های ویرایش/حذف */}
      <div className="flex flex-col gap-2 sm:hidden">
        {flatRows.map(({ category, depth }) => {
          const hasChildren = (category.children?.length ?? 0) > 0
          return (
            <CategoryCardRow
              key={category.id}
              category={category}
              depth={depth}
              hasChildren={hasChildren}
              isExpanded={expandedIds.has(category.id)}
              onToggleExpand={() => toggleExpanded(category.id)}
              isOpen={openSwipeId === category.id}
              onOpen={() => setOpenSwipeId(category.id)}
              onClose={() => setOpenSwipeId((current) => (current === category.id ? null : current))}
              onEdit={onEdit}
              onDeleteRequest={onDeleteRequest}
            />
          )
        })}
      </div>
    </>
  )
}