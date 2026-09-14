import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useSenderAddresses } from "../hooks/useSenderAddresses"
import { useCreateSenderAddress } from "../hooks/useCreateSenderAddress"
import type { CreateSenderAddressPayload } from "../types/Label"

interface SenderAddressFieldProps {
    value: number | null
    onChange: (senderAddressId: number) => void
}

const EMPTY_FORM: CreateSenderAddressPayload = {
    label: "",
    sender_name: "",
    sender_phone: "",
    province_name: "",
    city_name: "",
    district: "",
    postal_code: "",
    address_line: "",
    plaque: "",
    unit: "",
    is_default: false,
}

export function SenderAddressField({ value, onChange }: SenderAddressFieldProps) {
    const { data: addresses, isLoading } = useSenderAddresses()
    const createMutation = useCreateSenderAddress()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [form, setForm] = useState<CreateSenderAddressPayload>(EMPTY_FORM)

    function updateField<K extends keyof CreateSenderAddressPayload>(key: K, fieldValue: CreateSenderAddressPayload[K]) {
        setForm((prev) => ({ ...prev, [key]: fieldValue }))
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        createMutation.mutate(form, {
            onSuccess: (created) => {
                onChange(created.id)
                setForm(EMPTY_FORM)
                setDialogOpen(false)
            },
        })
    }

    return (
        <div className="flex flex-col gap-2">
            <Label>آدرس فرستنده</Label>
            <div className="flex items-center gap-2">
                <Select
                    value={value ? String(value) : undefined}
                    onValueChange={(v) => onChange(Number(v))}
                    disabled={isLoading}
                >
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="انتخاب آدرس فرستنده" />
                    </SelectTrigger>
                    <SelectContent>
                        {addresses?.map((addr) => (
                            <SelectItem key={addr.id} value={String(addr.id)}>
                                {addr.label}
                                {addr.is_default ? " (پیش‌فرض)" : ""}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                            + آدرس جدید
                        </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl">
                        <DialogHeader>
                            <DialogTitle>آدرس فرستنده‌ی جدید</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                            <Input
                                placeholder="عنوان (مثلاً: انبار مرکزی)"
                                value={form.label}
                                onChange={(e) => updateField("label", e.target.value)}
                                required
                            />
                            <Input
                                placeholder="نام فرستنده"
                                value={form.sender_name}
                                onChange={(e) => updateField("sender_name", e.target.value)}
                                required
                            />
                            <Input
                                placeholder="شماره تماس فرستنده"
                                value={form.sender_phone}
                                onChange={(e) => updateField("sender_phone", e.target.value)}
                                dir="ltr"
                                required
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    placeholder="استان"
                                    value={form.province_name}
                                    onChange={(e) => updateField("province_name", e.target.value)}
                                    required
                                />
                                <Input
                                    placeholder="شهر"
                                    value={form.city_name}
                                    onChange={(e) => updateField("city_name", e.target.value)}
                                    required
                                />
                            </div>
                            <Input
                                placeholder="آدرس کامل"
                                value={form.address_line}
                                onChange={(e) => updateField("address_line", e.target.value)}
                                required
                            />
                            <div className="grid grid-cols-3 gap-3">
                                <Input
                                    placeholder="پلاک"
                                    value={form.plaque ?? ""}
                                    onChange={(e) => updateField("plaque", e.target.value)}
                                />
                                <Input
                                    placeholder="واحد"
                                    value={form.unit ?? ""}
                                    onChange={(e) => updateField("unit", e.target.value)}
                                />
                                <Input
                                    placeholder="کدپستی"
                                    value={form.postal_code}
                                    onChange={(e) => updateField("postal_code", e.target.value)}
                                    dir="ltr"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? "در حال ذخیره..." : "ذخیره"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}