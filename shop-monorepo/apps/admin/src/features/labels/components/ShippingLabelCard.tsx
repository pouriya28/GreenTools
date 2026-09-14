import { Scissors, User } from "lucide-react"
import type {
	ShippingLabelItem,
	ShippingLabelSender,
} from "../types/Label"
import { ShippingLabelPartyBox } from "./ShippingLabelPartyBox"

type ShippingLabelCardProps = {
	sender: ShippingLabelSender
	item: ShippingLabelItem
	widthMm: number
	heightMm: number
}

export function ShippingLabelCard({
	sender,
	item,
	widthMm,
	heightMm,
}: ShippingLabelCardProps) {
	return (
		<div
			className="shipping-label"
			style={{
				width: `${widthMm}mm`,
				height: `${heightMm}mm`,
			}}
		>
			<ShippingLabelPartyBox
				icon={<User />}
				title="فرستنده"
				subtitleLabel="ارسال از"
				name={sender.sender_name}
				province={sender.province_name}
				city={sender.city_name}
				addressLine={sender.address_line}
				phone={sender.sender_phone}
				postalCode={sender.postal_code}
			/>

			<div className="shipping-label-cut">
				<Scissors />
			</div>

			<ShippingLabelPartyBox
				icon={<User />}
				title="گیرنده"
				subtitleLabel="تحویل به"
				name={item.recipient_name}
				province={item.province_name}
				city={item.city_name}
				addressLine={item.address_line}
				phone={item.recipient_phone}
				postalCode={item.postal_code}
			/>
		</div>
	)
}