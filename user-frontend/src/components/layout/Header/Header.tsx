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