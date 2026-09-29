import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
  fetchUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notificationsApi'
import type { NotificationsResponse } from '../types'

const BASE = '/admin/notifications'

const mockNotification = {
  id: 'notif-uuid-001',
  type: 'NewOrderPlacedNotification',
  data: { order_id: '01ORDER000000000000000000A', total_amount: 1500000 },
  created_at: '2024-01-01T10:00:00Z',
}

const mockResponse: NotificationsResponse = {
  data: [mockNotification],
  count: 1,
}

const server = setupServer(
  http.get(BASE, () => HttpResponse.json(mockResponse)),
  http.post(`${BASE}/read-all`, () => HttpResponse.json({ message: 'All notifications marked as read.' })),
  http.post(`${BASE}/:id/read`, () => HttpResponse.json({ message: 'Marked as read.' })),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('notificationsApi', () => {
  describe('fetchUnreadNotifications', () => {
    it('returns notifications list and count', async () => {
      const result = await fetchUnreadNotifications()
      expect(result.count).toBe(1)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe('notif-uuid-001')
      expect(result.data[0].type).toBe('NewOrderPlacedNotification')
    })

    it('returns empty list when no unread notifications', async () => {
      server.use(
        http.get(BASE, () => HttpResponse.json({ data: [], count: 0 })),
      )
      const result = await fetchUnreadNotifications()
      expect(result.count).toBe(0)
      expect(result.data).toHaveLength(0)
    })

    it('throws on 401 unauthorized', async () => {
      server.use(
        http.get(BASE, () => HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })),
      )
      await expect(fetchUnreadNotifications()).rejects.toThrow()
    })
  })

  describe('markNotificationRead', () => {
    it('resolves without error on success', async () => {
      await expect(markNotificationRead('notif-uuid-001')).resolves.toBeUndefined()
    })

    it('throws on 404 when notification not found', async () => {
      server.use(
        http.post(`${BASE}/:id/read`, () =>
          HttpResponse.json({ message: 'Notification not found.' }, { status: 404 }),
        ),
      )
      await expect(markNotificationRead('nonexistent')).rejects.toThrow()
    })
  })

  describe('markAllNotificationsRead', () => {
    it('resolves without error on success', async () => {
      await expect(markAllNotificationsRead()).resolves.toBeUndefined()
    })
  })
})