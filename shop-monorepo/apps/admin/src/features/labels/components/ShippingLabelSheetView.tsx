import type { ShippingLabelSheet } from "../types/Label"
import { ShippingLabelCard } from "./ShippingLabelCard"

type ShippingLabelSheetViewProps = {
	sheet: ShippingLabelSheet
}

export function ShippingLabelSheetView({ sheet }: ShippingLabelSheetViewProps) {
	const { sender, labels, layout } = sheet

	return (
		<>
			{/* @page size must be injected dynamically since it depends on the
			    admin's selected paper size and can't be a static CSS rule. */}
			<style>{`
				@page {
					size: ${layout.paper_size === "a4" ? "A4" : "A5"};
					margin: 5mm;
				}
			`}</style>
			<div
				className="shipping-label-preview-sheet"
				style={{
					gridTemplateColumns: `repeat(${layout.columns}, ${layout.label_width_mm}mm)`,
					gridAutoRows: `${layout.label_height_mm}mm`,
				}}
			>
				{labels.map((item, index) => (
					<ShippingLabelCard
						key={`${item.order_id}-${index}`}
						sender={sender}
						item={item}
						widthMm={layout.label_width_mm}
						heightMm={layout.label_height_mm}
					/>
				))}
			</div>
		</>
	)
}