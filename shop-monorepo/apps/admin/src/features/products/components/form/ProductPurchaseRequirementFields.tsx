// src/features/products/components/form/ProductPurchaseRequirementFields.tsx
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
    <details className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-all duration-200 open:bg-slate-900/80 open:shadow-lg">
      <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-200 select-none hover:text-white">
        <span>شرایط خرید</span>
        <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform duration-200">
          ▼
        </span>
      </summary>

      <div className="mt-4 flex flex-col gap-5 border-t border-slate-800/80 pt-4">
        {/* نوع شرایط خرید */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="purchase_requirement" className="text-sm font-medium text-slate-200">
            نوع شرایط خرید
          </Label>
          <Controller
            control={control}
            name="purchase_requirement"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="purchase_requirement"
                  className="h-11 w-full border-slate-700/80 bg-slate-900/90 text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[99999] border-slate-700 bg-slate-900/98 p-1 text-slate-100 shadow-2xl backdrop-blur-md">
                  <SelectItem value="standard" className="cursor-pointer rounded-md text-sm text-slate-200 focus:bg-indigo-600 focus:text-white">
                    خرید عادی
                  </SelectItem>
                  <SelectItem value="technical_consultation" className="cursor-pointer rounded-md text-sm text-slate-200 focus:bg-indigo-600 focus:text-white">
                    نیاز به مشاوره فنی
                  </SelectItem>
                  <SelectItem value="professional_installation" className="cursor-pointer rounded-md text-sm text-slate-200 focus:bg-indigo-600 focus:text-white">
                    نیاز به نصب تخصصی
                  </SelectItem>
                  <SelectItem value="restricted" className="cursor-pointer rounded-md text-sm text-slate-200 focus:bg-indigo-600 focus:text-white">
                    محدود - نیاز به تماس با پشتیبانی
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* پیام‌های هشدار مشروط */}
        {purchaseRequirement !== "standard" && (
          <div className="flex flex-col gap-4 animate-in fade-in-50 duration-200">
            {(purchaseRequirement === "technical_consultation" || purchaseRequirement === "restricted") && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="technical_notice" className="text-sm font-medium text-slate-200">
                  پیام هشدار فنی
                </Label>
                <Textarea
                  id="technical_notice"
                  rows={2}
                  maxLength={500}
                  className="resize-y border-slate-700/80 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
                  {...register("technical_notice")}
                />
              </div>
            )}

            {purchaseRequirement === "professional_installation" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="installation_notice" className="text-sm font-medium text-slate-200">
                  پیام هشدار نصب
                </Label>
                <Textarea
                  id="installation_notice"
                  rows={2}
                  maxLength={500}
                  className="resize-y border-slate-700/80 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
                  {...register("installation_notice")}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="compatibility_notice" className="text-sm font-medium text-slate-200">
                پیام سازگاری (اختیاری)
              </Label>
              <Textarea
                id="compatibility_notice"
                rows={2}
                maxLength={500}
                className="resize-y border-slate-700/80 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
                {...register("compatibility_notice")}
              />
            </div>
          </div>
        )}

        {/* سوییچ نمایش دکمه تماس با پشتیبانی */}
        <div className="flex items-center justify-between rounded-lg border border-slate-700/80 bg-slate-900/50 p-3.5 transition-colors hover:bg-slate-900/80">
          <Label htmlFor="support_contact_enabled" className="cursor-pointer text-sm font-medium text-slate-200">
            نمایش دکمه تماس با پشتیبانی
          </Label>
          <Controller
            control={control}
            name="support_contact_enabled"
            render={({ field }) => (
              <Switch
                id="support_contact_enabled"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="data-[state=checked]:bg-indigo-600"
              />
            )}
          />
        </div>

        {/* سوییچ نیاز به تأیید قبل از خرید */}
        <div className="flex items-center justify-between rounded-lg border border-slate-700/80 bg-slate-900/50 p-3.5 transition-colors hover:bg-slate-900/80">
          <Label htmlFor="purchase_confirmation_required" className="cursor-pointer text-sm font-medium text-slate-200">
            نیاز به تأیید قبل از خرید
          </Label>
          <Controller
            control={control}
            name="purchase_confirmation_required"
            render={({ field }) => (
              <Switch
                id="purchase_confirmation_required"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="data-[state=checked]:bg-indigo-600"
              />
            )}
          />
        </div>
      </div>
    </details>
  )
}