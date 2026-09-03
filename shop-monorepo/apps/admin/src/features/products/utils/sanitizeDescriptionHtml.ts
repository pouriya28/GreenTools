// src/features/products/utils/sanitizeDescriptionHtml.ts
import DOMPurify from 'dompurify'

// باید دقیقاً با whitelist سمت بکند یکسان بماند
// (config/purifier.php -> settings.product_description.HTML.Allowed)
const ALLOWED_TAGS = [
  'h2', 'h3', 'h4',
  'p',
  'strong', 'em', 'u', 's',
  'ul', 'ol', 'li',
  'blockquote',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'br',
  'a',
]

const ALLOWED_ATTR = ['href', 'title']

let linkSecurityHookInstalled = false

/**
 * بدون توجه به اینکه ورودی (از بکند یا از ادیتور) چه target/rel داشته،
 * همیشه مقدار امن رو اجباری ست می‌کنه. این با محدود نکردن target/rel در
 * ALLOWED_ATTR در تناقض نیست: چون از طریق hook اضافه می‌شن، نه چون در
 * ورودی کاربر مجاز بودن.
 */
function ensureLinkSecurityHook() {
  if (linkSecurityHookInstalled) return

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'nofollow noopener noreferrer')
    }
  })

  linkSecurityHookInstalled = true
}

/**
 * پاکسازی سمت فرانت برای description/short_description محصول.
 * این فقط یک لایه‌ی دفاعی UX/دفاع-در-عمق است؛ لایه‌ی امنیتی واقعی
 * سمت بکند (mews/purifier، پروفایل product_description) است.
 */
export function sanitizeDescriptionHtml(html: string): string {
  if (!html) return ''

  ensureLinkSecurityHook()

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })
}

/**
 * خلاصه‌ی متن ساده (بدون تگ) فقط برای پیش‌نمایش UI - جنبه‌ی امنیتی ندارد.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return ''

  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
  const container = document.createElement('div')
  container.innerHTML = clean

  return (container.textContent ?? '').replace(/\s+/g, ' ').trim()
}