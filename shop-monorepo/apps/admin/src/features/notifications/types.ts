export interface AdminNotification {
  id: string
  type: string // 'NewOrderPlacedNotification'
  data: {
    order_id: string
    total_amount: number
  }
  created_at: string
}

export interface NotificationsResponse {
  data: AdminNotification[]
  count: number
}