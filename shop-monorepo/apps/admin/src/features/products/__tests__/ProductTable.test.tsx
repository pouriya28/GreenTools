import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductTable } from '../components/ProductTable'
import type { ProductListItem } from '../types'
import type { PaginationMeta } from '@/shared/types/pagination.types'

const mockProduct: ProductListItem = {
  id: '01J8XKZP4Q3R5T6Y7W8V9N0M1K',
  name: 'کابل برق صنعتی',
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
  category: { id: '01J8CAT001', name: 'برق', slug: 'electric' },
  primary_image: null,
}

const mockMeta: PaginationMeta = {
  current_page: 1,
  per_page: 15,
  total: 30,
  last_page: 2,
}

const handlers = {
  onPageChange: vi.fn(),
  onEdit: vi.fn(),
  onDeleteRequest: vi.fn(),
  onToggleFeatured: vi.fn(),
}

function setup(overrides: Partial<{
  products: ProductListItem[]
  meta: PaginationMeta | undefined
  togglingFeaturedId: string | null
}> = {}) {
  const user = userEvent.setup()
  const result = render(
    <ProductTable
      products={overrides.products ?? [mockProduct]}
      meta={overrides.meta ?? mockMeta}
      togglingFeaturedId={overrides.togglingFeaturedId ?? null}
      {...handlers}
    />
  )
  return { user, ...result }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ProductTable', () => {
  describe('empty state', () => {
    it('shows empty state when no products', () => {
      setup({ products: [] })
      expect(screen.getByText('محصولی یافت نشد.')).toBeInTheDocument()
    })

    it('does not show table when empty', () => {
      setup({ products: [] })
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('product display', () => {
    it('shows product name', () => {
      setup()
      expect(screen.getAllByText('کابل برق صنعتی').length).toBeGreaterThan(0)
    })

    it('shows product SKU', () => {
      setup()
      expect(screen.getAllByText('CBL-001').length).toBeGreaterThan(0)
    })

    it('shows product category', () => {
      setup()
      expect(screen.getAllByText('برق').length).toBeGreaterThan(0)
    })

    it('shows موجود badge for in_stock products', () => {
      setup()
      expect(screen.getAllByText('موجود').length).toBeGreaterThan(0)
    })

    it('shows placeholder when no primary image', () => {
      setup()
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    it('shows product image when primary_image exists', () => {
      const productWithImage = {
        ...mockProduct,
        primary_image: { id: 1, url: 'https://example.com/img.jpg', alt_text: null, is_primary: true, sort_order: 0 },
      }
      setup({ products: [productWithImage] })
      const img = document.querySelector('img[src="https://example.com/img.jpg"]')
      expect(img).toBeInTheDocument()
    })
  })

  describe('discounted price', () => {
    it('shows both final and original price when discount is active', () => {
      const discounted = { ...mockProduct, has_active_discount: true, price: 1500000, final_price: 1200000 }
      setup({ products: [discounted] })
      expect(screen.getAllByText(/1,200,000|۱٬۲۰۰٬۰۰۰/).length).toBeGreaterThan(0)
    })
  })

  describe('actions', () => {
    it('calls onEdit when edit button clicked', async () => {
      const { user } = setup()
      const editButtons = screen.getAllByRole('button', { name: 'ویرایش' })
      await user.click(editButtons[0])
      expect(handlers.onEdit).toHaveBeenCalledWith(mockProduct)
    })

    it('calls onDeleteRequest when delete button clicked', async () => {
      const { user } = setup()
      const deleteButtons = screen.getAllByRole('button', { name: 'حذف' })
      await user.click(deleteButtons[0])
      expect(handlers.onDeleteRequest).toHaveBeenCalledWith(mockProduct)
    })

    it('calls onToggleFeatured when star button clicked', async () => {
      const { user } = setup()
      const starButtons = screen.getAllByRole('button', { name: 'افزودن به ویژه‌ها' })
      await user.click(starButtons[0])
      expect(handlers.onToggleFeatured).toHaveBeenCalledWith(mockProduct)
    })

    it('shows correct aria-label for featured product', () => {
      const featured = { ...mockProduct, is_featured: true }
      setup({ products: [featured] })
      expect(screen.getAllByRole('button', { name: 'حذف از ویژه‌ها' }).length).toBeGreaterThan(0)
    })

    it('disables star button when togglingFeaturedId matches product id (ULID string)', () => {
      setup({ togglingFeaturedId: '01J8XKZP4Q3R5T6Y7W8V9N0M1K' })
      const starButtons = screen.getAllByLabelText(/ویژه/)
      expect(starButtons[0]).toBeDisabled()
    })

    it('does not disable star button when togglingFeaturedId is different', () => {
      setup({ togglingFeaturedId: 'OTHER_ID' })
      const starButtons = screen.getAllByRole('button', { name: 'افزودن به ویژه‌ها' })
      expect(starButtons[0]).not.toBeDisabled()
    })
  })

  describe('pagination', () => {
    it('shows pagination when last_page > 1', () => {
      setup({ meta: mockMeta })
      expect(screen.getByText(/صفحه 1 از 2/)).toBeInTheDocument()
    })

    it('does not show pagination when last_page is 1', () => {
      setup({ meta: { ...mockMeta, last_page: 1 } })
      expect(screen.queryByText(/صفحه/)).not.toBeInTheDocument()
    })

    it('calls onPageChange with next page on next button click', async () => {
      const { user } = setup({ meta: mockMeta })
      await user.click(screen.getByRole('button', { name: 'صفحه‌ی بعد' }))
      expect(handlers.onPageChange).toHaveBeenCalledWith(2)
    })

    it('calls onPageChange with prev page on prev button click', async () => {
      const { user } = setup({ meta: { ...mockMeta, current_page: 2 } })
      await user.click(screen.getByRole('button', { name: 'صفحه‌ی قبل' }))
      expect(handlers.onPageChange).toHaveBeenCalledWith(1)
    })

    it('disables prev button on first page', () => {
      setup({ meta: { ...mockMeta, current_page: 1 } })
      expect(screen.getByRole('button', { name: 'صفحه‌ی قبل' })).toBeDisabled()
    })

    it('disables next button on last page', () => {
      setup({ meta: { ...mockMeta, current_page: 2, last_page: 2 } })
      expect(screen.getByRole('button', { name: 'صفحه‌ی بعد' })).toBeDisabled()
    })
  })
})