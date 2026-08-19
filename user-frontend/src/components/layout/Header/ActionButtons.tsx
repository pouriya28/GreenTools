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