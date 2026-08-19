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