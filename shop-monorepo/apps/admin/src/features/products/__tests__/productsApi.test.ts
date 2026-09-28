import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { api } from '@/shared/lib/axios'
import {
  fetchProducts,
  fetchProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleFeaturedProduct,
  fetchTrashedProducts,
  restoreProduct,
  forceDeleteProduct,
  storeProductImages,
  setPrimaryProductImage,
  deleteProductImage,
  deleteProductVideo,
  MAX_IMAGES_PER_UPLOAD,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from '../api/productsApi'

const BASE = '*/products/admin'

const mockProduct = {
  id: '01J8XKZP4Q3R5T6Y7W8V9N0M1K',
  name: 'کابل برق',
  slug: 'cable',
  sku: 'CBL-001',
  price: 1200000,
  price_usd: 29.99,
  final_price: 1200000,
  stock_status: 'in_stock',
  stock_quantity: 10,
  is_active: true,
  is_featured: false,
  purchase_requirement: 'standard',
}

const mockListItem = {
  id: '01J8XKZP4Q3R5T6Y7W8V9N0M1K',
  name: 'کابل برق',
  slug: 'cable',
  sku: 'CBL-001',
  stock_status: 'in_stock',
  purchase_requirement: 'standard',
  is_featured: false,
  purchases_count: 0,
  price: 1200000,
  final_price: 1200000,
  has_active_discount: false,
  discount_percentage: null,
  short_description: null,
  created_at: null,
  category: { id: '01J8', name: 'برق', slug: 'electric' },
  primary_image: null,
}

const mockPaginatedResponse = {
  data: [mockListItem],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
}

describe('productsApi', () => {
  describe('fetchProducts', () => {
    beforeEach(() => {
      server.use(http.get(BASE, () => HttpResponse.json(mockPaginatedResponse)))
    })

    it('returns paginated product list', async () => {
      const result = await fetchProducts({ page: 1 })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe('01J8XKZP4Q3R5T6Y7W8V9N0M1K')
    })

    it('returns pagination meta', async () => {
      const result = await fetchProducts({})
      expect(result.meta.total).toBe(1)
      expect(result.meta.current_page).toBe(1)
    })
  })

  describe('fetchProduct', () => {
    beforeEach(() => {
      server.use(
        http.get(`${BASE}/:id`, () => HttpResponse.json({ data: mockProduct }))
      )
    })

    it('returns single product', async () => {
      const result = await fetchProduct('01J8XKZP4Q3R5T6Y7W8V9N0M1K')
      expect(result.id).toBe('01J8XKZP4Q3R5T6Y7W8V9N0M1K')
      expect(result.name).toBe('کابل برق')
    })
  })

  describe('createProduct', () => {
    beforeEach(() => {
      server.use(
        http.post(BASE, () => HttpResponse.json({ data: mockProduct }, { status: 201 }))
      )
    })

    it('returns created product', async () => {
      const result = await createProduct({
        category_id: '01J8',
        name: 'کابل برق',
        price_usd: 29.99,
        stock_quantity: 10,
        stock_status: 'in_stock',
      })
      expect(result.name).toBe('کابل برق')
    })
  })

  describe('updateProduct', () => {
    beforeEach(() => {
      server.use(
        http.patch(`${BASE}/:id`, () =>
          HttpResponse.json({ data: { ...mockProduct, name: 'کابل برق آپدیت‌شده' } })
        )
      )
    })

    it('returns updated product', async () => {
      const result = await updateProduct('01J8XKZP4Q3R5T6Y7W8V9N0M1K', { name: 'کابل برق آپدیت‌شده' })
      expect(result.name).toBe('کابل برق آپدیت‌شده')
    })
  })

  describe('deleteProduct', () => {
    beforeEach(() => {
      server.use(
        http.delete(`${BASE}/:id`, () => new HttpResponse(null, { status: 204 }))
      )
    })

    it('resolves without error', async () => {
      await expect(deleteProduct('01J8XKZP4Q3R5T6Y7W8V9N0M1K')).resolves.toBeUndefined()
    })
  })

  describe('toggleFeaturedProduct', () => {
    beforeEach(() => {
      server.use(
        http.patch(`${BASE}/:id/toggle-featured`, () =>
          HttpResponse.json({ data: { ...mockProduct, is_featured: true } })
        )
      )
    })

    it('returns product with toggled featured state', async () => {
      const result = await toggleFeaturedProduct('01J8XKZP4Q3R5T6Y7W8V9N0M1K')
      expect(result.is_featured).toBe(true)
    })
  })

  describe('fetchTrashedProducts', () => {
    beforeEach(() => {
      server.use(
        http.get(`${BASE}/trash`, () => HttpResponse.json(mockPaginatedResponse))
      )
    })

    it('returns paginated trashed products', async () => {
      const result = await fetchTrashedProducts(1)
      expect(result.data).toHaveLength(1)
    })
  })

  describe('restoreProduct', () => {
    beforeEach(() => {
      server.use(
        http.post(`${BASE}/:id/restore`, () => HttpResponse.json({ data: mockProduct }))
      )
    })

    it('returns restored product', async () => {
      const result = await restoreProduct('01J8XKZP4Q3R5T6Y7W8V9N0M1K')
      expect(result.id).toBe('01J8XKZP4Q3R5T6Y7W8V9N0M1K')
    })
  })

  describe('forceDeleteProduct', () => {
    beforeEach(() => {
      server.use(
        http.delete(`${BASE}/:id/force`, () => new HttpResponse(null, { status: 204 }))
      )
    })

    it('resolves without error', async () => {
      await expect(forceDeleteProduct('01J8XKZP4Q3R5T6Y7W8V9N0M1K')).resolves.toBeUndefined()
    })
  })

  describe('image constants — client-side guard values', () => {
    it('MAX_IMAGES_PER_UPLOAD is 10', () => {
      expect(MAX_IMAGES_PER_UPLOAD).toBe(10)
    })

    it('MAX_IMAGE_SIZE_BYTES is 5 MB', () => {
      expect(MAX_IMAGE_SIZE_BYTES).toBe(5120 * 1024)
    })

    it('ALLOWED_IMAGE_TYPES includes jpeg, png, webp', () => {
      expect(ALLOWED_IMAGE_TYPES).toContain('image/jpeg')
      expect(ALLOWED_IMAGE_TYPES).toContain('image/png')
      expect(ALLOWED_IMAGE_TYPES).toContain('image/webp')
    })

    it('ALLOWED_IMAGE_TYPES does not include gif or svg', () => {
      expect(ALLOWED_IMAGE_TYPES).not.toContain('image/gif')
      expect(ALLOWED_IMAGE_TYPES).not.toContain('image/svg+xml')
    })
  })

  describe('storeProductImages', () => {
    it('sends multipart request and returns image array', async () => {
      // jsdom File + MSW FormData serialization incompatibility — use vi.spyOn
      const postSpy = vi
        .spyOn(api, 'post')
        .mockResolvedValueOnce({ data: { data: [] } } as never)

      const file = new File([], 'test.jpg', { type: 'image/jpeg' })
      const result = await storeProductImages('01J8', [file], ['تصویر اصلی'])

      expect(postSpy).toHaveBeenCalledWith(
        expect.stringContaining('/images'),
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
      )
      expect(result).toEqual([])
      postSpy.mockRestore()
    })
  })

  describe('setPrimaryProductImage', () => {
    beforeEach(() => {
      server.use(
        http.patch(`${BASE}/:productId/images/:imageId/primary`, () =>
          new HttpResponse(null, { status: 204 })
        )
      )
    })

    it('resolves without error', async () => {
      await expect(setPrimaryProductImage('01J8PRODUCT', 1)).resolves.toBeUndefined()
    })
  })

  describe('deleteProductImage', () => {
    beforeEach(() => {
      server.use(
        http.delete(`${BASE}/:productId/images/:imageId`, () =>
          new HttpResponse(null, { status: 204 })
        )
      )
    })

    it('resolves without error', async () => {
      await expect(deleteProductImage('01J8PRODUCT', 1)).resolves.toBeUndefined()
    })
  })

  describe('deleteProductVideo', () => {
    beforeEach(() => {
      server.use(
        http.delete(`${BASE}/:productId/videos/:videoId`, () =>
          new HttpResponse(null, { status: 204 })
        )
      )
    })

    it('resolves without error', async () => {
      await expect(deleteProductVideo('01J8PRODUCT', 1)).resolves.toBeUndefined()
    })
  })

  describe('error handling', () => {
    it('throws on 404', async () => {
      server.use(
        http.get(`${BASE}/:id`, () =>
          HttpResponse.json({ message: 'یافت نشد', code: 'NOT_FOUND' }, { status: 404 })
        )
      )
      await expect(fetchProduct('invalid-id')).rejects.toThrow()
    })

    it('throws on 403', async () => {
      server.use(
        http.delete(`${BASE}/:id`, () =>
          HttpResponse.json({ message: 'دسترسی ندارید', code: 'FORBIDDEN' }, { status: 403 })
        )
      )
      await expect(deleteProduct('01J8')).rejects.toThrow()
    })
  })
})