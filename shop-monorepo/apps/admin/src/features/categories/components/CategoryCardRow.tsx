import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { ChevronDown, ChevronLeft, ImageOff, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Category } from "../types"

const ACTIONS_WIDTH = 144
const OPEN_THRESHOLD = ACTIONS_WIDTH / 2

interface CategoryCardRowProps {
  category: Category
  depth: number
  hasChildren: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onEdit: (category: Category) => void
  onDeleteRequest: (category: Category) => void
}

export function CategoryCardRow({
  category,
  depth,
  hasChildren,
  isExpanded,
  onToggleExpand,
  isOpen,
  onOpen,
  onClose,
  onEdit,
  onDeleteRequest,
}: CategoryCardRowProps) {
  const [dragOffset, setDragOffset] = useState(0)
  const draggingRef = useRef(false)
  const startXRef = useRef(0)
  const movedRef = useRef(false)

  const basePosition = isOpen ? -ACTIONS_WIDTH : 0
  const translateX = basePosition + dragOffset

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = true
    movedRef.current = false
    startXRef.current = event.clientX
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return
    const delta = event.clientX - startXRef.current
    if (Math.abs(delta) > 4) movedRef.current = true

    const raw = basePosition + delta
    const clamped = Math.min(0, Math.max(-ACTIONS_WIDTH, raw))
    setDragOffset(clamped - basePosition)
  }

  function endDrag() {
    if (!draggingRef.current) return
    draggingRef.current = false

    const finalPosition = basePosition + dragOffset
    setDragOffset(0)

    if (!movedRef.current) {
      // یه تپ ساده بود، نه سوایپ: اگه کارت باز بود ببندش.
      if (isOpen) onClose()
      return
    }

    if (finalPosition <= -OPEN_THRESHOLD) {
      onOpen()
    } else {
      onClose()
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-bg-1 shadow-sm">
      {/* لایه‌ی زیرین: دکمه‌های عملیات، ثابت سمت راست، با سوایپ به چپ نمایان میشن */}
      <div className="absolute inset-y-0 right-0 flex" style={{ width: ACTIONS_WIDTH }}>
        <button
          type="button"
          onClick={() => {
            onClose()
            onEdit(category)
          }}
          className="flex flex-1 flex-col items-center justify-center gap-1 bg-primary text-xs font-medium text-white active:opacity-80"
        >
          <Pencil className="h-4 w-4" />
          ویرایش
        </button>
        <button
          type="button"
          onClick={() => {
            onClose()
            onDeleteRequest(category)
          }}
          className="flex flex-1 flex-col items-center justify-center gap-1 bg-danger text-xs font-medium text-white active:opacity-80"
        >
          <Trash2 className="h-4 w-4" />
          حذف
        </button>
      </div>

      {/* لایه‌ی رویی: محتوای کارت، قابل کشیدن */}
      <div
        className="relative flex touch-pan-y items-center gap-3 bg-bg-1 px-3 py-3 select-none"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: draggingRef.current ? "none" : "transform 200ms ease-out",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="flex shrink-0 items-center" style={{ marginInlineStart: depth * 16 }}>
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand()
              }}
              className="rounded p-1 text-text-2 hover:bg-bg-3 hover:text-text-1"
              aria-label={isExpanded ? "بستن زیردسته‌ها" : "نمایش زیردسته‌ها"}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-6" />
          )}
        </div>

        {category.image ? (
          <img src={category.image} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" loading="lazy" />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-3 text-text-3">
            <ImageOff className="h-4 w-4" />
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium text-text-1">{category.name}</span>
          <span className="truncate text-xs text-text-2">{category.slug}</span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {category.is_active ? (
            <Badge variant="success">فعال</Badge>
          ) : (
            <Badge variant="muted">غیرفعال</Badge>
          )}
          <span className="text-[11px] text-text-3">ترتیب: {category.sort_order}</span>
        </div>
      </div>
    </div>
  )
}