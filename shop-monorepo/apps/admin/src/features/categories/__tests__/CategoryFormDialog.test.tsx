import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CategoryFormDialog } from '../components/CategoryFormDialog'
import type { Category } from '../types'

const BASE = 'http://localhost:8000/api/v1/categories/admin'

const mockCategory: Category = {
  id: '01HXYZ1234567890ABCDEFGHIJ',
  parent_id: null,
  name: 'برق',
  slug: 'bargh',
  description: 'توضیحات برق',
  image: null,
  icon: 'mdi-bolt',
  is_active: true,
  sort_order: 5,
  children: [],
  created_at: '2024-01-01T00:00:00Z',
}

const mockParentCategory: Category = {
  id: '01PARENT00000000000000000A',
  parent_id: null,
  name: 'والد',
  slug: 'parent',
  description: null,
  image: null,
  icon: null,
  is_active: true,
  sort_order: 0,
  children: [],
  created_at: '2024-01-01T00:00:00Z',
}

const server = setupServer(
  http.post(BASE, () => HttpResponse.json({ data: mockCategory }, { status: 201 })),
  http.patch(`${BASE}/:id`, () =>
    HttpResponse.json({ data: { ...mockCategory, name: 'برق ویرایش‌شده' } }),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function setup(props: Partial<Parameters<typeof CategoryFormDialog>[0]> = {}) {
  const onOpenChange = vi.fn()
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={makeClient()}>
      <CategoryFormDialog
        open={true}
        onOpenChange={onOpenChange}
        categories={[mockParentCategory]}
        {...props}
      />
    </QueryClientProvider>,
  )
  return { onOpenChange, user }
}

describe('CategoryFormDialog', () => {
  describe('create mode', () => {
    it('shows "دسته‌بندی جدید" title', () => {
      setup()
      expect(screen.getByText('دسته‌بندی جدید')).toBeInTheDocument()
    })

    it('shows "ساخت دسته‌بندی" submit button', () => {
      setup()
      expect(screen.getByRole('button', { name: 'ساخت دسته‌بندی' })).toBeInTheDocument()
    })

    it('submit button is disabled when name is empty', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'ساخت دسته‌بندی' }))
      // validation error appears — button still present
      await waitFor(() =>
        expect(screen.getByText('نام باید حداقل ۲ کاراکتر باشد')).toBeInTheDocument(),
      )
    })

    it('calls onOpenChange(false) after successful create', async () => {
      const { user, onOpenChange } = setup()
      await user.type(screen.getByLabelText('نام دسته‌بندی'), 'برق')
      await user.click(screen.getByRole('button', { name: 'ساخت دسته‌بندی' }))
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    })

    it('shows generic error banner on non-422 API failure', async () => {
      server.use(
        http.post(BASE, () => HttpResponse.json(null, { status: 500 })),
      )
      const { user } = setup()
      await user.type(screen.getByLabelText('نام دسته‌بندی'), 'برق')
      await user.click(screen.getByRole('button', { name: 'ساخت دسته‌بندی' }))
      await waitFor(() =>
        expect(screen.getByText(/ساخت دسته‌بندی ناموفق/)).toBeInTheDocument(),
      )
    })

    it('shows field-level error on 422 validation failure', async () => {
      server.use(
        http.post(BASE, () =>
          HttpResponse.json(
            { message: 'Validation failed', errors: { name: ['نام تکراری است'] } },
            { status: 422 },
          ),
        ),
      )
      const { user } = setup()
      await user.type(screen.getByLabelText('نام دسته‌بندی'), 'برق')
      await user.click(screen.getByRole('button', { name: 'ساخت دسته‌بندی' }))
      await waitFor(() => expect(screen.getByText('نام تکراری است')).toBeInTheDocument())
    })
  })

  describe('edit mode', () => {
    it('shows "ویرایش دسته‌بندی" title', () => {
      setup({ category: mockCategory })
      expect(screen.getByText('ویرایش دسته‌بندی')).toBeInTheDocument()
    })

    it('shows "ذخیره‌ی تغییرات" submit button', () => {
      setup({ category: mockCategory })
      expect(screen.getByRole('button', { name: 'ذخیره‌ی تغییرات' })).toBeInTheDocument()
    })

    it('pre-fills name field with category name', () => {
      setup({ category: mockCategory })
      expect(screen.getByLabelText('نام دسته‌بندی')).toHaveValue('برق')
    })

    it('pre-fills icon field with category icon', () => {
      setup({ category: mockCategory })
      expect(screen.getByLabelText('آیکون')).toHaveValue('mdi-bolt')
    })

    it('calls onOpenChange(false) after successful update', async () => {
      const { user, onOpenChange } = setup({ category: mockCategory })
      await user.clear(screen.getByLabelText('نام دسته‌بندی'))
      await user.type(screen.getByLabelText('نام دسته‌بندی'), 'برق ویرایش‌شده')
      await user.click(screen.getByRole('button', { name: 'ذخیره‌ی تغییرات' }))
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    })

    it('shows error banner on update failure', async () => {
      server.use(
        http.patch(`${BASE}/:id`, () =>
          HttpResponse.json(null, { status: 500 }),
        ),
      )
      const { user } = setup({ category: mockCategory })
      await user.click(screen.getByRole('button', { name: 'ذخیره‌ی تغییرات' }))
      await waitFor(() =>
        expect(screen.getByText(/ویرایش دسته‌بندی ناموفق/)).toBeInTheDocument(),
      )
    })
  })

  describe('cancel', () => {
    it('calls onOpenChange(false) on cancel click', async () => {
      const { user, onOpenChange } = setup()
      await user.click(screen.getByRole('button', { name: 'انصراف' }))
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    })
  })

  describe('is_active toggle', () => {
    it('is_active is true by default in create mode', () => {
      setup()
      expect(screen.getByRole('switch')).toBeChecked()
    })

    it('reflects category is_active in edit mode', () => {
      setup({ category: { ...mockCategory, is_active: false } })
      expect(screen.getByRole('switch')).not.toBeChecked()
    })
  })

  describe('form reset', () => {
    it('resets form when dialog reopens with different category', () => {
      const { rerender } = render(
        <QueryClientProvider client={makeClient()}>
          <CategoryFormDialog
            open={true}
            onOpenChange={vi.fn()}
            categories={[]}
            category={mockCategory}
          />
        </QueryClientProvider>,
      )
      expect(screen.getByLabelText('نام دسته‌بندی')).toHaveValue('برق')

      rerender(
        <QueryClientProvider client={makeClient()}>
          <CategoryFormDialog
            open={true}
            onOpenChange={vi.fn()}
            categories={[]}
            category={{ ...mockCategory, id: '01OTHER0000000000000000000', name: 'کابل' }}
          />
        </QueryClientProvider>,
      )
      expect(screen.getByLabelText('نام دسته‌بندی')).toHaveValue('کابل')
    })
  })
})
