import { Controller, type UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProductFormValues } from "../../schema"
import type { CategoryOption } from "../../utils"

interface ProductBasicInfoFieldsProps {
  form: UseFormReturn<ProductFormValues>
  categoryOptions: CategoryOption[]
}

export function ProductBasicInfoFields({ form, categoryOptions }: ProductBasicInfoFieldsProps) {
  const { register, control, formState } = form

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">نام محصول</Label>
        <Input id="name" maxLength={200} autoFocus {...register("name")} />
        {formState.errors.name && <p className="text-xs text-danger">{formState.errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" maxLength={64} {...register("sku")} />
          {formState.errors.sku && <p className="text-xs text-danger">{formState.errors.sku.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category_id">دسته‌بندی</Label>
          <Controller
            control={control}
            name="category_id"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <SelectTrigger id="category_id">
                  <SelectValue placeholder="انتخاب دسته‌بندی" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {"\u2014 ".repeat(option.depth)}
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {formState.errors.category_id && (
            <p className="text-xs text-danger">{formState.errors.category_id.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="short_description">توضیح کوتاه</Label>
        <Textarea id="short_description" rows={2} maxLength={500} {...register("short_description")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">توضیحات کامل</Label>
        <Textarea id="description" rows={5} maxLength={20000} {...register("description")} />
      </div>
    </div>
  )
}
