import { Controller, type UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProductFormValues } from "../../schema"

interface ProductPurchaseRequirementFieldsProps {
  form: UseFormReturn<ProductFormValues>
}

export function ProductPurchaseRequirementFields({ form }: ProductPurchaseRequirementFieldsProps) {
  const { control, register, watch } = form
  const purchaseRequirement = watch("purchase_requirement")

  return (
    <details className="rounded-md border border-border px-3 py-2" open>
      <summary className="cursor-pointer text-sm font-medium text-text-2">شرایط خرید</summary>
      <div className="mt-3 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="purchase_requirement">نوع شرایط خرید</Label>
          <Controller
            control={control}
            name="purchase_requirement"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="purchase_requirement">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">خرید عادی</SelectItem>
                  <SelectItem value="technical_consultation">نیاز به مشاوره فنی</SelectItem>
                  <SelectItem value="professional_installation">نیاز به نصب تخصصی</SelectItem>
                  <SelectItem value="restricted">محدود - نیاز به تماس با پشتیبانی</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {purchaseRequirement !== "standard" && (
          <>
            {(purchaseRequirement === "technical_consultation" || purchaseRequirement === "restricted") && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="technical_notice">پیام هشدار فنی</Label>
                <Textarea id="technical_notice" rows={2} maxLength={500} {...register("technical_notice")} />
              </div>
            )}

            {purchaseRequirement === "professional_installation" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="installation_notice">پیام هشدار نصب</Label>
                <Textarea id="installation_notice" rows={2} maxLength={500} {...register("installation_notice")} />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compatibility_notice">پیام سازگاری (اختیاری)</Label>
              <Textarea id="compatibility_notice" rows={2} maxLength={500} {...register("compatibility_notice")} />
            </div>
          </>
        )}

        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <Label htmlFor="support_contact_enabled">نمایش دکمه تماس با پشتیبانی</Label>
          <Controller
            control={control}
            name="support_contact_enabled"
            render={({ field }) => (
              <Switch id="support_contact_enabled" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <Label htmlFor="purchase_confirmation_required">نیاز به تأیید قبل از خرید</Label>
          <Controller
            control={control}
            name="purchase_confirmation_required"
            render={({ field }) => (
              <Switch
                id="purchase_confirmation_required"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </div>
    </details>
  )
}