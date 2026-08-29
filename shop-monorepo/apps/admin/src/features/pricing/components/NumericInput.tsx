import type { ReactNode } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  isBusy?: boolean
  // Styles the confirm button as a danger action (e.g. reject/delete) so
  // destructive and non-destructive confirmations are visually
  // distinguishable at a glance, instead of looking identical.
  destructive?: boolean
  errorMessage?: string | null
  onConfirm: () => void
}

// A small, reusable primitive for every sensitive action in this feature
// (approve/reject a batch, manual rate override, on-demand fetch, confirm the
// current rate, delete a schedule) - instead of duplicating the same
// AlertDialog in every component, per the project's "small, reusable
// components" instruction. Every sensitive action goes through this exact
// same explicit-confirmation pattern (security: guards against human error).
export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "تایید نهایی",
  cancelLabel = "انصراف",
  isBusy = false,
  destructive = false,
  errorMessage,
  onConfirm,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !isBusy && onOpenChange(next)}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage && (
          <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBusy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isBusy}
            className={destructive ? "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger" : undefined}
          >
            {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
