import { describe, it, expect } from 'vitest'
import { categorySchema } from '../schema'

describe('categorySchema', () => {
  const valid = {
    parent_id: null,
    name: 'برق',
    description: null,
    icon: null,
    is_active: true,
    sort_order: 0,
  }

  describe('valid inputs', () => {
    it('accepts minimal valid payload', () => {
      expect(categorySchema.safeParse(valid).success).toBe(true)
    })

    it('accepts parent_id as ULID string', () => {
      const result = categorySchema.safeParse({ ...valid, parent_id: '01HXYZ1234567890ABCDEFGHIJ' })
      expect(result.success).toBe(true)
    })

    it('accepts parent_id as null', () => {
      const result = categorySchema.safeParse({ ...valid, parent_id: null })
      expect(result.success).toBe(true)
    })

    it('accepts full optional fields', () => {
      const result = categorySchema.safeParse({
        ...valid,
        description: 'توضیحات',
        icon: 'mdi-bolt',
        meta_title: 'عنوان',
        meta_description: 'توضیحات متا',
      })
      expect(result.success).toBe(true)
    })

    it('accepts is_active as false', () => {
      expect(categorySchema.safeParse({ ...valid, is_active: false }).success).toBe(true)
    })

    it('accepts sort_order at boundary values (0 and 9999)', () => {
      expect(categorySchema.safeParse({ ...valid, sort_order: 0 }).success).toBe(true)
      expect(categorySchema.safeParse({ ...valid, sort_order: 9999 }).success).toBe(true)
    })
  })

  describe('name validation', () => {
    it('rejects name shorter than 2 characters', () => {
      const result = categorySchema.safeParse({ ...valid, name: 'ب' })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('نام باید حداقل ۲ کاراکتر باشد')
    })

    it('rejects name longer than 150 characters', () => {
      const result = categorySchema.safeParse({ ...valid, name: 'ب'.repeat(151) })
      expect(result.success).toBe(false)
    })

    it('accepts name exactly 2 characters', () => {
      expect(categorySchema.safeParse({ ...valid, name: 'بر' }).success).toBe(true)
    })

    it('accepts name exactly 150 characters', () => {
      expect(categorySchema.safeParse({ ...valid, name: 'ب'.repeat(150) }).success).toBe(true)
    })
  })

  describe('parent_id validation', () => {
    it('rejects parent_id as number (must be string or null)', () => {
      const result = categorySchema.safeParse({ ...valid, parent_id: 123 })
      expect(result.success).toBe(false)
    })
  })

  describe('sort_order validation', () => {
    it('rejects sort_order below 0', () => {
      expect(categorySchema.safeParse({ ...valid, sort_order: -1 }).success).toBe(false)
    })

    it('rejects sort_order above 9999', () => {
      expect(categorySchema.safeParse({ ...valid, sort_order: 10000 }).success).toBe(false)
    })
  })

  describe('optional field length limits', () => {
    it('rejects description longer than 2000 chars', () => {
      expect(categorySchema.safeParse({ ...valid, description: 'ب'.repeat(2001) }).success).toBe(false)
    })

    it('rejects icon longer than 100 chars', () => {
      expect(categorySchema.safeParse({ ...valid, icon: 'x'.repeat(101) }).success).toBe(false)
    })

    it('rejects meta_title longer than 180 chars', () => {
      expect(categorySchema.safeParse({ ...valid, meta_title: 'x'.repeat(181) }).success).toBe(false)
    })

    it('rejects meta_description longer than 300 chars', () => {
      expect(categorySchema.safeParse({ ...valid, meta_description: 'x'.repeat(301) }).success).toBe(false)
    })
  })
})
