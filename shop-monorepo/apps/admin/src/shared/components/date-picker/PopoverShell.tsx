import { useEffect, useRef, type ReactNode, type RefObject } from "react"
import { createPortal } from "react-dom"

interface PopoverShellProps {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  children: ReactNode
}

export function PopoverShell({ open, onClose, anchorRef, children }: PopoverShellProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      onClose()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    // اگه صفحه اسکرول شد، به‌جای دنبال‌کردن نادرست موقعیت، پنل رو می‌بندیم
    function handleScroll() {
      onClose()
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("scroll", handleScroll, true)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("scroll", handleScroll, true)
    }
  }, [open, onClose, anchorRef])

  if (!open) return null

  const anchorRect = anchorRef.current?.getBoundingClientRect()
  const top = (anchorRect?.bottom ?? 0) + 8
  const left = anchorRect?.left ?? 0

  return createPortal(
    <div ref={panelRef} className="fixed z-50" style={{ top, left }}>
      {children}
    </div>,
    document.body
  )
}