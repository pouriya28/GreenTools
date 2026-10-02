import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ShippingMethodTable } from "@/features/shippingMethods/components/ShippingMethodTable"
import type { ShippingMethod } from "@/features/shippingMethods/types/ShippingMethod"

function makeMethod(overrides: Partial<ShippingMethod> = {}): ShippingMethod {
    return {
        id: 1,
        name: "پست پیشتاز",
        code: "post-express",
        base_cost: 50000,
        calculation_type: "fixed",
        cost_per_kg: null,
        min_weight_grams: null,
        max_weight_grams: null,
        free_shipping_enabled: false,
        free_shipping_threshold: null,
        estimated_days_min: 2,
        estimated_days_max: 5,
        is_active: true,
        sort_order: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        ...overrides,
    }
}

function renderTable(
    methods: ShippingMethod[],
    onEdit = vi.fn(),
    onDeleteRequest = vi.fn(),
) {
    return render(
        <ShippingMethodTable
            shippingMethods={methods}
            onEdit={onEdit}
            onDeleteRequest={onDeleteRequest}
        />,
    )
}

describe("ShippingMethodTable", () => {
    describe("empty state", () => {
        it("shows empty message when no methods", () => {
            renderTable([])
            expect(screen.getByText(/هنوز هیچ روش ارسالی/)).toBeInTheDocument()
        })

        it("does not render table when empty", () => {
            renderTable([])
            expect(screen.queryByRole("table")).not.toBeInTheDocument()
        })
    })

    describe("rendering", () => {
        it("renders method name", () => {
            renderTable([makeMethod()])
            expect(screen.getByText("پست پیشتاز")).toBeInTheDocument()
        })

        it("renders method code", () => {
            renderTable([makeMethod()])
            expect(screen.getByText("post-express")).toBeInTheDocument()
        })

        it("renders fixed calculation type label", () => {
            renderTable([makeMethod({ calculation_type: "fixed" })])
            expect(screen.getByText("ثابت")).toBeInTheDocument()
        })

        it("renders weight calculation type label", () => {
            renderTable([makeMethod({ calculation_type: "weight" })])
            expect(screen.getByText("بر اساس وزن")).toBeInTheDocument()
        })

        it("renders base cost formatted", () => {
            renderTable([makeMethod({ base_cost: 50000 })])
            expect(screen.getByText(/۵۰٬۰۰۰ تومان/)).toBeInTheDocument()
        })

        it("shows — when free shipping is disabled", () => {
            renderTable([makeMethod({ free_shipping_enabled: false })])
            // at least one — in the row
            expect(screen.getAllByText("—").length).toBeGreaterThan(0)
        })

        it("shows free shipping threshold when enabled and threshold set", () => {
            renderTable([makeMethod({ free_shipping_enabled: true, free_shipping_threshold: 500000 })])
            expect(screen.getByText(/بالای/)).toBeInTheDocument()
            expect(screen.getByText(/۵۰۰٬۰۰۰ تومان/)).toBeInTheDocument()
        })

        it("shows 'فعال' when free_shipping_enabled but threshold is null", () => {
            renderTable([makeMethod({ free_shipping_enabled: true, free_shipping_threshold: null })])
            expect(screen.getAllByText("فعال").length).toBeGreaterThanOrEqual(1)
        })

        it("renders delivery days range", () => {
            renderTable([makeMethod({ estimated_days_min: 2, estimated_days_max: 5 })])
            expect(screen.getByText((text) => text.includes("تا") && text.includes("روز"))).toBeInTheDocument()
        })

        it("shows — when delivery days are null", () => {
            renderTable([makeMethod({ estimated_days_min: null, estimated_days_max: null })])
            expect(screen.getAllByText("—").length).toBeGreaterThan(0)
        })

        it("shows فعال badge when is_active=true", () => {
            renderTable([makeMethod({ is_active: true })])
            expect(screen.getByText("فعال")).toBeInTheDocument()
        })

        it("shows غیرفعال badge when is_active=false", () => {
            renderTable([makeMethod({ is_active: false })])
            expect(screen.getByText("غیرفعال")).toBeInTheDocument()
        })

        it("renders sort_order value", () => {
            renderTable([makeMethod({ sort_order: 3 })])
            expect(screen.getByText("3")).toBeInTheDocument()
        })

        it("renders multiple methods as multiple rows", () => {
            const methods = [
                makeMethod({ id: 1, name: "پست پیشتاز" }),
                makeMethod({ id: 2, name: "تیپاکس" }),
            ]
            renderTable(methods)
            expect(screen.getByText("پست پیشتاز")).toBeInTheDocument()
            expect(screen.getByText("تیپاکس")).toBeInTheDocument()
        })
    })

    describe("actions", () => {
        it("calls onEdit with correct method when ویرایش clicked", async () => {
            const user = userEvent.setup()
            const onEdit = vi.fn()
            const method = makeMethod()
            renderTable([method], onEdit)
            await user.click(screen.getByRole("button", { name: "ویرایش" }))
            expect(onEdit).toHaveBeenCalledWith(method)
        })

        it("calls onDeleteRequest with correct method when حذف clicked", async () => {
            const user = userEvent.setup()
            const onDeleteRequest = vi.fn()
            const method = makeMethod()
            renderTable([method], vi.fn(), onDeleteRequest)
            await user.click(screen.getByRole("button", { name: "حذف" }))
            expect(onDeleteRequest).toHaveBeenCalledWith(method)
        })

        it("calls onEdit with correct method when multiple rows present", async () => {
            const user = userEvent.setup()
            const onEdit = vi.fn()
            const methods = [
                makeMethod({ id: 1, name: "پست" }),
                makeMethod({ id: 2, name: "تیپاکس" }),
            ]
            renderTable(methods, onEdit)
            const editButtons = screen.getAllByRole("button", { name: "ویرایش" })
            await user.click(editButtons[1])
            expect(onEdit).toHaveBeenCalledWith(methods[1])
        })
    })

    describe("security", () => {
        it("does not execute XSS in method name", () => {
            const xss = '<img src=x onerror="window.__xss=true">'
            renderTable([makeMethod({ name: xss })])
            expect((window as unknown as Record<string, unknown>).__xss).toBeUndefined()
            expect(screen.getByText(xss)).toBeInTheDocument()
        })

        it("does not execute XSS in code field", () => {
            const xss = '"><script>window.__xss2=true</script>'
            renderTable([makeMethod({ code: xss })])
            expect((window as unknown as Record<string, unknown>).__xss2).toBeUndefined()
        })
    })
})
