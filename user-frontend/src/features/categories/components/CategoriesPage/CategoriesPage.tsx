import { useCategories } from "../../hooks/useCategories";
import { CategoryTree } from "../CategoryTree";

export function CategoriesPage() {
  const { data, isLoading, isError } = useCategories();

  return (
    <main className="mx-auto max-w-4xl px-4 pt-32 pb-16" dir="rtl">
      <h1 className="mb-2 text-2xl font-bold text-text">دسته‌بندی‌ها</h1>
      <p className="mb-8 text-sm text-muted">
        دسته‌ی مورد نظر را انتخاب کنید تا محصولات آن (و زیردسته‌هایش) را ببینید.
      </p>

      {isLoading && <p className="text-sm text-muted">در حال بارگذاری دسته‌بندی‌ها...</p>}
      {isError && <p className="text-sm text-error">خطا در دریافت دسته‌بندی‌ها.</p>}
      {data && data.length === 0 && <p className="text-sm text-muted">هنوز دسته‌بندی‌ای ثبت نشده است.</p>}
      {data && data.length > 0 && <CategoryTree categories={data} />}
    </main>
  );
}