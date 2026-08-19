import { ProductCard } from "../components/ProductCard/ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { useInfiniteScrollSentinel } from "../hooks/useInfiniteScrollSentinel";
import type { Product } from "../components/ProductCard/ProductTypes";

interface ProductGridProps {
  pages: { data: Product[] }[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isError: boolean;
}

export function ProductGrid({ pages, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError }: ProductGridProps) {
  // مجیک اسکرول: با نزدیک شدن به سنتینل، صفحه‌ی بعدی خودکار لود میشه
  const sentinelRef = useInfiniteScrollSentinel({
    onIntersect: fetchNextPage,
    enabled: hasNextPage && !isFetchingNextPage && !isLoading,
  });

  const products = pages.flatMap((p) => p.data);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
        {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    );
  }

  if (isError) {
    return <div className="text-center py-16 text-muted">مشکلی در بارگذاری محصولات پیش اومد. لطفاً دوباره تلاش کن.</div>;
  }

  if (!products.length) {
    return <div className="text-center py-16 text-muted">محصولی با این فیلترها پیدا نشد.</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>

      <div ref={sentinelRef} className="h-4" aria-hidden="true" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </>
  );
}