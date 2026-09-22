import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Loader2, Printer, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useOrders } from "@/features/orders/hooks/useOrders"
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge"
import { SenderAddressField } from "../components/SenderAddressField"
import { ShippingLabelSheetView } from "../components/ShippingLabelSheetView"
import { useGenerateShippingLabels } from "../hooks/useGenerateShippingLabels"
import { openLabelsPrintWindow } from "../utils/openLabelsPrintWindow"
import type { LabelSize, PaperSize, ShippingLabelSheet } from "../types/Label"
import "../styles/shipping-label.css"

export default function PrintLabelsPage() {
	const navigate = useNavigate()
	const { data, isLoading, isError } = useOrders({ status: "packed", per_page: 50, page: 1 })
	const [selectedIds, setSelectedIds] = useState<number[]>([])
	const [senderAddressId, setSenderAddressId] = useState<number | null>(null)
	const [paperSize, setPaperSize] = useState<PaperSize>("a4")
	const [labelSize, setLabelSize] = useState<LabelSize>("10x15")
	const [copiesPerOrder, setCopiesPerOrder] = useState(1)
	const [sheet, setSheet] = useState<ShippingLabelSheet | null>(null)
	const generateMutation = useGenerateShippingLabels()

	const orders = data?.data ?? []
	const allSelected = orders.length > 0 && selectedIds.length === orders.length

	function toggleAll() {
		setSelectedIds(allSelected ? [] : orders.map((o) => o.id))
	}

	function toggleOne(id: number) {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
	}

	function closePreview() {
		setSheet(null)
	}

	async function handleGenerate(mode: "preview" | "print") {
		if (selectedIds.length === 0 || !senderAddressId) return
		const result = await generateMutation.mutateAsync({
			order_ids: selectedIds,
			sender_address_id: senderAddressId,
			paper_size: paperSize,
			label_size: labelSize,
			copies_per_order: copiesPerOrder,
		})
		setSheet(result)
		// "چاپ" never prints the current tab — it always hands the sheet off to
		// a fresh, chrome-free window so Ctrl+P there only ever sees the labels.
		if (mode === "print") openLabelsPrintWindow(result)
	}

	const canGenerate = selectedIds.length > 0 && senderAddressId !== null && !generateMutation.isPending

	return (
		<div className="flex flex-col gap-6" dir="rtl">
			<div className="flex items-center gap-3">
				<Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)}>
					<ArrowRight className="h-4 w-4" />
					بازگشت
				</Button>
				<div>
					<h1 className="text-xl font-bold text-text-1">چاپ لیبل ارسال</h1>
					<p className="text-sm text-text-2">
						سفارش‌های در وضعیت «بسته‌بندی‌شده» را انتخاب و لیبل چاپ کنید. دکمه‌ی «چاپ» یک پنجره‌ی
						جدید فقط با لیبل‌ها باز می‌کند؛ در آن پنجره Margins را روی None و Scale را روی ۱۰۰٪
						تنظیم کنید تا اندازه‌ی لیبل دقیق بماند.
					</p>
				</div>
			</div>

			<div className="flex flex-wrap items-end gap-4 rounded-xl border border-border p-4">
				<SenderAddressField value={senderAddressId} onChange={setSenderAddressId} />
				<div className="flex flex-col gap-2">
					<span className="text-sm text-text-2">سایز کاغذ</span>
					<Select value={paperSize} onValueChange={(v) => setPaperSize(v as PaperSize)}>
						<SelectTrigger className="w-28">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="a4">A4</SelectItem>
							<SelectItem value="a5">A5</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-2">
					<span className="text-sm text-text-2">سایز لیبل</span>
					<Select value={labelSize} onValueChange={(v) => setLabelSize(v as LabelSize)}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="10x15">۱۰×۱۵</SelectItem>
							<SelectItem value="10x10">۱۰×۱۰</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-2">
					<span className="text-sm text-text-2">تعداد نسخه به ازای هر سفارش</span>
					<Input
						type="number"
						min={1}
						max={10}
						className="w-24"
						value={copiesPerOrder}
						onChange={(e) => setCopiesPerOrder(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
					/>
				</div>
				<div className="mr-auto flex gap-2">
					<Button type="button" variant="outline" disabled={!canGenerate} onClick={() => handleGenerate("preview")}>
						{generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
						پیش‌نمایش
					</Button>
					<Button type="button" disabled={!canGenerate} onClick={() => handleGenerate("print")}>
						<Printer className="h-4 w-4" />
						چاپ ({selectedIds.length} سفارش)
					</Button>
				</div>
			</div>

			{isLoading && (
				<div className="flex items-center justify-center gap-2 rounded-xl border border-border py-16 text-text-2">
					<Loader2 className="h-5 w-5 animate-spin" />
					در حال بارگذاری سفارش‌ها...
				</div>
			)}
			{isError && (
				<div className="rounded-xl border border-danger/30 bg-danger/10 py-8 text-center text-danger">
					دریافت سفارش‌ها با خطا مواجه شد.
				</div>
			)}
			{!isLoading && !isError && orders.length === 0 && (
				<div className="rounded-xl border border-dashed border-border py-16 text-center text-text-2">
					سفارشی در وضعیت «بسته‌بندی‌شده» برای چاپ لیبل وجود ندارد.
				</div>
			)}
			{!isLoading && !isError && orders.length > 0 && (
				<div className="overflow-x-auto rounded-xl border border-border">
					<Table className="min-w-[760px] table-fixed">
						<colgroup>
							<col className="w-12" />
							<col className="w-20" />
							<col className="w-52" />
							<col className="w-32" />
							<col className="w-32" />
							<col className="w-28" />
						</colgroup>
						<TableHeader>
							<TableRow>
								<TableHead className="text-right">
									<Checkbox checked={allSelected} onCheckedChange={toggleAll} />
								</TableHead>
								<TableHead className="text-right">شماره سفارش</TableHead>
								<TableHead className="text-right">خریدار</TableHead>
								<TableHead className="text-right">وضعیت</TableHead>
								<TableHead className="text-right">تعداد اقلام</TableHead>
								<TableHead className="text-right">تاریخ ثبت</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{orders.map((order) => (
								<TableRow key={order.id} className="transition-colors hover:bg-white/[0.03]">
									<TableCell className="overflow-hidden">
										<Checkbox checked={selectedIds.includes(order.id)} onCheckedChange={() => toggleOne(order.id)} />
									</TableCell>
									<TableCell className="overflow-hidden truncate font-medium text-text-1" dir="ltr">
										#{order.id}
									</TableCell>
									<TableCell className="overflow-hidden whitespace-normal">
										<div className="flex flex-col gap-0.5 overflow-hidden">
											<span className="truncate text-sm text-text-1">{order.customer_name ?? "—"}</span>
											{order.customer_phone && (
												<span className="truncate text-xs text-text-3" dir="ltr">
													{order.customer_phone}
												</span>
											)}
										</div>
									</TableCell>
									<TableCell className="overflow-hidden">
										<OrderStatusBadge status={order.status} />
									</TableCell>
									<TableCell className="overflow-hidden truncate text-text-2">{order.items_count}</TableCell>
									<TableCell className="overflow-hidden truncate text-text-2">
										{new Date(order.created_at).toLocaleDateString("fa-IR")}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{sheet && (
				<div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-1 p-4">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<h2 className="text-sm font-semibold text-text-1">پیش‌نمایش لیبل‌ها</h2>
							<span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-text-3">
								{sheet.labels.length} لیبل · {sheet.layout.paper_size.toUpperCase()} · {sheet.layout.label_size}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Button type="button" size="sm" variant="outline" onClick={() => openLabelsPrintWindow(sheet)}>
								<Printer className="h-4 w-4" />
								چاپ همین برگه
							</Button>
							<Button type="button" size="sm" variant="ghost" onClick={closePreview}>
								<X className="h-4 w-4" />
								بستن پیش‌نمایش
							</Button>
						</div>
					</div>
					<div className="shipping-label-preview-frame">
						<ShippingLabelSheetView sheet={sheet} />
					</div>
				</div>
			)}
		</div>
	)
}