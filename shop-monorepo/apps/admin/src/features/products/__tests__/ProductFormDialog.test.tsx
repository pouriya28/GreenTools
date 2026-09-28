import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { ProductFormDialog } from '../components/ProductFormDialog'

const mockCreateMutateAsync = vi.fn()
const mockUpdateMutateAsync = vi.fn()

vi.mock('../hooks/useProductMutations', () => ({
  useCreateProduct: () => ({ mutateAsync: mockCreateMutateAsync, isPending: false }),
  useUpdateProduct: () => ({ mutateAsync: mockUpdateMutateAsync, isPending: false }),
}))

vi.mock('../hooks/useProduct', () => ({
  useProduct: (id: string | null) => ({
    data: id ? mockExistingProduct : undefined,
    isLoading: false,
  }),
}))

vi.mock('@/features/categories/hooks/useCategories', () => ({
  useCategories: () => ({ data: mockCategories, isError: false }),
}))

vi.mock('../components/form/ProductBasicInfoFields', () => ({
  ProductBasicInfoFields: ({ form }: { form: { register: (name: string, opts?: object) => object } }) => (
    <div data-testid="basic-info-fields">
      <input data-testid="name-input" aria-label="نام محصول" {...form.register('name')} />
      <input data-testid="price-input" aria-label="قیمت دلاری" type="number" {...form.register('price_usd', { valueAsNumber: true })} />
    </div>
  ),
}))

vi.mock('../components/form/ProductPricingFields', () => ({
  ProductPricingFields: () => <div data-testid="pricing-fields" />,
}))

vi.mock('../components/form/ProductInventoryFields', () => ({
  ProductInventoryFields: () => <div data-testid="inventory-fields" />,
}))

vi.mock('../components/form/ProductPurchaseRequirementFields', () => ({
  ProductPurchaseRequirementFields: () => <div data-testid="purchase-fields" />,
}))

vi.mock('../components/form/ProductSeoFields', () => ({
  ProductSeoFields: () => <div data-testid="seo-fields" />,
}))

vi.mock('../components/form/ProductAttributesFields', () => ({
  ProductAttributesFields: () => <div data-testid="attributes-fields" />,
}))

vi.mock('../components/media/ProductMediaSection', () => ({
  ProductMediaSection: () => <div data-testid="media-section" />,
}))

const mockCategories = [
  { id: '01J8CAT000000000000000001', name: 'برق', slug: 'electric', children: [], is_active: true, sort_order: 1, description: null, image: null, icon: null, parent_id: null, created_at: null },
]

const mockExistingProduct = {
  id: '01J8XKZP4Q3R5T6Y7W8V9N0M1K',
  name: 'کابل برق صنعتی',
  slug: 'cable',
  sku: 'CBL-001',
  price_usd: 29.99,
  price: 1200000,
  final_price: 1200000,
  stock_quantity: 10,
  stock_status: 'in_stock',
  is_active: true,
  is_featured: false,
  purchase_requirement: 'standard',
  support_contact_enabled: false,
  purchase_confirmation_required: false,
  discount_type: null,
  discount_value: null,
  discount_starts_at: null,
  discount_ends_at: null,
  weight_grams: null,
  short_description: null,
  description: null,
  meta_title: null,
  meta_description: null,
  technical_notice: null,
  installation_notice: null,
  compatibility_notice: null,
  views_count: 0,
  purchases_count: 0,
  likes_count: 0,
  discount_percentage: null,
  has_active_discount: false,
  purchase_requirement_label: 'خرید عادی',
  category: { id: '01J8CAT000000000000000001', name: 'برق', slug: 'electric' },
  images: [],
  videos: [],
  attributes: [],
  created_at: null,
  updated_at: null,
}

function makeServerError(message: string, status = 500) {
  const error = new AxiosError('Request failed')
  error.response = {
    status,
    data: { message, code: 'ERROR' },
    headers: {},
    config: {} as never,
    statusText: String(status),
  }
  return error
}

const onOpenChange = vi.fn()

function setupCreate() {
  const user = userEvent.setup()
  const result = render(<ProductFormDialog open={true} onOpenChange={onOpenChange} productId={null} />)
  return { user, ...result }
}

function setupEdit() {
  const user = userEvent.setup()
  const result = render(
    <ProductFormDialog open={true} onOpenChange={onOpenChange} productId="01J8XKZP4Q3R5T6Y7W8V9N0M1K" />
  )
  return { user, ...result }
}

async function fillValidCreateForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('نام محصول'), 'محصول تست')
  await user.clear(screen.getByLabelText('قیمت دلاری'))
  await user.type(screen.getByLabelText('قیمت دلاری'), '10')
}

async function fillValidEditForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('نام محصول'), 'کابل برق صنعتی')
  await user.clear(screen.getByLabelText('قیمت دلاری'))
  await user.type(screen.getByLabelText('قیمت دلاری'), '30')
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateMutateAsync.mockResolvedValue({ ...mockExistingProduct })
  mockUpdateMutateAsync.mockResolvedValue({ ...mockExistingProduct })
})

describe('ProductFormDialog', () => {
  describe('create mode', () => {
    it('shows "محصول جدید" title', () => {
      setupCreate()
      expect(screen.getByText('محصول جدید')).toBeInTheDocument()
    })

    it('shows submit button with create label', () => {
      setupCreate()
      expect(screen.getByRole('button', { name: /ساخت محصول/ })).toBeInTheDocument()
    })

    it('shows cancel button', () => {
      setupCreate()
      expect(screen.getByRole('button', { name: 'انصراف' })).toBeInTheDocument()
    })

    it('renders all form section sub-components', () => {
      setupCreate()
      expect(screen.getByTestId('basic-info-fields')).toBeInTheDocument()
      expect(screen.getByTestId('pricing-fields')).toBeInTheDocument()
      expect(screen.getByTestId('inventory-fields')).toBeInTheDocument()
      expect(screen.getByTestId('purchase-fields')).toBeInTheDocument()
      expect(screen.getByTestId('seo-fields')).toBeInTheDocument()
    })

    it('does not show media section before product is created', () => {
      setupCreate()
      expect(screen.queryByTestId('media-section')).not.toBeInTheDocument()
    })

    it('shows media section after successful create', async () => {
      const { user } = setupCreate()
      await fillValidCreateForm(user)
      await user.click(screen.getByRole('button', { name: /ساخت محصول/ }))
      await waitFor(() => {
        expect(screen.getByTestId('media-section')).toBeInTheDocument()
      })
    })

    it('does not close dialog after create — stays open for media upload', async () => {
      const { user } = setupCreate()
      await fillValidCreateForm(user)
      await user.click(screen.getByRole('button', { name: /ساخت محصول/ }))
      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalled()
      })
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
    })

    it('calls createMutation with correct payload shape', async () => {
      const { user } = setupCreate()
      await user.type(screen.getByLabelText('نام محصول'), 'محصول تست')
      await user.clear(screen.getByLabelText('قیمت دلاری'))
      await user.type(screen.getByLabelText('قیمت دلاری'), '10')
      await user.click(screen.getByRole('button', { name: /ساخت محصول/ }))
      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'محصول تست' })
        )
      })
    })
  })

  describe('edit mode', () => {
    it('shows "ویرایش محصول" title', () => {
      setupEdit()
      expect(screen.getByText('ویرایش محصول')).toBeInTheDocument()
    })

    it('shows product name in description', () => {
      setupEdit()
      expect(screen.getByText(/کابل برق صنعتی/)).toBeInTheDocument()
    })

    it('shows save button', () => {
      setupEdit()
      expect(screen.getByRole('button', { name: /ذخیره/ })).toBeInTheDocument()
    })

    it('shows media section in edit mode', () => {
      setupEdit()
      expect(screen.getByTestId('media-section')).toBeInTheDocument()
    })

    it('calls updateMutation on submit', async () => {
      const { user } = setupEdit()
      await fillValidEditForm(user)
      await user.click(screen.getByRole('button', { name: /ذخیره/ }))
      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ id: '01J8XKZP4Q3R5T6Y7W8V9N0M1K' })
        )
      })
    })

    it('closes dialog after successful update', async () => {
      const { user } = setupEdit()
      await fillValidEditForm(user)
      await user.click(screen.getByRole('button', { name: /ذخیره/ }))
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('dialog controls', () => {
    it('calls onOpenChange(false) when cancel is clicked', async () => {
      const { user } = setupCreate()
      await user.click(screen.getByRole('button', { name: 'انصراف' }))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('does not render when open is false', () => {
      render(<ProductFormDialog open={false} onOpenChange={onOpenChange} />)
      expect(screen.queryByText('محصول جدید')).not.toBeInTheDocument()
      expect(screen.queryByText('ویرایش محصول')).not.toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('shows general error banner on server error', async () => {
      mockCreateMutateAsync.mockRejectedValueOnce(makeServerError('ساخت محصول ناموفق بود.', 500))
      const { user } = setupCreate()
      await fillValidCreateForm(user)
      await user.click(screen.getByRole('button', { name: /ساخت محصول/ }))
      await waitFor(() => {
        expect(screen.getByText('ساخت محصول ناموفق بود.')).toBeInTheDocument()
      })
    })

    it('clears error banner on next submit attempt', async () => {
      mockCreateMutateAsync
        .mockRejectedValueOnce(makeServerError('خطا', 500))
        .mockResolvedValueOnce({ ...mockExistingProduct })
      const { user } = setupCreate()
      await fillValidCreateForm(user)
      await user.click(screen.getByRole('button', { name: /ساخت محصول/ }))
      await waitFor(() => {
        expect(screen.getByText('خطا')).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /ساخت محصول/ }))
      await waitFor(() => {
        expect(screen.queryByText('خطا')).not.toBeInTheDocument()
      })
    })
  })
})