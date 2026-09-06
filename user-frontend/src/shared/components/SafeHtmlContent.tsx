// src/shared/components/SafeHtmlContent.tsx
import { useMemo } from "react"
import DOMPurify from "dompurify"

const ALLOWED_TAGS = [
  "h2", "h3", "h4", "p", "strong", "em", "u", "s",
  "ul", "ol", "li", "blockquote",
  "table", "thead", "tbody", "tr", "th", "td",
  "br", "a",
]
const ALLOWED_ATTR = ["href", "title"]

interface SafeHtmlContentProps {
  html: string | null | undefined
  className?: string
}

export function SafeHtmlContent({ html, className }: SafeHtmlContentProps) {
  const safeHtml = useMemo(() => {
    if (!html) return ""
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
    })
    
    
  }, [html])

  if (!safeHtml) return null

  return (
    <div
      className={
        "prose prose-sm sm:prose-base max-w-none break-words " +
        // رنگ‌ها را صریح روی تم پروژه ست می‌کنیم (نه پالت پیش‌فرض typography)
        "prose-headings:text-text prose-headings:font-bold " +
        "prose-p:text-text-secondary prose-li:text-text-secondary " +
        "prose-strong:text-text prose-strong:font-semibold " +
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline " +
        "prose-blockquote:text-text-secondary prose-blockquote:border-primary " +
        "prose-th:text-text prose-td:text-text-secondary " +
        (className ?? "")
      }
      dir="rtl"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}