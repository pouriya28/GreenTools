// src/features/products/components/form/ProductBasicInfoFields.tsx
import { Controller, type UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProductFormValues } from "../../schema"
import type { CategoryOption } from "../../utils"
import { ProductDescriptionField } from "./ProductDescriptionField"

interface ProductBasicInfoFieldsProps {
  form: UseFormReturn<ProductFormValues>
  categoryOptions: CategoryOption[]
}

export function ProductBasicInfoFields({ form, categoryOptions }: ProductBasicInfoFieldsProps) {
  const { register, control, formState } = form

  return (
    <div className="flex flex-col gap-5">
      {/* نام محصول */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-sm font-medium text-slate-200">
          نام محصول
        </Label>
        <Input
          id="name"
          maxLength={200}
          autoFocus
          className="h-11 border-slate-700/80 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
          {...register("name")}
        />
        {formState.errors.name && (
          <p className="text-xs font-medium text-rose-400">{formState.errors.name.message}</p>
        )}
      </div>

      {/* دسته‌بندی و SKU */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* دسته‌بندی */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="category_id" className="text-sm font-medium text-slate-200">
            دسته‌بندی
          </Label>
          <Controller
            control={control}
            name="category_id"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <SelectTrigger
                  id="category_id"
                  className="h-11 w-full border-slate-700/80 bg-slate-900/90 text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
                >
                  <SelectValue placeholder="انتخاب دسته‌بندی" />
                </SelectTrigger>
                {/* 
                  افزایش z-index به 99999 و اعمال پس‌زمینه کدر و شیشه‌ای (backdrop-blur) 
                  جهت جلوگیری از افتادن متن روی عناصر زیرین و خوانایی کامل
                */}
                <SelectContent className="z-[99999] max-h-72 border-slate-700 bg-slate-900/98 p-1 text-slate-100 shadow-2xl backdrop-blur-md">
                  {categoryOptions.map((option) => (
                    <SelectItem
                      key={option.id}
                      value={String(option.id)}
                      className="cursor-pointer rounded-md text-sm text-slate-200 transition-colors focus:bg-indigo-600 focus:text-white"
                    >
                      <span className="font-mono text-slate-500">{ "\u2014 ".repeat(option.depth) }</span>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {formState.errors.category_id && (
            <p className="text-xs font-medium text-rose-400">{formState.errors.category_id.message}</p>
          )}
        </div>

        {/* SKU */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="sku" className="text-sm font-medium text-slate-200">
            SKU (اختیاری)
          </Label>
          <Input
            id="sku"
            maxLength={64}
            placeholder="خالی بگذارید تا خودکار ساخته شود"
            className="h-11 border-slate-700/80 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
            {...register("sku")}
          />
          {formState.errors.sku && (
            <p className="text-xs font-medium text-rose-400">{formState.errors.sku.message}</p>
          )}
        </div>
      </div>

      {/* توضیح کوتاه */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="short_description" className="text-sm font-medium text-slate-200">
          توضیح کوتاه
        </Label>
        <Textarea
          id="short_description"
          rows={3}
          maxLength={500}
          className="resize-y border-slate-700/80 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
          {...register("short_description")}
        />
        {formState.errors.short_description && (
          <p className="text-xs font-medium text-rose-400">{formState.errors.short_description.message}</p>
        )}
      </div>

      {/* توضیحات کامل */}
      <ProductDescriptionField form={form} name="description" label="توضیحات کامل" maxLength={20000} />
    </div>
  )
}