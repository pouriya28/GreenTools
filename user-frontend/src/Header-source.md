# Header Source

## components\layout\Header\ActionButtons.tsx

```tsx
import { useState } from "react";
import { FiSearch, FiHeart, FiShoppingCart, FiUser, FiMenu, FiLogOut, FiChevronDown } from "react-icons/fi";
import { useAuthStore } from "@/store/authStore";

interface ActionButtonsProps {
  onOpenMenu: () => void;
  onOpenAuth: () => void;
}

export function ActionButtons({ onOpenMenu, onOpenAuth }: ActionButtonsProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* دکمه همبرگری - موبایل */}
      <button
        onClick={onOpenMenu}
        className="lg:hidden w-10 h-10 rounded-xl bg-surface/60 border border-white/5 flex items-center justify-center text-text hover:text-primary hover:border-primary/40 transition-all"
      >
        <FiMenu className="text-xl" />
      </button>

      {/* جستجو */}
      <button className="w-10 h-10 rounded-xl bg-surface/60 border border-white/5 flex items-center justify-center text-text hover:text-primary hover:border-primary/40 transition-all">
        <FiSearch className="text-lg" />
      </button>

      {/* علاقه‌مندی‌ها */}
      <button className="w-10 h-10 rounded-xl bg-surface/60 border border-white/5 flex items-center justify-center text-text hover:text-primary hover:border-primary/40 transition-all">
        <FiHeart className="text-lg" />
      </button>

      {/* سبد خرید */}
      <button className="relative w-10 h-10 rounded-xl bg-surface/60 border border-white/5 flex items-center justify-center text-text hover:text-primary hover:border-primary/40 transition-all">
        <FiShoppingCart className="text-lg" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-black text-[10px] font-bold flex items-center justify-center shadow-sm">
          ۳
        </span>
      </button>

      {/* ورود / حساب کاربری - دسکتاپ */}
      {isAuthenticated && user ? (
        <div className="relative hidden sm:block">
          <button
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 h-10 rounded-xl bg-surface/80 border border-primary/30 text-text hover:border-primary transition-all text-xs font-medium"
          >
            <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
              {user.phone ? user.phone.slice(-4) : "U"}
            </div>
            <span className="max-w-[100px] truncate">{user.phone || "حساب کاربری"}</span>
            <FiChevronDown className={`text-xs text-text-secondary transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {/* منوی کشویی کاربر */}
          {isUserMenuOpen && (
            <>
              {/* بک‌دراپ شفاف برای کلیک بیرون منو - Z-index اصلاح شد */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-48 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-xl p-1.5 shadow-2xl z-50 animate-[scaleUp_0.15s_ease-out]">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                  <FiLogOut className="text-sm" />
                  <span>خروج از حساب</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={onOpenAuth}
          className="hidden sm:flex items-center gap-2 px-4 h-10 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-black font-semibold text-xs transition-all shadow-[0_0_15px_rgba(34,197,94,0.15)]"
        >
          <FiUser className="text-base" />
          <span>ورود / ثبت‌نام</span>
        </button>
      )}
    </div>
  );
}
```


## components\layout\Header\Header.tsx

```tsx
import { useState, useEffect } from "react";
import { Logo } from "./Logo";
import { Navigation } from "./Navigation";
import { ActionButtons } from "./ActionButtons";
import { MobileDrawer } from "./MobileDrawer";
import { AuthModal } from "@/features/auth/components/AuthModal";
import { useAuthStore } from "@/store/authStore"; // فرض بر استفاده از Zustand برای مدیریت وضعیت لاگین


export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  // دریافت وضعیت لاگین از Zustand
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 flex justify-center pt-4 px-4 transition-all duration-300 pointer-events-none">
        <div
          className={`
            pointer-events-auto w-full max-w-7xl
            flex items-center justify-between
            px-4 sm:px-6 rounded-2xl border transition-all duration-300
            ${
              isScrolled
                ? "h-16 bg-surface/85 backdrop-blur-xl border-primary/20 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
                : "h-20 bg-surface/30 backdrop-blur-md border-white/10"
            }
          `}
        >
          {/* گروه سمت راست: لوگو + آیکون سرچ */}
          <div className="flex items-center gap-4">
            <Logo />

          </div>

          {/* گروه وسط: منوی نویگیشن */}
          <Navigation />

          {/* گروه سمت چپ: اکشن‌ها (ورود، سبد خرید، قلب) */}
          <ActionButtons
            onOpenMenu={() => setIsMenuOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            isAuthenticated={isAuthenticated} // پاس دادن وضعیت لاگین
          />
        </div>
      </header>

      <MobileDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
```


## components\layout\Header\index.ts

```ts
// src/components/layout/Header/index.ts
export { Header } from "./Header";
```


## components\layout\Header\Logo.tsx

```tsx
// src/components/layout/Header/Logo.tsx
export function Logo() {
  return (
    <div className="flex items-center gap-2 cursor-pointer group">
      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/40 flex items-center justify-center text-primary font-black shadow-[0_0_15px_rgba(34,197,94,0.3)] group-hover:scale-105 transition-all">
        GT
      </div>
      <div className="flex flex-col">
        <span className="text-white font-black tracking-wider text-base">
          Green<span className="text-primary neon-text">Tools</span>
        </span>
        <span className="text-[10px] text-text-secondary hidden sm:inline-block">
          فروشگاه تخصصی ابزار
        </span>
      </div>
    </div>
  );
}
```


## components\layout\Header\MobileDrawer.tsx

```tsx
import { FiX, FiHome, FiGrid, FiShoppingBag, FiTag, FiPhone, FiUser, FiLogOut } from "react-icons/fi";
import { useAuthStore } from "../../../store/authStore";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export function MobileDrawer({ isOpen, onClose, onOpenAuth }: MobileDrawerProps) {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isOpen) return null;

  const menuItems = [
    { label: "صفحه اصلی", icon: <FiHome />, href: "#" },
    { label: "محصولات", icon: <FiShoppingBag />, href: "#" },
    { label: "دسته‌بندی‌ها", icon: <FiGrid />, href: "#" },
    { label: "تخفیف‌ها", icon: <FiTag />, href: "#" },
    { label: "تماس با ما", icon: <FiPhone />, href: "#" },
  ];

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-[280px] h-full bg-surface/95 backdrop-blur-2xl border-l border-primary/20 p-6 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10">
        <div>
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
            <span className="text-white font-bold text-lg">منوی دسترسی</span>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text hover:text-primary transition-colors"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-primary hover:bg-primary/10 transition-all font-medium text-sm"
              >
                <span className="text-lg text-primary">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* بخش انتهایی منو (پروفایل / ورود) */}
        <div className="pt-6 border-t border-white/10">
          {isAuthenticated && user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="w-9 h-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
                  <FiUser />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-text truncate">
                    {user.phone || "کاربر سایت"}
                  </span>
                  <span className="text-[10px] text-text-secondary">خوش آمدید</span>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-error/10 border border-error/20 text-error font-semibold text-xs hover:bg-error/20 transition-all"
              >
                <FiLogOut className="text-base" />
                <span>خروج از حساب</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary font-semibold text-sm hover:bg-primary hover:text-black transition-all"
            >
              <FiUser className="text-lg" />
              <span>ورود / ثبت‌نام</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```


## components\layout\Header\Navigation.tsx

```tsx
// src/components/layout/Header/Navigation.tsx
export function Navigation() {
  // به دلیل RTL بودن صفحه، اولین آیتم در سمت راست‌ترین حالت رندر می‌شود
  const navItems = [
    { label: "صفحه اصلی", href: "/" },
    { label: "محصولات", href: "/products" },
    { label: "دسته‌بندی‌ها", href: "/categories" },
    { label: "تماس با ما", href: "/contact" },
  ];

  return (
    <nav className="hidden lg:flex items-center gap-6">
      {navItems.map((item, index) => (
        <a
          key={index}
          href={item.href}
          className="text-text-secondary hover:text-primary text-sm font-medium transition-colors hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
```

