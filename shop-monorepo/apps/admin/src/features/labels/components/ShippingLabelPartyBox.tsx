import type { ReactNode } from "react"
import { Home, MapPin, Phone, Mail } from "lucide-react"

type ShippingLabelPartyBoxProps = {
	icon: ReactNode
	title: string
	subtitleLabel: string
	name?: string | null
	province?: string | null
	city?: string | null
	addressLine?: string | null
	phone?: string | null
	postalCode?: string | null
}

export function ShippingLabelPartyBox({
	icon,
	title,
	subtitleLabel,
	name,
	province,
	city,
	addressLine,
	phone,
	postalCode,
}: ShippingLabelPartyBoxProps) {
	return (
		<div className="shipping-label-party">
			{/* Party heading */}
			<div className="shipping-label-party-header">
				<div className="shipping-label-party-header-top">
					<span className="shipping-label-icon-badge">
						{icon}
					</span>

					<div className="shipping-label-party-heading">
						<span className="shipping-label-party-title">
							{title}
						</span>

						<span className="shipping-label-party-subtitle">
							{subtitleLabel}
							<strong>{name || "—"}</strong>
						</span>
					</div>
				</div>
			</div>

			<div className="shipping-label-divider" />

			{/* Province + city */}
			<div className="shipping-label-location-row">
				<div className="shipping-label-location-item">
					<span className="shipping-label-location-label">
						استان
					</span>

					<span className="shipping-label-location-value">
						{province || "—"}
					</span>
				</div>

				<div className="shipping-label-location-divider" />

				<div className="shipping-label-location-item">
					<span className="shipping-label-location-label">
						شهر
					</span>

					<span className="shipping-label-location-value">
						{city || "—"}
					</span>
				</div>
			</div>

			<div className="shipping-label-divider" />

			{/* Address */}
			<div className="shipping-label-address">
				<div className="shipping-label-address-heading">
					<Home />
					<span>آدرس</span>
				</div>

				<div className="shipping-label-address-text">
					{addressLine || "—"}
				</div>
			</div>

			<div className="shipping-label-divider" />

			{/* Phone + postal code */}
			<div className="shipping-label-split-row">
				<div className="shipping-label-split-col">
					<span className="shipping-label-split-label">
						<Phone />
						تلفن
					</span>

					<span className="shipping-label-split-value">
						{phone || "—"}
					</span>
				</div>

				<div className="shipping-label-split-divider" />

				<div className="shipping-label-split-col">
					<span className="shipping-label-split-label">
						<Mail />
						کدپستی
					</span>

					<span className="shipping-label-split-value">
						{postalCode || "—"}
					</span>
				</div>
			</div>
		</div>
	)
}