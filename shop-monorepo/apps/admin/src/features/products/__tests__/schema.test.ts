import { describe, it, expect } from 'vitest'
import { productSchema } from '../schema'

const validBase = {
  category_id: '01J8XKZP4Q3R5T6Y7W8V9N0M1K',
  name: 'کابل برق صنعتی',
  sku: 'CBL-001',
  price_usd: 29.99,
  stock_quantity: 100,
  stock_status: 'in_stock' as const,
  is_active: true,
  purchase_requirement: 'standard' as const,
  support_contact_enabled: false,
  purchase_confirmation_required: false,
}

describe('productSchema', () => {
  describe('valid data', () => {
    it('passes with minimal valid data', () => {
      expect(productSchema.safeParse(validBase).success).toBe(true)
    })

    it('passes with all optional fields filled', () => {
      const result = productSchema.safeParse({
        ...validBase,
        short_description: 'توضیح کوتاه',
        description: '<p>توضیح کامل</p>',
        discount_type: 'percent',
        discount_value: 10,
        discount_starts_at: '2025-01-01',
        discount_ends_at: '2025-12-31',
        weight_grams: 500,
        meta_title: 'عنوان سئو',
        meta_description: 'توضیح سئو',
        purchase_requirement: 'technical_consultation',
        technical_notice: 'نیاز به مشاوره فنی دارد',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('name validation', () => {
    it('rejects name shorter than 2 characters', () => {
      const result = productSchema.safeParse({ ...validBase, name: 'ک' })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('name')
    })

    it('rejects name longer than 200 characters', () => {
      const result = productSchema.safeParse({ ...validBase, name: 'ک'.repeat(201) })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('name')
    })

    it('accepts name with exactly 2 characters', () => {
      expect(productSchema.safeParse({ ...validBase, name: 'کا' }).success).toBe(true)
    })

    it('accepts name with exactly 200 characters', () => {
      expect(productSchema.safeParse({ ...validBase, name: 'ک'.repeat(200) }).success).toBe(true)
    })
  })

  describe('SKU validation', () => {
    it('accepts valid SKU with letters, numbers, dash, underscore', () => {
      expect(productSchema.safeParse({ ...validBase, sku: 'CBL-001_X' }).success).toBe(true)
    })

    it('rejects SKU with Persian characters', () => {
      const result = productSchema.safeParse({ ...validBase, sku: 'کابل-۱' })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('sku')
    })

    it('rejects SKU with spaces', () => {
      const result = productSchema.safeParse({ ...validBase, sku: 'CBL 001' })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('sku')
    })

    it('rejects SKU with special characters', () => {
      const result = productSchema.safeParse({ ...validBase, sku: 'CBL@001' })
      expect(result.success).toBe(false)
    })

    it('accepts empty SKU', () => {
      expect(productSchema.safeParse({ ...validBase, sku: '' }).success).toBe(true)
    })

    it('rejects SKU longer than 64 characters', () => {
      const result = productSchema.safeParse({ ...validBase, sku: 'A'.repeat(65) })
      expect(result.success).toBe(false)
    })
  })

  describe('price_usd validation', () => {
    it('rejects price of 0', () => {
      const result = productSchema.safeParse({ ...validBase, price_usd: 0 })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('price_usd')
    })

    it('rejects negative price', () => {
      const result = productSchema.safeParse({ ...validBase, price_usd: -1 })
      expect(result.success).toBe(false)
    })

    it('rejects price above 999999.99', () => {
      const result = productSchema.safeParse({ ...validBase, price_usd: 1000000 })
      expect(result.success).toBe(false)
    })

    it('accepts minimum price of 0.01', () => {
      expect(productSchema.safeParse({ ...validBase, price_usd: 0.01 }).success).toBe(true)
    })

    it('accepts maximum price of 999999.99', () => {
      expect(productSchema.safeParse({ ...validBase, price_usd: 999999.99 }).success).toBe(true)
    })
  })

  describe('stock_quantity validation', () => {
    it('rejects negative stock', () => {
      const result = productSchema.safeParse({ ...validBase, stock_quantity: -1 })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('stock_quantity')
    })

    it('rejects non-integer stock', () => {
      const result = productSchema.safeParse({ ...validBase, stock_quantity: 1.5 })
      expect(result.success).toBe(false)
    })

    it('accepts zero stock', () => {
      expect(productSchema.safeParse({ ...validBase, stock_quantity: 0 }).success).toBe(true)
    })

    it('accepts max stock of 1000000', () => {
      expect(productSchema.safeParse({ ...validBase, stock_quantity: 1000000 }).success).toBe(true)
    })

    it('rejects stock above 1000000', () => {
      const result = productSchema.safeParse({ ...validBase, stock_quantity: 1000001 })
      expect(result.success).toBe(false)
    })
  })

  describe('stock_status enum', () => {
    it('accepts in_stock', () => {
      expect(productSchema.safeParse({ ...validBase, stock_status: 'in_stock' }).success).toBe(true)
    })

    it('accepts out_of_stock', () => {
      expect(productSchema.safeParse({ ...validBase, stock_status: 'out_of_stock' }).success).toBe(true)
    })

    it('accepts preorder', () => {
      expect(productSchema.safeParse({ ...validBase, stock_status: 'preorder' }).success).toBe(true)
    })

    it('rejects invalid stock_status', () => {
      const result = productSchema.safeParse({ ...validBase, stock_status: 'discontinued' })
      expect(result.success).toBe(false)
    })
  })

  describe('discount superRefine', () => {
    it('requires discount_value when discount_type is set', () => {
      const result = productSchema.safeParse({
        ...validBase,
        discount_type: 'percent',
        discount_value: null,
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('discount_value')
      expect(result.error?.issues[0].message).toBe('مقدار تخفیف را وارد کنید')
    })

    it('rejects percent discount above 100', () => {
      const result = productSchema.safeParse({
        ...validBase,
        discount_type: 'percent',
        discount_value: 101,
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('discount_value')
      expect(result.error?.issues[0].message).toBe('درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد')
    })

    it('accepts percent discount of exactly 100', () => {
      expect(productSchema.safeParse({
        ...validBase,
        discount_type: 'percent',
        discount_value: 100,
      }).success).toBe(true)
    })

    it('accepts percent discount of 0', () => {
      expect(productSchema.safeParse({
        ...validBase,
        discount_type: 'percent',
        discount_value: 0,
      }).success).toBe(true)
    })

    it('allows fixed discount above 100', () => {
      expect(productSchema.safeParse({
        ...validBase,
        discount_type: 'fixed',
        discount_value: 500,
      }).success).toBe(true)
    })

    it('rejects discount_ends_at before discount_starts_at', () => {
      const result = productSchema.safeParse({
        ...validBase,
        discount_type: 'percent',
        discount_value: 10,
        discount_starts_at: '2025-12-31',
        discount_ends_at: '2025-01-01',
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('discount_ends_at')
      expect(result.error?.issues[0].message).toBe('تاریخ پایان تخفیف باید بعد از تاریخ شروع باشد')
    })

    it('rejects equal discount start and end dates', () => {
      const result = productSchema.safeParse({
        ...validBase,
        discount_type: 'percent',
        discount_value: 10,
        discount_starts_at: '2025-06-01',
        discount_ends_at: '2025-06-01',
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('discount_ends_at')
    })

    it('passes when no discount_type is set', () => {
      expect(productSchema.safeParse({
        ...validBase,
        discount_type: null,
        discount_value: null,
      }).success).toBe(true)
    })

    it('ignores discount dates when only one is provided', () => {
      expect(productSchema.safeParse({
        ...validBase,
        discount_type: 'percent',
        discount_value: 20,
        discount_starts_at: '2025-01-01',
        discount_ends_at: null,
      }).success).toBe(true)
    })
  })

  describe('purchase_requirement enum', () => {
    const validValues = [
      'standard',
      'technical_consultation',
      'professional_installation',
      'restricted',
    ] as const

    validValues.forEach((v) => {
      it(`accepts purchase_requirement: ${v}`, () => {
        expect(productSchema.safeParse({ ...validBase, purchase_requirement: v }).success).toBe(true)
      })
    })

    it('rejects invalid purchase_requirement', () => {
      const result = productSchema.safeParse({ ...validBase, purchase_requirement: 'vip_only' })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('purchase_requirement')
    })
  })

  describe('attributes', () => {
    it('defaults attributes to empty array', () => {
      const result = productSchema.safeParse(validBase)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.attributes).toEqual([])
      }
    })

    it('accepts valid attribute entries', () => {
      const result = productSchema.safeParse({
        ...validBase,
        attributes: [
          { attribute_id: '01J8XKZP4Q3R5T6Y7W8V9N0M1K', name: 'رنگ', unit: null, value: 'آبی' },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('rejects attribute with empty value', () => {
      const result = productSchema.safeParse({
        ...validBase,
        attributes: [{ value: '' }],
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('مقدار را وارد کنید')
    })
  })

  describe('optional text fields length', () => {
    it('rejects short_description longer than 500 characters', () => {
      const result = productSchema.safeParse({
        ...validBase,
        short_description: 'ک'.repeat(501),
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('short_description')
    })

    it('rejects description longer than 20000 characters', () => {
      const result = productSchema.safeParse({
        ...validBase,
        description: 'ک'.repeat(20001),
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('description')
    })

    it('rejects meta_title longer than 180 characters', () => {
      const result = productSchema.safeParse({
        ...validBase,
        meta_title: 'ک'.repeat(181),
      })
      expect(result.success).toBe(false)
    })

    it('rejects meta_description longer than 300 characters', () => {
      const result = productSchema.safeParse({
        ...validBase,
        meta_description: 'ک'.repeat(301),
      })
      expect(result.success).toBe(false)
    })
  })
})