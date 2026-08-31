import { FiSun, FiMoon, FiZap } from "react-icons/fi"
import { useThemeStore } from "@/store/themeStore"

const THEME_ICONS = {
  light: FiSun,
  dark: FiMoon,
  neon: FiZap,
} as const

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const Icon = THEME_ICONS[theme]

  return (
    <button
      onClick={toggleTheme}
      title={`تم فعلی: ${theme}`}
      className="w-10 h-10 rounded-xl bg-surface/60 border border-white/5 flex items-center justify-center text-text hover:text-primary hover:border-primary/40 transition-all"
    >
      <Icon className="text-lg" />
    </button>
  )
}