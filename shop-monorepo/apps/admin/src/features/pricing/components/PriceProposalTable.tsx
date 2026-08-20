import { useState } from "react"
import { AlertTriangle, PackageOpen } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPrice } from "@/features/products/utils"
import type { PriceProposal } from "../types"
import { PriceProposalStatusBadge } from "./PriceProposalStatusBadge"
import { EditProposedPriceCell } from "./EditProposedPriceCell"
import { PriceProposalRowActions } from "./PriceProposalRowActions"

interface PriceProposalTableProps {
  proposals: PriceProposal[]
}

const FINAL_STATUSES = new Set(["approved", "rejected"])

export function PriceProposalTable({ proposals }: PriceProposalTableProps) {
  const [rowError, setRowError] = useState<string | null>(null)

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-text-2">
        <PackageOpen className="h-8 w-8 opacity-50" />
        <p className="text-sm">پیشنهاد قیمتی در این batch وجود ندارد.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {rowError && (
        <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{rowError}</span>
        </div>
      )}

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
            {proposals.map((proposal) => (
              <TableRow key={proposal.id}>
                <TableCell className="font-medium text-text-1">{proposal.product.name}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-text-2">{proposal.product.sku}</TableCell>
                <TableCell className="text-text-2">{formatPrice(proposal.old_price_toman)} تومان</TableCell>
                <TableCell>
                  <EditProposedPriceCell proposal={proposal} disabled={FINAL_STATUSES.has(proposal.status)} />
                </TableCell>
                <TableCell>
                  <PriceProposalStatusBadge status={proposal.status} />
                </TableCell>
                <TableCell>
                  <PriceProposalRowActions proposal={proposal} onError={setRowError} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
