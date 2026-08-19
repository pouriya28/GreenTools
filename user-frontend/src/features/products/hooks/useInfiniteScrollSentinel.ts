import { useEffect, useRef } from "react";

interface Options {
  onIntersect: () => void;
  enabled: boolean;
  rootMargin?: string;
}

// یه div نامرئی که وقتی نزدیک ویوپورت کاربر میاد، صفحه‌ی بعدی رو لود می‌کنه (مجیک اسکرول)
export function useInfiniteScrollSentinel({ onIntersect, enabled, rootMargin = "400px" }: Options) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onIntersectRef = useRef(onIntersect);
  onIntersectRef.current = onIntersect; // همیشه آخرین نسخه - نیازی به re-create observer نیست

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !enabled) return; // enabled=false وقتی صفحه‌ی بعدی نداریم یا در حال لودیم - جلوی فایر اضافه رو می‌گیره

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersectRef.current();
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect(); // جلوی memory leak موقع unmount
  }, [enabled, rootMargin]);

  return sentinelRef;
}