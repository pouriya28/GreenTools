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
    <details className="rounded-md border border-border px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium text-text-2">تنزیمات سئو (اختیاری)</summary>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meta_title">عنوان متا</Label>
          <Input id="meta_title" maxLength={180} {...register("meta_title")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meta_description">توضیح متا</Label>
          <Textarea id="meta_description" rows={2} maxLength={300} {...register("meta_description")} />
        </div>
      </div>
    </details>
  )
}
