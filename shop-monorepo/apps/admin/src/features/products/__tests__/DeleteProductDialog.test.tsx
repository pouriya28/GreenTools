import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { DeleteProductDialog } from '../components/DeleteProductDialog'
import { ForceDeleteProductDialog } from '../components/ForceDeleteProductDialog'
import type { ProductListItem } from '../types'

const mockDeleteMutateAsync = vi.fn()
const mockForceDeleteMutateAsync = vi.fn()

vi.mock('../hooks/useProductMutations', () => ({
  useDeleteProduct: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
  useForceDeleteProduct: () => ({
    mutateAsync: mockForceDeleteMutateAsync,
    isPending: false,
  }),
}))

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
  category: { id: '01J8', name: 'برق', slug: 'electric' },
  primary_image: null,
}

// Creates an AxiosError with a backend message so getApiErrorMessage returns it
function makeServerError(message: string, status = 500) {
  const error = new AxiosError('Request failed')
  error.response = {
    status,
    data: { message, code: 'SERVER_ERROR' },
    headers: {},
    config: {} as never,
    statusText: String(status),
  }
  return error
}

// ─── DeleteProductDialog ───────────────────────────────────────────────────

describe('DeleteProductDialog', () => {
  const onOpenChange = vi.fn()

  function setup(open = true) {
    const user = userEvent.setup()
    const result = render(
      <DeleteProductDialog
        product={mockProduct}
        open={open}
        onOpenChange={onOpenChange}
      />
    )
    return { user, ...result }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteMutateAsync.mockResolvedValue(undefined)
  })

  describe('rendering', () => {
    it('shows product name in description', () => {
      setup()
      expect(screen.getByText(/کابل برق صنعتی/)).toBeInTheDocument()
    })

    it('shows soft-delete notice', () => {
      setup()
      expect(screen.getByText(/سطل‌زباله/)).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      setup(false)
      expect(screen.queryByText('حذف محصول')).not.toBeInTheDocument()
    })
  })

  describe('confirm', () => {
    it('calls mutateAsync with product id on confirm', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'حذف' }))
      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith('01J8XKZP4Q3R5T6Y7W8V9N0M1K')
      })
    })

    it('closes dialog after successful delete', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'حذف' }))
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('cancel', () => {
    it('calls onOpenChange(false) on cancel', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'انصراف' }))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('error handling', () => {
    it('shows error message when mutation fails', async () => {
      mockDeleteMutateAsync.mockRejectedValueOnce(
        makeServerError('حذف محصول ناموفق بود.')
      )
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'حذف' }))
      await waitFor(() => {
        expect(screen.getByText('حذف محصول ناموفق بود.')).toBeInTheDocument()
      })
    })

    it('does not close dialog on error', async () => {
      mockDeleteMutateAsync.mockRejectedValueOnce(makeServerError('خطا'))
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'حذف' }))
      await waitFor(() => {
        expect(screen.getByText('خطا')).toBeInTheDocument()
      })
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
    })

    it('clears error when dialog reopens', async () => {
      mockDeleteMutateAsync.mockRejectedValueOnce(makeServerError('خطا'))
      const { user, rerender } = setup()
      await user.click(screen.getByRole('button', { name: 'حذف' }))
      await waitFor(() => {
        expect(screen.getByText('خطا')).toBeInTheDocument()
      })
      rerender(<DeleteProductDialog product={mockProduct} open={false} onOpenChange={onOpenChange} />)
      act(() => {})
      rerender(<DeleteProductDialog product={mockProduct} open={true} onOpenChange={onOpenChange} />)
      await waitFor(() => {
        expect(screen.queryByText('خطا')).not.toBeInTheDocument()
      })
    })
  })
})

// ─── ForceDeleteProductDialog ──────────────────────────────────────────────

describe('ForceDeleteProductDialog', () => {
  const onOpenChange = vi.fn()

  function setup(open = true) {
    const user = userEvent.setup()
    const result = render(
      <ForceDeleteProductDialog
        product={mockProduct}
        open={open}
        onOpenChange={onOpenChange}
      />
    )
    return { user, ...result }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockForceDeleteMutateAsync.mockResolvedValue(undefined)
  })

  describe('rendering', () => {
    it('shows product name', () => {
      setup()
      expect(screen.getAllByText(/کابل برق صنعتی/).length).toBeGreaterThan(0)
    })

    it('shows irreversible warning', () => {
      setup()
      expect(screen.getByText(/برگشت‌ناپذیر/)).toBeInTheDocument()
    })

    it('renders confirmation input', () => {
      setup()
      expect(screen.getByLabelText(/نام محصول/)).toBeInTheDocument()
    })
  })

  describe('confirm button state', () => {
    it('is disabled when input is empty', () => {
      setup()
      expect(screen.getByRole('button', { name: 'حذف قطعی' })).toBeDisabled()
    })

    it('is disabled when input does not match product name', async () => {
      const { user } = setup()
      await user.type(screen.getByLabelText(/نام محصول/), 'اشتباه')
      expect(screen.getByRole('button', { name: 'حذف قطعی' })).toBeDisabled()
    })

    it('is disabled for partial match', async () => {
      const { user } = setup()
      await user.type(screen.getByLabelText(/نام محصول/), 'کابل برق')
      expect(screen.getByRole('button', { name: 'حذف قطعی' })).toBeDisabled()
    })

    it('is enabled when input matches product name exactly', async () => {
      const { user } = setup()
      await user.type(screen.getByLabelText(/نام محصول/), 'کابل برق صنعتی')
      expect(screen.getByRole('button', { name: 'حذف قطعی' })).not.toBeDisabled()
    })
  })

  describe('confirm', () => {
    it('calls mutateAsync with product id when name matches', async () => {
      const { user } = setup()
      await user.type(screen.getByLabelText(/نام محصول/), 'کابل برق صنعتی')
      await user.click(screen.getByRole('button', { name: 'حذف قطعی' }))
      await waitFor(() => {
        expect(mockForceDeleteMutateAsync).toHaveBeenCalledWith('01J8XKZP4Q3R5T6Y7W8V9N0M1K')
      })
    })

    it('closes dialog after successful force delete', async () => {
      const { user } = setup()
      await user.type(screen.getByLabelText(/نام محصول/), 'کابل برق صنعتی')
      await user.click(screen.getByRole('button', { name: 'حذف قطعی' }))
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('error handling', () => {
    it('shows error message when force delete fails', async () => {
      mockForceDeleteMutateAsync.mockRejectedValueOnce(
        makeServerError('حذف قطعی ناموفق بود.')
      )
      const { user } = setup()
      await user.type(screen.getByLabelText(/نام محصول/), 'کابل برق صنعتی')
      await user.click(screen.getByRole('button', { name: 'حذف قطعی' }))
      await waitFor(() => {
        expect(screen.getByText('حذف قطعی ناموفق بود.')).toBeInTheDocument()
      })
    })
  })

  describe('reset on reopen', () => {
    it('clears input when dialog reopens', async () => {
      const { user, rerender } = setup()
      await user.type(screen.getByLabelText(/نام محصول/), 'کابل برق صنعتی')
      rerender(<ForceDeleteProductDialog product={mockProduct} open={false} onOpenChange={onOpenChange} />)
      rerender(<ForceDeleteProductDialog product={mockProduct} open={true} onOpenChange={onOpenChange} />)
      await waitFor(() => {
        expect(screen.getByLabelText(/نام محصول/)).toHaveValue('')
      })
    })
  })
})