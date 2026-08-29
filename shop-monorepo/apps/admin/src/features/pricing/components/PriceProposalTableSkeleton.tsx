import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PriceProposalTableSkeletonProps {
  rows?: number
}

// اسکلت لودینگ برای جدول پیشنهادهای قیمت — به‌جای یک اسپینر ساده، طرح‌بندی واقعی
// جدول رو نشون می‌ده تا حس بارگذاری سریع‌تر و شیک‌تری داشته باشه.
export function PriceProposalTableSkeleton({ rows = 6 }: PriceProposalTableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>محصول</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>قیمت قبلی</TableHead>
            <TableHead>قیمت پیشنهادی</TableHead>
            <TableHead>وضعیت</TableHead>
            <TableHead className="w-48 text-left">عملیات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: 6 }).map((__, cellIndex) => (
                <TableCell key={cellIndex}>
                  <div className="h-4 w-full max-w-32 animate-pulse rounded bg-border/70" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
