import { Bell } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { faIR } from 'date-fns/locale'
import { useAdminNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '../hooks/useAdminNotifications'
import type { AdminNotification } from '../types'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useAdminNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const notifications = data?.data ?? []
  const count = data?.count ?? 0

  function handleMarkRead(id: string) {
    markRead.mutate(id)
  }

  function handleMarkAll() {
    markAll.mutate()
    setOpen(false)
  }

  return (
    <div className="relative" dir="rtl">
      <button
        type="button"
        aria-label={`اعلان‌ها${count > 0 ? ` — ${count} خوانده‌نشده` : ''}`}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-text-2 hover:bg-bg-3"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span
            aria-hidden="true"
            data-testid="notification-badge"
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white"
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="اعلان‌ها"
          className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-bg-1 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-text-1">اعلان‌ها</span>
            {count > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs text-primary hover:underline"
              >
                همه را خواندم
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto" role="list">
            {isLoading && (
              <li className="px-4 py-6 text-center text-sm text-text-3">در حال بارگذاری...</li>
            )}
            {!isLoading && notifications.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-text-3">اعلان جدیدی ندارید</li>
            )}
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={() => handleMarkRead(n.id)}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: AdminNotification
  onMarkRead: () => void
}) {
  const isOrder = notification.type === 'NewOrderPlacedNotification'
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: faIR,
  })

  return (
    <li className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {isOrder ? (
          <>
            <p className="text-sm font-medium text-text-1">سفارش جدید ثبت شد</p>
            <p className="text-xs text-text-2">
              مبلغ: {notification.data.total_amount.toLocaleString('fa-IR')} تومان
            </p>
          </>
        ) : (
          <p className="text-sm text-text-1">{notification.type}</p>
        )}
        <p className="text-xs text-text-3">{timeAgo}</p>
      </div>
      <button
        type="button"
        onClick={onMarkRead}
        aria-label="علامت‌گذاری به عنوان خوانده‌شده"
        className="mt-0.5 shrink-0 rounded p-1 text-text-3 hover:bg-bg-3 hover:text-text-1"
      >
        ✓
      </button>
    </li>
  )
}