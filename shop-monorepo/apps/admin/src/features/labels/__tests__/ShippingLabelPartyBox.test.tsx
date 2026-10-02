import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { User } from "lucide-react"
import { ShippingLabelPartyBox } from "@/features/labels/components/ShippingLabelPartyBox"

const defaultProps = {
    icon: <User />,
    title: "فرستنده",
    subtitleLabel: "ارسال از",
    name: "علی احمدی",
    province: "تهران",
    city: "تهران",
    addressLine: "خیابان آزادی، پلاک ۱۰",
    phone: "09121234567",
    postalCode: "1234567890",
}

describe("ShippingLabelPartyBox", () => {
    describe("rendering", () => {
        it("renders title", () => {
            render(<ShippingLabelPartyBox {...defaultProps} />)
            expect(screen.getByText("فرستنده")).toBeInTheDocument()
        })

        it("renders subtitle label", () => {
            render(<ShippingLabelPartyBox {...defaultProps} />)
            expect(screen.getByText(/ارسال از/)).toBeInTheDocument()
        })

        it("renders name in subtitle", () => {
            render(<ShippingLabelPartyBox {...defaultProps} />)
            expect(screen.getByText("علی احمدی")).toBeInTheDocument()
        })

    it("renders province", () => {
        render(<ShippingLabelPartyBox {...defaultProps} province="تهران" city="کرج" />)
        expect(screen.getByText("تهران")).toBeInTheDocument()
    })

        it("renders address line", () => {
            render(<ShippingLabelPartyBox {...defaultProps} />)
            expect(screen.getByText("خیابان آزادی، پلاک ۱۰")).toBeInTheDocument()
        })

        it("renders phone number", () => {
            render(<ShippingLabelPartyBox {...defaultProps} />)
            expect(screen.getByText("09121234567")).toBeInTheDocument()
        })

        it("renders postal code", () => {
            render(<ShippingLabelPartyBox {...defaultProps} />)
            expect(screen.getByText("1234567890")).toBeInTheDocument()
        })
    })

    describe("fallbacks — shows — when data is missing", () => {
        it("shows — when name is null", () => {
            render(<ShippingLabelPartyBox {...defaultProps} name={null} />)
            expect(screen.getByText("—")).toBeInTheDocument()
        })

        it("shows — when province is null", () => {
            render(<ShippingLabelPartyBox {...defaultProps} province={null} />)
            // province cell shows —
            const cells = screen.getAllByText("—")
            expect(cells.length).toBeGreaterThanOrEqual(1)
        })

        it("shows — when city is null", () => {
            render(<ShippingLabelPartyBox {...defaultProps} city={null} />)
            expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1)
        })

        it("shows — when addressLine is null", () => {
            render(<ShippingLabelPartyBox {...defaultProps} addressLine={null} />)
            expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1)
        })

        it("shows — when phone is null", () => {
            render(<ShippingLabelPartyBox {...defaultProps} phone={null} />)
            expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1)
        })

        it("shows — when postalCode is null", () => {
            render(<ShippingLabelPartyBox {...defaultProps} postalCode={null} />)
            expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1)
        })

        it("shows — for name when undefined", () => {
            render(<ShippingLabelPartyBox {...defaultProps} name={undefined} />)
            expect(screen.getByText("—")).toBeInTheDocument()
        })
    })

    describe("different titles", () => {
        it("renders گیرنده title correctly", () => {
            render(<ShippingLabelPartyBox {...defaultProps} title="گیرنده" subtitleLabel="تحویل به" />)
            expect(screen.getByText("گیرنده")).toBeInTheDocument()
            expect(screen.getByText(/تحویل به/)).toBeInTheDocument()
        })
    })

    describe("security", () => {
        it("does not execute XSS in name", () => {
            const xss = '<img src=x onerror="window.__xss=true">'
            render(<ShippingLabelPartyBox {...defaultProps} name={xss} />)
            expect((window as unknown as Record<string, unknown>).__xss).toBeUndefined()
            expect(screen.getByText(xss)).toBeInTheDocument()
        })

        it("does not execute XSS in addressLine", () => {
            const xss = '<script>window.__xss2=true</script>'
            render(<ShippingLabelPartyBox {...defaultProps} addressLine={xss} />)
            expect((window as unknown as Record<string, unknown>).__xss2).toBeUndefined()
        })
    })
})
