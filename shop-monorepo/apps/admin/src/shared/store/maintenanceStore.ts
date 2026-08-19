import { create } from "zustand"

interface MaintenanceState {
  active: boolean
  retryAfter: number | null
  activate: (retryAfter: number | null) => void
  deactivate: () => void
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  active: false,
  retryAfter: null,
  activate: (retryAfter) => set({ active: true, retryAfter }),
  deactivate: () => set({ active: false, retryAfter: null }),
}))