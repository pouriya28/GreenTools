import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ShippingLabelCard } from "@/features/labels/components/ShippingLabelCard"
import type { ShippingLabelItem, ShippingLabelSender } from "@/features/labels/types/Label"

const mockSender: ShippingLabelSender = {
    sender_name: "علی احمدی",
    sender_phone: "09121234567",
    province_name: "تهران",
    city_name: "تهران",
    district: null,
    address_line: "خیابان آزادی",
    plaque: "10",
    unit: null,
    postal_code: "1234567890",
}

const mockItem: ShippingLabelItem = {
    order_id: 1,
    recipient_name: "سارا رضایی",
    recipient_phone: "09351234567",
    province_name: "اصفهان",
    city_name: "اصفهان",
    district: null,
    address_line: "خیابان چهارباغ",
    plaque: "5",
    unit: null,
    postal_code: "8765432109",
}

function renderCard(
    sender = mockSender,
    item = mockItem,
    widthMm = 100,
    heightMm = 150,
) {
    return render(
        <ShippingLabelCard
            sender={sender}
            item={item}
            widthMm={widthMm}
            heightMm={heightMm}
        />,
    )
}

describe("ShippingLabelCard", () => {
    describe("sender section", () => {
        it("renders فرستنده title", () => {
            renderCard()
            expect(screen.getByText("فرستنده")).toBeInTheDocument()
        })

        it("renders sender name", () => {
            renderCard()
            expect(screen.getByText("علی احمدی")).toBeInTheDocument()
        })

        it("renders sender phone", () => {
            renderCard()
            expect(screen.getByText("09121234567")).toBeInTheDocument()
        })

        it("renders sender province", () => {
            renderCard()
            // تهران appears for both sender city and province — just check it's present
            expect(screen.getAllByText("تهران").length).toBeGreaterThanOrEqual(1)
        })

        it("renders sender address", () => {
            renderCard()
            expect(screen.getByText("خیابان آزادی")).toBeInTheDocument()
        })

        it("renders sender postal code", () => {
            renderCard()
            expect(screen.getByText("1234567890")).toBeInTheDocument()
        })
    })

    describe("recipient section", () => {
        it("renders گیرنده title", () => {
            renderCard()
            expect(screen.getByText("گیرنده")).toBeInTheDocument()
        })

        it("renders recipient name", () => {
            renderCard()
            expect(screen.getByText("سارا رضایی")).toBeInTheDocument()
        })

        it("renders recipient phone", () => {
            renderCard()
            expect(screen.getByText("09351234567")).toBeInTheDocument()
        })

        it("renders recipient city", () => {
            renderCard()
            // province and city both show "اصفهان" — verify at least one exists
            expect(screen.getAllByText("اصفهان").length).toBeGreaterThanOrEqual(1)
        })

        it("renders recipient address", () => {
            renderCard()
            expect(screen.getByText("خیابان چهارباغ")).toBeInTheDocument()
        })

        it("renders recipient postal code", () => {
            renderCard()
            expect(screen.getByText("8765432109")).toBeInTheDocument()
        })
    })

    describe("layout", () => {
        it("applies width and height as inline styles", () => {
            const { container } = renderCard(mockSender, mockItem, 100, 150)
            const card = container.firstChild as HTMLElement
            expect(card.style.width).toBe("100mm")
            expect(card.style.height).toBe("150mm")
        })

        it("applies different dimensions correctly", () => {
            const { container } = renderCard(mockSender, mockItem, 100, 100)
            const card = container.firstChild as HTMLElement
            expect(card.style.width).toBe("100mm")
            expect(card.style.height).toBe("100mm")
        })
    })

    describe("null recipient fields — shows fallbacks", () => {
        it("shows — when recipient_name is null", () => {
            renderCard(mockSender, { ...mockItem, recipient_name: null })
            // at least one — present (recipient name box)
            expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1)
        })

        it("shows — when recipient_phone is null", () => {
            renderCard(mockSender, { ...mockItem, recipient_phone: null })
            expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1)
        })

        it("shows — when address_line is null", () => {
            renderCard(mockSender, { ...mockItem, address_line: null })
            expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1)
        })
    })

    describe("security", () => {
        it("does not execute XSS in recipient name", () => {
            const xss = '<img src=x onerror="window.__xss=true">'
            renderCard(mockSender, { ...mockItem, recipient_name: xss })
            expect((window as unknown as Record<string, unknown>).__xss).toBeUndefined()
            expect(screen.getByText(xss)).toBeInTheDocument()
        })

        it("does not execute XSS in sender address", () => {
            const xss = '<script>window.__xss2=true</script>'
            renderCard({ ...mockSender, address_line: xss })
            expect((window as unknown as Record<string, unknown>).__xss2).toBeUndefined()
        })
    })
})
