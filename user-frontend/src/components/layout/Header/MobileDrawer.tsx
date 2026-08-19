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