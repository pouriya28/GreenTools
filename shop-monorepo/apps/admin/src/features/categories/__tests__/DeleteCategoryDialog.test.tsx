import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DeleteCategoryDialog } from '../components/DeleteCategoryDialog'
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
  http.delete(`${BASE}/:id`, () => new HttpResponse(null, { status: 204 })),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function setup(props: Partial<Parameters<typeof DeleteCategoryDialog>[0]> = {}) {
  const onOpenChange = vi.fn()
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={makeClient()}>
      <DeleteCategoryDialog
        category={mockCategory}
        open={true}
        onOpenChange={onOpenChange}
        {...props}
      />
    </QueryClientProvider>,
  )
  return { onOpenChange, user }
}

describe('DeleteCategoryDialog', () => {
  describe('rendering', () => {
    it('shows category name in description', () => {
      setup()
      expect(screen.getByText(/«برق»/)).toBeInTheDocument()
    })

    it('shows warning when category has children', () => {
      setup({
        category: {
          ...mockCategory,
          children: [{ ...mockCategory, id: '01CHILD000000000000000000A' }],
        },
      })
      expect(screen.getByText(/زیردسته/)).toBeInTheDocument()
    })

    it('does not show warning when category has no children', () => {
      setup()
      expect(screen.queryByText(/زیردسته/)).not.toBeInTheDocument()
    })

    it('shows dialog with empty name when category is null', () => {
      setup({ category: null })
      // dialog renders but category name slot is empty
      const description = screen.getByRole('paragraph')
      expect(description.textContent).not.toContain('برق')
    })
  })

  describe('confirm delete', () => {
    it('calls onOpenChange(false) after successful delete', async () => {
      const { user, onOpenChange } = setup()
      await user.click(screen.getByRole('button', { name: 'حذف' }))
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    })

    it('shows error message on API failure', async () => {
      server.use(
        http.delete(`${BASE}/:id`, () =>
          HttpResponse.json({ message: 'دسته‌بندی خالی نیست' }, { status: 422 }),
        ),
      )
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'حذف' }))
      await waitFor(() =>
        expect(screen.getByText(/دسته‌بندی خالی نیست|ناموفق/)).toBeInTheDocument(),
      )
    })

    it('keeps dialog open on API failure', async () => {
      server.use(
        http.delete(`${BASE}/:id`, () =>
          HttpResponse.json({ message: 'خطا' }, { status: 500 }),
        ),
      )
      const { user, onOpenChange } = setup()
      await user.click(screen.getByRole('button', { name: 'حذف' }))
      await waitFor(() =>
        expect(screen.getByText(/ناموفق|خطا/)).toBeInTheDocument(),
      )
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
    })
  })

  describe('cancel', () => {
    it('calls onOpenChange(false) on cancel click', async () => {
      const { user, onOpenChange } = setup()
      await user.click(screen.getByRole('button', { name: 'انصراف' }))
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    })
  })
})