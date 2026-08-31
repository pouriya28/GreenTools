import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Theme = "light" | "dark" | "neon"

const THEMES: Theme[] = ["light", "dark", "neon"]

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function applyThemeToDocument(theme: Theme) {
  if (theme === "light") {
    document.documentElement.removeAttribute("data-theme")
  } else {
    document.documentElement.setAttribute("data-theme", theme)
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (theme) => {
        applyThemeToDocument(theme)
        set({ theme })
      },
      toggleTheme: () => {
        const current = get().theme
        const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]
        applyThemeToDocument(next)
        set({ theme: next })
      },
    }),
    {
      name: "theme-storage",
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeToDocument(state.theme)
      },
    }
  )
)