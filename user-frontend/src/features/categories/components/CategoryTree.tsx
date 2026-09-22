import type { Category } from "../types/Category";
import { CategoryAccordionItem } from "./CategoryAccordionItem";

interface CategoryTreeProps {
  categories: Category[];
}

export function CategoryTree({ categories }: CategoryTreeProps) {
  return (
    <div className="flex flex-col gap-3" dir="rtl">
      {categories.map((category) => (
        <CategoryAccordionItem key={category.id} category={category} />
      ))}
    </div>
  );
}