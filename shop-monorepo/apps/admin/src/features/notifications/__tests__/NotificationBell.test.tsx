import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationBell } from '../components/NotificationBell'

const BASE = 'http://localhost:8000/api/v1/admin/notifications'

const mockNotification = {
  id: 'notif-uuid-001',
  type: 'NewOrderPlacedNotification',
  data: { order_id: '01ORDER000000000000000000A', total_amount: 1500000 },
  created_at: new Date().toISOString(),
}

const server = setupServer(
  http.get(BASE, () => HttpResponse.json({ data: [mockNotification], count: 1 })),
  http.post(`${BASE}/read-all`, () => HttpResponse.json({ message: 'ok' })),
  http.post(`${BASE}/:id/read`, () => HttpResponse.json({ message: 'ok' })),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function setup() {
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={makeClient()}>
      <NotificationBell />
    </QueryClientProvider>,
  )
  return { user }
}

describe('NotificationBell', () => {
  describe('rendering', () => {
    it('renders bell button', () => {
      setup()
      expect(screen.getByRole('button', { name: /اعلان/ })).toBeInTheDocument()
    })

    it('shows badge when there are unread notifications', async () => {
      setup()
      await waitFor(() =>
        expect(screen.getByTestId('notification-badge')).toBeInTheDocument(),
      )
      expect(screen.getByTestId('notification-badge')).toHaveTextContent('1')
    })

    it('does not show badge when no unread notifications', async () => {
      server.use(
        http.get(BASE, () => HttpResponse.json({ data: [], count: 0 })),
      )
      setup()
      await waitFor(() => {
        expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument()
      })
    })

    it('shows 9+ when count exceeds 9', async () => {
      const manyNotifications = Array.from({ length: 10 }, (_, i) => ({
        ...mockNotification,
        id: `notif-${i}`,
      }))
      server.use(
        http.get(BASE, () =>
          HttpResponse.json({ data: manyNotifications, count: 10 }),
        ),
      )
      setup()
      await waitFor(() =>
        expect(screen.getByTestId('notification-badge')).toHaveTextContent('9+'),
      )
    })
  })

  describe('dropdown', () => {
    it('opens dropdown on bell click', async () => {
      const { user } = setup()
      await waitFor(() => screen.getByTestId('notification-badge'))
      await user.click(screen.getByRole('button', { name: /اعلان/ }))
      expect(screen.getByRole('dialog', { name: 'اعلان‌ها' })).toBeInTheDocument()
    })

    it('shows notification item with order info', async () => {
      const { user } = setup()
      await waitFor(() => screen.getByTestId('notification-badge'))
      await user.click(screen.getByRole('button', { name: /اعلان/ }))
      expect(screen.getByText('سفارش جدید ثبت شد')).toBeInTheDocument()
      expect(screen.getByText(/۱٬۵۰۰٬۰۰۰/)).toBeInTheDocument()
    })

    it('shows empty state when no notifications', async () => {
      server.use(
        http.get(BASE, () => HttpResponse.json({ data: [], count: 0 })),
      )
      const { user } = setup()
      await waitFor(() => {
        expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /اعلان/ }))
      expect(screen.getByText('اعلان جدیدی ندارید')).toBeInTheDocument()
    })

    it('shows "همه را خواندم" button when there are notifications', async () => {
      const { user } = setup()
      await waitFor(() => screen.getByTestId('notification-badge'))
      await user.click(screen.getByRole('button', { name: /اعلان/ }))
      expect(screen.getByRole('button', { name: 'همه را خواندم' })).toBeInTheDocument()
    })
  })

  describe('mark as read', () => {
    it('calls markAllRead and closes dropdown on "همه را خواندم"', async () => {
    const { user } = setup()
    await waitFor(() => screen.getByTestId('notification-badge'))
    await user.click(screen.getByRole('button', { name: /اعلان/ }))
    await user.click(screen.getByRole('button', { name: 'همه را خواندم' }))
    await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    })

    it('calls markRead when single notification checkmark clicked', async () => {
      let marked = false
      server.use(
        http.post(`${BASE}/:id/read`, () => {
          marked = true
          return HttpResponse.json({ message: 'ok' })
        }),
      )
      const { user } = setup()
      await waitFor(() => screen.getByTestId('notification-badge'))
      await user.click(screen.getByRole('button', { name: /اعلان/ }))
      await user.click(
        screen.getByRole('button', { name: 'علامت‌گذاری به عنوان خوانده‌شده' }),
      )
      await waitFor(() => expect(marked).toBe(true))
    })
  })

  describe('security', () => {
    it('bell button has accessible aria-label with unread count', async () => {
      setup()
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /اعلان/ })
        expect(btn).toHaveAttribute('aria-label', 'اعلان‌ها — 1 خوانده‌نشده')
      })
    })
  })
})