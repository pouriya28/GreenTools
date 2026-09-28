import DOMPurify from 'dompurify'

// Must stay in sync with backend whitelist:
// config/purifier.php -> settings.product_description.HTML.Allowed
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

// Forces safe link attributes regardless of what input contained.
// Using a hook (not ALLOWED_ATTR) so target/rel are always overwritten,
// never left up to user-supplied values.
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
 * Front-end sanitization for product description/short_description.
 * This is a UX/defense-in-depth layer only — the real security boundary
 * is the backend (mews/purifier, product_description profile).
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
 * Plain text summary for UI previews — no security role.
 * Uses regex instead of document.createElement so it works in
 * Node/worker environments (tests, SSR).
 */
export function htmlToPlainText(html: string): string {
  if (!html) return ''
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
  return clean.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}