import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notificationsApi'

export const notificationsQueryKey = ['admin', 'notifications'] as const

// Poll every 1 h — reasonable for order notifications,
// low enough pressure on the server for an admin-only panel.
const POLL_INTERVAL_MS = 60 * 60 * 10_000

export function useAdminNotifications() {
  return useQuery({
    queryKey: notificationsQueryKey,
    queryFn: fetchUnreadNotifications,
    refetchInterval: POLL_INTERVAL_MS,
    // pause polling when the browser tab is hidden — saves requests
    refetchIntervalInBackground: false,
    staleTime: 20_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
    },
  })
}