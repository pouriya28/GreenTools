import { useInfiniteQuery } from "@tanstack/react-query";
import { getComments } from "../api/commentsApi";

const PAGE_SIZE = 5;

export function useComments(productId: number) {
  return useInfiniteQuery({
    queryKey: ["comments", "product", productId],
    queryFn: ({ pageParam }) => getComments("product", productId, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
    enabled: Boolean(productId),
    staleTime: 30_000,
  });
}