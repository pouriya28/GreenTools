import { useState } from "react";
import { Link } from "react-router-dom";
import { CategoryMegaMenu } from "@/features/categories/components/CategoryMegaMenu";

export function Navigation() {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  // به دلیل RTL بودن صفحه، اولین آیتم در سمت راست‌ترین حالت رندر می‌شود
  const navItems = [
    { label: "صفحه اصلی", href: "/" },
    { label: "محصولات", href: "/products" },
    { label: "تماس با ما", href: "/contact" },
  ];

  return (
    <nav className="hidden lg:flex items-center gap-6">
      {navItems.map((item, index) => (
        <Link
          key={index}
          to={item.href}
          className="text-text-secondary hover:text-primary text-sm font-medium transition-colors hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
        >
          {item.label}
        </Link>
      ))}

      <div
        className="relative"
        onMouseEnter={() => setIsCategoriesOpen(true)}
        onMouseLeave={() => setIsCategoriesOpen(false)}
      >
        <Link
          to="/categories"
          className="text-text-secondary hover:text-primary text-sm font-medium transition-colors hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
        >
          دسته‌بندی‌ها
        </Link>
        <CategoryMegaMenu isOpen={isCategoriesOpen} />
      </div>
    </nav>
  );
}