// src/shared/theme/ThemeProvider.tsx
import { useEffect, type ReactNode } from 'react'
import { useTheme } from './useTheme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useTheme((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('light', theme === 'light')
  }, [theme])

  return <>{children}</>
}