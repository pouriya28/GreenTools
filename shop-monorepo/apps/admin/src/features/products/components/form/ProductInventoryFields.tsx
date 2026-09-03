// src/features/products/components/form/ProductInventoryFields.tsx
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
    <div className="flex flex-col gap-5 border-t border-slate-800/80 pt-4">
      {/* موجودی انبار و وزن */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="stock_quantity" className="text-sm font-medium text-slate-200">
            موجودی انبار
          </Label>
          <Input
            id="stock_quantity"
            type="number"
            min={0}
            className="h-11 border-slate-700/80 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
            {...register("stock_quantity", { valueAsNumber: true })}
          />
          {formState.errors.stock_quantity && (
            <p className="text-xs font-medium text-rose-400">{formState.errors.stock_quantity.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="weight_grams" className="text-sm font-medium text-slate-200">
            وزن (گرم)
          </Label>
          <Input
            id="weight_grams"
            type="number"
            min={0}
            className="h-11 border-slate-700/80 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
            {...register("weight_grams", { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* وضعیت موجودی */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="stock_status" className="text-sm font-medium text-slate-200">
          وضعیت موجودی
        </Label>
        <Controller
          control={control}
          name="stock_status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="stock_status"
                className="h-11 w-full border-slate-700/80 bg-slate-900/90 text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[99999] border-slate-700 bg-slate-900/98 p-1 text-slate-100 shadow-2xl backdrop-blur-md">
                <SelectItem value="in_stock" className="cursor-pointer rounded-md text-sm text-slate-200 focus:bg-indigo-600 focus:text-white">
                  موجود
                </SelectItem>
                <SelectItem value="out_of_stock" className="cursor-pointer rounded-md text-sm text-slate-200 focus:bg-indigo-600 focus:text-white">
                  ناموجود
                </SelectItem>
                <SelectItem value="preorder" className="cursor-pointer rounded-md text-sm text-slate-200 focus:bg-indigo-600 focus:text-white">
                  پیش‌سفارش
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* وضعیت فعال/غیرفعال بودن محصول */}
      <div className="flex items-center justify-between rounded-lg border border-slate-700/80 bg-slate-900/50 p-3.5 transition-colors hover:bg-slate-900/80">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="is_active" className="cursor-pointer text-sm font-medium text-slate-200">
            فعال بودن محصول
          </Label>
          <span className="text-xs text-slate-400">نمایش یا عدم نمایش محصول در فروشگاه</span>
        </div>
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <Switch
              id="is_active"
              checked={field.value}
              onCheckedChange={field.onChange}
              className="data-[state=checked]:bg-indigo-600"
            />
          )}
        />
      </div>
    </div>
  )
}