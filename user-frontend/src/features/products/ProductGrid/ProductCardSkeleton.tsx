export function ProductCardSkeleton() {
  return (
    <div className="w-full min-h-[460px] rounded-3xl border border-border bg-surface overflow-hidden animate-pulse">
      <div className="w-full h-[260px] bg-border/50" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-4 bg-border/50 rounded w-3/4" />
        <div className="h-4 bg-border/50 rounded w-1/2" />
        <div className="h-6 bg-border/50 rounded w-2/3" />
      </div>
    </div>
  );
}