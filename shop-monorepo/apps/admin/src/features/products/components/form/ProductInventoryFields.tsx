import { Controller, type UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProductFormValues } from "../../schema"

interface ProductInventoryFieldsProps {
  form: UseFormReturn<ProductFormValues>
}

export function ProductInventoryFields({ form }: ProductInventoryFieldsProps) {
  const { register, control, formState } = form

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stock_quantity">موجودی انبار</Label>
          <Input id="stock_quantity" type="number" min={0} {...register("stock_quantity", { valueAsNumber: true })} />
          {formState.errors.stock_quantity && (
            <p className="text-xs text-danger">{formState.errors.stock_quantity.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="weight_grams">وزن (گرم)</Label>
          <Input id="weight_grams" type="number" min={0} {...register("weight_grams", { valueAsNumber: true })} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stock_status">وضعیت موجودی</Label>
        <Controller
          control={control}
          name="stock_status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="stock_status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">موجود</SelectItem>
                <SelectItem value="out_of_stock">ناموجود</SelectItem>
                <SelectItem value="preorder">پیش‌سفارش</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
        <Label htmlFor="is_active">فعال باشد</Label>
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />}
        />
      </div>
    </div>
  )
}
