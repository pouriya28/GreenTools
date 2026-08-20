// src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, FolderTree, Package, Trash2, ChevronRight, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  // end: true چون بدونش، وقتی رو /categories/trash هستیم، این آیتم هم
  // (به‌خاطر matching پیشوندی NavLink) فعال نشون داده می‌شد.
  { to: '/categories', label: 'دسته‌بندی‌ها', icon: FolderTree, end: true },
  { to: '/categories/trash', label: 'سطل‌زباله', icon: Trash2 },
  { to: '/products', label: 'محصولات', icon: Package },
  // بخش جدید: مدیریت نرخ ارز دستی (override) و بررسی/تایید پیشنهادهای قیمت.
  { to: '/pricing', label: 'نرخ ارز و قیمت', icon: Coins },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-l border-border bg-bg-2 transition-all duration-300',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      {/* لوگو */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <span className="font-mono text-lg font-bold text-text-1">
            پنل ادمین
          </span>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="rounded-md p-1.5 text-text-3 hover:bg-bg-3 hover:text-text-1"
        >
          <ChevronRight
            className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* ناوبری */}
      <nav className="relative flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-text-1'
                  : 'text-text-2 hover:bg-bg-3 hover:text-text-1'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="neon-rail"
                    className="absolute inset-0 rounded-lg bg-bg-3"
                    style={{
                      boxShadow:
                        '0 0 0 1px var(--border-strong), 0 0 16px color-mix(in srgb, var(--primary) 30%, transparent)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="neon-rail-bar"
                    className="absolute right-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full"
                    style={{
                      background:
                        'linear-gradient(180deg, var(--primary), var(--secondary))',
                      boxShadow: '0 0 8px var(--primary)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <item.icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
                {!collapsed && (
                  <span className="relative z-10">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
