import { describe, it, expect } from 'vitest'
import { sanitizeDescriptionHtml, htmlToPlainText } from '../utils/sanitizeDescriptionHtml'

describe('sanitizeDescriptionHtml', () => {
  describe('empty / falsy input', () => {
    it('returns empty string for empty string', () => {
      expect(sanitizeDescriptionHtml('')).toBe('')
    })
  })

  describe('allowed tags are preserved', () => {
    it('keeps <p> tags', () => {
      expect(sanitizeDescriptionHtml('<p>متن</p>')).toContain('<p>')
    })

    it('keeps <strong>, <em>, <u>', () => {
      const result = sanitizeDescriptionHtml('<p><strong>bold</strong> <em>italic</em> <u>underline</u></p>')
      expect(result).toContain('<strong>')
      expect(result).toContain('<em>')
      expect(result).toContain('<u>')
    })

    it('keeps heading tags h2, h3, h4', () => {
      const result = sanitizeDescriptionHtml('<h2>عنوان</h2><h3>زیر</h3><h4>ریز</h4>')
      expect(result).toContain('<h2>')
      expect(result).toContain('<h3>')
      expect(result).toContain('<h4>')
    })

    it('keeps list tags ul, ol, li', () => {
      const result = sanitizeDescriptionHtml('<ul><li>آیتم</li></ul>')
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>')
    })

    it('keeps table structure', () => {
      const result = sanitizeDescriptionHtml('<table><thead><tr><th>سر</th></tr></thead><tbody><tr><td>داده</td></tr></tbody></table>')
      expect(result).toContain('<table>')
      expect(result).toContain('<th>')
      expect(result).toContain('<td>')
    })
  })

  describe('disallowed tags are removed', () => {
    it('strips <script> tags and content', () => {
      const result = sanitizeDescriptionHtml('<p>متن</p><script>alert("xss")</script>')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('strips <iframe>', () => {
      const result = sanitizeDescriptionHtml('<iframe src="evil.com"></iframe>')
      expect(result).not.toContain('<iframe>')
    })

    it('strips <img>', () => {
      const result = sanitizeDescriptionHtml('<img src="x" onerror="alert(1)">')
      expect(result).not.toContain('<img>')
    })

    it('strips <h1> (not in allowed list)', () => {
      const result = sanitizeDescriptionHtml('<h1>عنوان اصلی</h1>')
      expect(result).not.toContain('<h1>')
    })

    it('strips <div>', () => {
      const result = sanitizeDescriptionHtml('<div class="wrapper">محتوا</div>')
      expect(result).not.toContain('<div>')
    })
  })

  describe('XSS attack vectors', () => {
    it('strips onclick attributes', () => {
      const result = sanitizeDescriptionHtml('<p onclick="alert(1)">متن</p>')
      expect(result).not.toContain('onclick')
    })

    it('strips onerror on any tag', () => {
      const result = sanitizeDescriptionHtml('<a href="x" onerror="alert(1)">لینک</a>')
      expect(result).not.toContain('onerror')
    })

    it('strips javascript: protocol in href', () => {
      const result = sanitizeDescriptionHtml('<a href="javascript:alert(1)">کلیک</a>')
      expect(result).not.toContain('javascript:')
    })

    it('strips data: URIs', () => {
      const result = sanitizeDescriptionHtml('<a href="data:text/html,<script>alert(1)</script>">لینک</a>')
      expect(result).not.toContain('data:')
    })
  })

  describe('link security hook', () => {
    it('adds target=_blank to all links', () => {
      const result = sanitizeDescriptionHtml('<a href="https://example.com">لینک</a>')
      expect(result).toContain('target="_blank"')
    })

    it('adds rel=nofollow noopener noreferrer to all links', () => {
      const result = sanitizeDescriptionHtml('<a href="https://example.com">لینک</a>')
      expect(result).toContain('nofollow')
      expect(result).toContain('noopener')
      expect(result).toContain('noreferrer')
    })

    it('overwrites existing unsafe rel attribute', () => {
      const result = sanitizeDescriptionHtml('<a href="https://example.com" rel="follow">لینک</a>')
      expect(result).toContain('nofollow')
      expect(result).not.toMatch(/rel="follow"/)
    })

    it('overwrites existing target attribute', () => {
      const result = sanitizeDescriptionHtml('<a href="https://example.com" target="_self">لینک</a>')
      expect(result).toContain('target="_blank"')
      expect(result).not.toContain('target="_self"')
    })

    it('keeps href and title attributes on links', () => {
      const result = sanitizeDescriptionHtml('<a href="https://example.com" title="راهنما">لینک</a>')
      expect(result).toContain('href="https://example.com"')
      expect(result).toContain('title="راهنما"')
    })
  })
})

describe('htmlToPlainText', () => {
  it('returns empty string for empty input', () => {
    expect(htmlToPlainText('')).toBe('')
  })

  it('strips all HTML tags', () => {
    const result = htmlToPlainText('<p><strong>متن</strong> ساده</p>')
    expect(result).toBe('متن ساده')
    expect(result).not.toContain('<')
  })

  it('normalizes multiple whitespace to single space', () => {
    const result = htmlToPlainText('<p>کلمه    اول</p><p>کلمه   دوم</p>')
    expect(result).not.toMatch(/\s{2,}/)
  })

  it('strips script content too', () => {
    const result = htmlToPlainText('<script>evil()</script><p>محتوا</p>')
    expect(result).not.toContain('evil')
  })

  it('returns trimmed text', () => {
    const result = htmlToPlainText('  <p>متن</p>  ')
    expect(result).toBe('متن')
  })
})