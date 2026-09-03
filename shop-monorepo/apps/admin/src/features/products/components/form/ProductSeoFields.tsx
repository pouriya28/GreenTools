// src/features/products/components/form/ProductSeoFields.tsx
import type { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ProductFormValues } from "../../schema"

interface ProductSeoFieldsProps {
  form: UseFormReturn<ProductFormValues>
}

export function ProductSeoFields({ form }: ProductSeoFieldsProps) {
  const { register } = form

  return (
    <details className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-all duration-200 open:bg-slate-900/80 open:shadow-lg">
      <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-200 select-none hover:text-white">
        <span>تنظیمات سئو (اختیاری)</span>
        <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform duration-200">
          ▼
        </span>
      </summary>

      <div className="mt-4 flex flex-col gap-4 border-t border-slate-800/80 pt-4">
        {/* عنوان متا */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="meta_title" className="text-sm font-medium text-slate-200">
            عنوان متا
          </Label>
          <Input
            id="meta_title"
            maxLength={180}
            className="h-11 border-slate-700/80 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
            {...register("meta_title")}
          />
        </div>

        {/* توضیح متا */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="meta_description" className="text-sm font-medium text-slate-200">
            توضیح متا
          </Label>
          <Textarea
            id="meta_description"
            rows={2}
            maxLength={300}
            className="resize-y border-slate-700/80 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
            {...register("meta_description")}
          />
        </div>
      </div>
    </details>
  )
}