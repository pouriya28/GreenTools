import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { PRODUCT_SORT_OPTIONS, type ProductFiltersState, type ProductSort } from "../types/filters.types";

const MAX_SEARCH_LEN = 100;
const MAX_PRICE = 1_000_000_000; // سقف منطقی تومانی

function parseSortSafe(v: string | null): ProductSort | undefined {
  return v && (PRODUCT_SORT_OPTIONS as readonly string[]).includes(v) ? (v as ProductSort) : undefined;
}
function parsePriceSafe(v: string | null): number | undefined {
  if (v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= MAX_PRICE ? Math.trunc(n) : undefined;
}
function parseFlag(v: string | null): boolean | undefined {
  return v === "1" ? true : undefined;
}

export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ورودی سرچ لوکاله تا تایپ لگ نداشته باشه؛ فقط نسخه‌ی debounce شده به URL/کوئری میره
  const [searchInput, setSearchInput] = useState(() => searchParams.get("q") ?? "");
  const debouncedSearch = useDebouncedValue(searchInput, 450);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const trimmed = debouncedSearch.trim().slice(0, MAX_SEARCH_LEN);
      trimmed ? next.set("q", trimmed) : next.delete("q");
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const filters: ProductFiltersState = useMemo(() => ({
    categorySlug: searchParams.get("category") || undefined,
    search: searchParams.get("q")?.slice(0, MAX_SEARCH_LEN) || undefined,
    minPrice: parsePriceSafe(searchParams.get("min_price")),
    maxPrice: parsePriceSafe(searchParams.get("max_price")),
    inStock: parseFlag(searchParams.get("in_stock")),
    hasDiscount: parseFlag(searchParams.get("has_discount")),
    isFeatured: parseFlag(searchParams.get("is_featured")),
    sort: parseSortSafe(searchParams.get("sort")),
  }), [searchParams]);

  const setCategorySlug = useCallback((slug: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      slug ? next.set("category", slug) : next.delete("category");
      return next;
    });
  }, [setSearchParams]);

  const setSort = useCallback((sort: ProductSort | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      sort ? next.set("sort", sort) : next.delete("sort");
      return next;
    });
  }, [setSearchParams]);

  const setPriceRange = useCallback((min: number | null, max: number | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      min !== null && min >= 0 ? next.set("min_price", String(Math.trunc(min))) : next.delete("min_price");
      max !== null && max >= 0 ? next.set("max_price", String(Math.trunc(max))) : next.delete("max_price");
      return next;
    });
  }, [setSearchParams]);

  const toggleFlag = useCallback((key: "in_stock" | "has_discount" | "is_featured") => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.get(key) === "1" ? next.delete(key) : next.set(key, "1");
      return next;
    });
  }, [setSearchParams]);

  const clearAll = useCallback(() => {
    setSearchInput("");
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const activeCount = useMemo(() => {
    let c = 0;
    if (filters.categorySlug) c++;
    if (filters.search) c++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) c++;
    if (filters.inStock) c++;
    if (filters.hasDiscount) c++;
    if (filters.isFeatured) c++;
    return c;
  }, [filters]);

  return { filters, searchInput, setSearchInput, setCategorySlug, setSort, setPriceRange, toggleFlag, clearAll, activeCount };
}