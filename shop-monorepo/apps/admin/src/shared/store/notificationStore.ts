import { create } from "zustand"

export type NotificationKind = "success" | "error" | "warning" | "info"

export interface NotificationItem {
  id: string
  kind: NotificationKind
  message: string
  code?: string
  durationMs: number
}

interface NotificationState {
  items: NotificationItem[]
  push: (item: Omit<NotificationItem, "id" | "durationMs"> & { durationMs?: number }) => string
  dismiss: (id: string) => void
}

const DEFAULT_DURATION: Record<NotificationKind, number> = {
  success: 3500,
  info: 4000,
  warning: 5500,
  error: 6500,
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  push: ({ durationMs, ...item }) => {
    const id = crypto.randomUUID()
    set((s) => ({
      items: [
        ...s.items,
        { ...item, id, durationMs: durationMs ?? DEFAULT_DURATION[item.kind] },
      ],
    }))
    return id
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}))