import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductFilters } from '../components/ProductFilters'
import type { ProductFilters as ProductFiltersValue } from '../types'
import type { CategoryOption } from '../utils'

const mockCategories: CategoryOption[] = [
  { id: '01J8CAT000000000000000001', name: 'برق', depth: 0 },
  { id: '01J8CAT000000000000000002', name: 'کابل', depth: 1 },
]

const defaultFilters: ProductFiltersValue = {}
const onChange = vi.fn()

function setup(filters = defaultFilters) {
  const user = userEvent.setup()
  const result = render(
    <ProductFilters filters={filters} categoryOptions={mockCategories} onChange={onChange} />
  )
  return { user, ...result }
}

describe('ProductFilters', () => {
  describe('rendering', () => {
    it('renders four filter selects', () => {
      setup()
      expect(screen.getAllByRole('combobox')).toHaveLength(4)
    })

    it('renders category filter combobox', () => {
      setup()
      // combobox وجود دارد و قابل دسترس است
      expect(screen.getAllByRole('combobox')[0]).toBeInTheDocument()
    })
  })

  describe('category filter', () => {
    it('calls onChange with string ULID (not Number) when category selected', async () => {
      const { user } = setup()
      await user.click(screen.getAllByRole('combobox')[0])
      await user.click(screen.getByText('برق'))
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ category_id: '01J8CAT000000000000000001' })
      )
      // Must NOT be converted to Number (NaN for ULID)
      const call = onChange.mock.calls[0][0]
      expect(typeof call.category_id).toBe('string')
    })

    it('calls onChange with undefined when "همه" selected', async () => {
      const { user } = setup({ category_id: '01J8CAT000000000000000001' })
      await user.click(screen.getAllByRole('combobox')[0])
      await user.click(screen.getByText('همه‌ی دسته‌بندی‌ها'))
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ category_id: undefined })
      )
    })
  })

  describe('stock status filter', () => {
    it('calls onChange with correct stock_status', async () => {
      const { user } = setup()
      await user.click(screen.getAllByRole('combobox')[1])
      await user.click(screen.getByText('موجود'))
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ stock_status: 'in_stock' })
      )
    })

    it('calls onChange with undefined when all selected', async () => {
      const { user } = setup({ stock_status: 'in_stock' })
      await user.click(screen.getAllByRole('combobox')[1])
      await user.click(screen.getByText('همه‌ی وضعیت‌ها'))
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ stock_status: undefined })
      )
    })
  })

  describe('is_active filter', () => {
    it('calls onChange with true for "فعال"', async () => {
      const { user } = setup()
      await user.click(screen.getAllByRole('combobox')[2])
      await user.click(screen.getByText('فعال'))
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true })
      )
    })

    it('calls onChange with false for "غیرفعال"', async () => {
      const { user } = setup()
      await user.click(screen.getAllByRole('combobox')[2])
      await user.click(screen.getByText('غیرفعال'))
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false })
      )
    })

    it('calls onChange with undefined when "همه" selected', async () => {
      const { user } = setup({ is_active: true })
      await user.click(screen.getAllByRole('combobox')[2])
      await user.click(screen.getAllByText('همه')[0])
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: undefined })
      )
    })
  })

  describe('sort filter', () => {
    it('calls onChange with correct sort value', async () => {
      const { user } = setup()
      await user.click(screen.getAllByRole('combobox')[3])
      await user.click(screen.getByText('ارزان‌ترین قیمت'))
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'price_asc' })
      )
    })
  })
})