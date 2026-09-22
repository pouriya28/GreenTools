import { useState } from "react"
import { Plus, X } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useAttributeOptions } from "../../hooks/useAttributes"
import type { ProductFormValues } from "../../schema"

interface ProductAttributesFieldsProps {
  form: UseFormReturn<ProductFormValues>
}

export function ProductAttributesFields({ form }: ProductAttributesFieldsProps) {
  const { data: options = [] } = useAttributeOptions()
  const rows = form.watch("attributes") ?? []

  function updateRow(index: number, patch: Partial<ProductFormValues["attributes"][number]>) {
    const next = [...rows]
    next[index] = { ...next[index], ...patch }
    form.setValue("attributes", next, { shouldDirty: true })
  }

  function addRow() {
    form.setValue("attributes", [...rows, { value: "" }], { shouldDirty: true })
  }

  function removeRow(index: number) {
    form.setValue(
      "attributes",
      rows.filter((_, i) => i !== index),
      { shouldDirty: true },
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-1">ویژگی‌های محصول</span>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4" />
          افزودن ویژگی
        </Button>
      </div>

      {rows.length === 0 && (
        <p className="text-sm text-text-2">هنوز ویژگی‌ای اضافه نشده.</p>
      )}

      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <AttributePicker
            value={row}
            options={options}
            onChange={(patch) => updateRow(index, patch)}
          />
          <Input
            placeholder="مقدار (مثلاً 220 یا قرمز)"
            value={row.value}
            onChange={(e) => updateRow(index, { value: e.target.value })}
            className="flex-1"
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(index)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}

interface AttributePickerProps {
  value: ProductFormValues["attributes"][number]
  options: { id: string; name: string; unit: string | null }[]
  onChange: (patch: Partial<ProductFormValues["attributes"][number]>) => void
}

function AttributePicker({ value, options, onChange }: AttributePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const label = value.attribute_id
    ? options.find((o) => o.id === value.attribute_id)?.name
    : value.name

  const exactMatch = options.some((o) => o.name.trim() === search.trim())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-48 justify-start font-normal">
          {label || "انتخاب یا ساخت ویژگی..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="جستجو یا نام جدید..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>موردی پیدا نشد.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  onSelect={() => {
                    onChange({ attribute_id: option.id, name: undefined, unit: option.unit })
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  {option.name}
                  {option.unit ? ` (${option.unit})` : ""}
                </CommandItem>
              ))}
              {search.trim() && !exactMatch && (
                <CommandItem
                  onSelect={() => {
                    onChange({ attribute_id: undefined, name: search.trim(), unit: null })
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  + ساخت ویژگی «{search.trim()}»
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}