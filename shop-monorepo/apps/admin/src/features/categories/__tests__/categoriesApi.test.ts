import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchTrashedCategories,
  restoreCategory,
  forceDeleteCategory,
} from '../api/categoriesApi'
import type { Category } from '../types'

const BASE = '/categories/admin'

const mockCategory: Category = {
  id: '01HXYZ1234567890ABCDEFGHIJ',
  parent_id: null,
  name: 'برق',
  slug: 'bargh',
  description: null,
  image: null,
  icon: null,
  is_active: true,
  sort_order: 0,
  children: [],
  created_at: '2024-01-01T00:00:00Z',
}

const server = setupServer(
  http.get(BASE, () => HttpResponse.json({ data: [mockCategory] })),
  http.post(BASE, () => HttpResponse.json({ data: mockCategory }, { status: 201 })),
  http.patch(`${BASE}/:id`, () => HttpResponse.json({ data: { ...mockCategory, name: 'برق ویرایش‌شده' } })),
  http.delete(`${BASE}/:id`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${BASE}/trash`, () => HttpResponse.json({ data: [mockCategory] })),
  http.post(`${BASE}/:id/restore`, () => HttpResponse.json({ data: mockCategory })),
  http.delete(`${BASE}/:id/force`, () => new HttpResponse(null, { status: 204 })),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('categoriesApi', () => {
  describe('fetchCategories', () => {
    it('returns array of categories', async () => {
      const result = await fetchCategories()
      expect(result).toEqual([mockCategory])
    })
  })

  describe('createCategory', () => {
    it('sends POST and returns created category', async () => {
      const result = await createCategory({
        parent_id: null,
        name: 'برق',
        is_active: true,
        sort_order: 0,
      })
      expect(result.id).toBe(mockCategory.id)
      expect(result.name).toBe('برق')
    })

    it('sends correct payload', async () => {
      let captured: unknown
      server.use(
        http.post(BASE, async ({ request }) => {
          captured = await request.clone().json()
          return HttpResponse.json({ data: mockCategory }, { status: 201 })
        }),
      )
      await createCategory({ parent_id: null, name: 'تست', is_active: false, sort_order: 5 })
      expect(captured).toMatchObject({ name: 'تست', is_active: false, sort_order: 5 })
    })
  })

  describe('updateCategory', () => {
    it('sends PATCH to correct URL and returns updated category', async () => {
      const result = await updateCategory('01HXYZ1234567890ABCDEFGHIJ', { name: 'برق ویرایش‌شده' })
      expect(result.name).toBe('برق ویرایش‌شده')
    })
  })

  describe('deleteCategory', () => {
    it('sends DELETE to correct URL without throwing', async () => {
      await expect(deleteCategory('01HXYZ1234567890ABCDEFGHIJ')).resolves.toBeUndefined()
    })

    it('throws on 404', async () => {
      server.use(
        http.delete(`${BASE}/:id`, () => HttpResponse.json({ message: 'Not Found' }, { status: 404 })),
      )
      await expect(deleteCategory('nonexistent')).rejects.toThrow()
    })
  })

  describe('fetchTrashedCategories', () => {
    it('returns trashed categories', async () => {
      const result = await fetchTrashedCategories()
      expect(result).toEqual([mockCategory])
    })
  })

  describe('restoreCategory', () => {
    it('sends POST to restore endpoint and returns category', async () => {
      const result = await restoreCategory('01HXYZ1234567890ABCDEFGHIJ')
      expect(result.id).toBe(mockCategory.id)
    })
  })

  describe('forceDeleteCategory', () => {
    it('sends DELETE to force endpoint without throwing', async () => {
      await expect(forceDeleteCategory('01HXYZ1234567890ABCDEFGHIJ')).resolves.toBeUndefined()
    })
  })

  describe('error handling', () => {
    it('throws on 422 validation error', async () => {
      server.use(
        http.post(BASE, () =>
          HttpResponse.json(
            { message: 'Validation failed', errors: { name: ['نام تکراری است'] } },
            { status: 422 },
          ),
        ),
      )
      await expect(createCategory({ parent_id: null, name: 'تکراری', is_active: true, sort_order: 0 })).rejects.toThrow()
    })

    it('throws on 403 forbidden', async () => {
      server.use(
        http.delete(`${BASE}/:id`, () =>
          HttpResponse.json({ message: 'Forbidden' }, { status: 403 }),
        ),
      )
      await expect(deleteCategory('01HXYZ')).rejects.toThrow()
    })
  })
})
