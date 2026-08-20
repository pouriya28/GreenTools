import { useState } from "react"
import { Check, Loader2, Pencil, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { formatPrice } from "@/features/products/utils"
import { editProposalPriceSchema } from "../schema"
import { useUpdatePriceProposal } from "../hooks/usePricingMutations"
import type { PriceProposal } from "../types"

interface EditProposedPriceCellProps {
  proposal: PriceProposal
  disabled?: boolean
}

// تکه‌ی کوچک و مستقل قابل استفاده‌ی دوباره: فقط مسئول ویرایش inline قیمت
// پیشنهادی یک ردیف است — طبق دستورالعمل استاندارد، کامپوننت‌ها کوچک و
// تک‌مسئولیتی نگه داشته شدند.
export function EditProposedPriceCell({ proposal, disabled }: EditProposedPriceCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(String(proposal.effective_price_toman))
  const [error, setError] = useState<string | null>(null)
  const updateMutation = useUpdatePriceProposal()

  function startEdit() {
    setValue(String(proposal.effective_price_toman))
    setError(null)
    setIsEditing(true)
  }

  async function handleSave() {
    const parsed = editProposalPriceSchema.safeParse({ edited_price_toman: Number(value) })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "قیمت نامعتبر است")
      return
    }
    setError(null)
    try {
      await updateMutation.mutateAsync({
        proposalId: proposal.id,
        editedPriceToman: parsed.data.edited_price_toman,
      })
      setIsEditing(false)
    } catch (err) {
      // طبق guardNotFinal سمت بک‌اند، اگه پیشنهاد در همین حین توسط یک ادمین
      // دیگه approve/reject شده باشه، اینجا 409 برمی‌گرده — پیام دقیق سرور رو
      // نشون می‌دیم تا کاربر گیج نشه.
      setError(getApiErrorMessage(err, "ذخیره‌ی قیمت اصلاح‌شده ناموفق بود."))
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="font-medium text-text-1">{formatPrice(proposal.effective_price_toman)} تومان</span>
          {proposal.edited_price_toman !== null && (
            <span className="text-xs text-text-3 line-through">{formatPrice(proposal.new_price_toman)}</span>
          )}
        </div>
        {!disabled && (
          <Button type="button" variant="ghost" size="icon" aria-label="اصلاح قیمت پیشنهادی" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-32"
          autoFocus
        />
        <Button type="button" variant="ghost" size="icon" onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(false)}
          disabled={updateMutation.isPending}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
