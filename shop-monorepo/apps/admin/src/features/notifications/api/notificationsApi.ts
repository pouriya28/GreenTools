import { api } from '@/shared/lib/axios'
import type { NotificationsResponse } from '../types'

const BASE = '/admin/notifications'

export async function fetchUnreadNotifications(): Promise<NotificationsResponse> {
  const { data } = await api.get<NotificationsResponse>(BASE)
  return data
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(`${BASE}/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post(`${BASE}/read-all`)
}