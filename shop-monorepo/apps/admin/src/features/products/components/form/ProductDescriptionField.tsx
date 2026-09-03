// src/features/products/components/form/ProductDescriptionField.tsx
import { useState } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProductDescriptionEditor } from '../ProductDescriptionEditor'
import { sanitizeDescriptionHtml, htmlToPlainText } from '../../utils/sanitizeDescriptionHtml'
import type { ProductFormValues } from '../../schema'

interface ProductDescriptionFieldProps {
  form: UseFormReturn<ProductFormValues>
  name: 'description' | 'short_description'
  label: string
  maxLength: number
  /** حالت جمع‌وجورتر ادیتور (برای توضیح کوتاه) */
  compact?: boolean
}

export function ProductDescriptionField({ form, name, label, maxLength, compact = false }: ProductDescriptionFieldProps) {
  const { control, formState } = form
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draftHtml, setDraftHtml] = useState('')
  const error = formState.errors[name]

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const currentHtml = (field.value as string) ?? ''
        const preview = htmlToPlainText(currentHtml)

        function openEditor() {
          setDraftHtml(currentHtml)
          setDialogOpen(true)
        }

        function saveEditor() {
          field.onChange(sanitizeDescriptionHtml(draftHtml))
          setDialogOpen(false)
        }

        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-medium text-slate-200">{label}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openEditor}
                className="h-8 gap-1.5 border-slate-700/80 bg-slate-800/80 text-xs text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                <Pencil className="h-3.5 w-3.5 text-indigo-400" />
                {currentHtml ? 'ویرایش' : 'نوشتن'}
              </Button>
            </div>

            {/* باکس پیش‌نمایش متن */}
            <button
              type="button"
              onClick={openEditor}
              className="group relative min-h-[72px] w-full rounded-lg border border-slate-700/80 bg-slate-900/90 p-3 text-right text-sm transition-all duration-200 hover:border-indigo-500/50 hover:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {preview ? (
                <span className="line-clamp-3 whitespace-pre-line text-slate-200 group-hover:text-white">
                  {preview}
                </span>
              ) : (
                <span className="text-slate-500 group-hover:text-slate-400">
                  چیزی نوشته نشده — برای افزودن کلیک کنید.
                </span>
              )}
            </button>

            {error && <p className="text-xs font-medium text-rose-400">{error.message as string}</p>}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              {/* 
                1. z-[100] و اضافه کردن shadow-2xl برای تفکیک کامل مودال ادیتور از مودال اصلی زیرین
                2. border-slate-700 و bg-slate-950 جهت ایجاد تضاد تیره استاندارد
              */}
              <DialogContent
                className="z-[100] flex max-h-[90vh] w-[min(96vw,720px)] flex-col gap-4 border-slate-700 bg-slate-950 p-6 text-slate-100 shadow-2xl backdrop-blur-xl lg:w-[min(90vw,1024px)]"
                dir="rtl"
              >
                <DialogHeader className="gap-1 text-right">
                  <DialogTitle className="text-lg font-bold text-white">{label}</DialogTitle>
                  <DialogDescription className="text-xs text-slate-400 leading-relaxed">
                    فقط فرمت‌های پایه (تیتر، پررنگ/ایتالیک، لیست، نقل‌قول{compact ? '' : '، جدول'}، لینک) پشتیبانی می‌شود؛ سایر تگ‌ها هنگام ذخیره حذف می‌شوند.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <ProductDescriptionEditor
                    value={draftHtml}
                    onChange={setDraftHtml}
                    compact={compact}
                    maxLength={maxLength}
                    placeholder={`${label} را بنویسید...`}
                  />
                </div>

                <DialogFooter className="flex-row justify-end gap-2 border-t border-slate-800/80 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="button"
                    onClick={saveEditor}
                    className="bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  >
                    اعمال در فرم
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )
      }}
    />
  )
}