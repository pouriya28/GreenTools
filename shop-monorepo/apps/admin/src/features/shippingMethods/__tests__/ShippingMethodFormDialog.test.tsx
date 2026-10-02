import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ShippingMethodFormDialog } from "@/features/shippingMethods/components/ShippingMethodFormDialog"
import type { ShippingMethod } from "@/features/shippingMethods/types/ShippingMethod"

const B = "http://localhost:8000/api/v1"

const mockMethod: ShippingMethod = {
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
}

const server = setupServer(
    http.post(`${B}/admin/shipping-methods`, () =>
        HttpResponse.json({ success: true, data: { ...mockMethod, id: 2 } }),
    ),
    http.put(`${B}/admin/shipping-methods/:id`, () =>
        HttpResponse.json({ success: true, data: mockMethod }),
    ),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderDialog(props: {
    open?: boolean
    shippingMethod?: ShippingMethod | null
    onOpenChange?: (open: boolean) => void
}) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    return render(
        <QueryClientProvider client={qc}>
            <ShippingMethodFormDialog
                open={props.open ?? true}
                shippingMethod={props.shippingMethod ?? null}
                onOpenChange={props.onOpenChange ?? vi.fn()}
            />
        </QueryClientProvider>,
    )
}

describe("ShippingMethodFormDialog", () => {
    describe("create mode", () => {
        it("shows 'افزودن روش ارسال' title", () => {
            renderDialog({ shippingMethod: null })
            expect(screen.getByText("افزودن روش ارسال")).toBeInTheDocument()
        })

        it("shows 'افزودن' submit button", () => {
            renderDialog({ shippingMethod: null })
            expect(screen.getByRole("button", { name: "افزودن" })).toBeInTheDocument()
        })

        it("name input starts empty", () => {
            renderDialog({ shippingMethod: null })
            expect(screen.getAllByRole("textbox")[0]).toHaveValue("")
        })

        it("calls onOpenChange(false) after successful create", async () => {
            const user = userEvent.setup()
            const onOpenChange = vi.fn()
            renderDialog({ shippingMethod: null, onOpenChange })
            const inputs = screen.getAllByRole("textbox")
            await user.clear(inputs[0])
            await user.type(inputs[0], "پست جدید")
            // code input (dir=ltr)
            await user.clear(inputs[1])
            await user.type(inputs[1], "new-post")
            await user.click(screen.getByRole("button", { name: "افزودن" }))
            await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
        })

        it("shows error message on API failure", async () => {
            const user = userEvent.setup()
            server.use(
                http.post(`${B}/admin/shipping-methods`, () =>
                    new HttpResponse(null, { status: 500 }),
                ),
            )
            renderDialog({ shippingMethod: null })
            const inputs = screen.getAllByRole("textbox")
            await user.type(inputs[0], "پست جدید")
            await user.type(inputs[1], "new-post")
            await user.click(screen.getByRole("button", { name: "افزودن" }))
            expect(await screen.findByText(/ذخیره‌سازی با خطا مواجه شد/)).toBeInTheDocument()
        })
    })

    describe("edit mode", () => {
        it("shows 'ویرایش روش ارسال' title", () => {
            renderDialog({ shippingMethod: mockMethod })
            expect(screen.getByText("ویرایش روش ارسال")).toBeInTheDocument()
        })

        it("shows 'ذخیره تغییرات' submit button", () => {
            renderDialog({ shippingMethod: mockMethod })
            expect(screen.getByRole("button", { name: "ذخیره تغییرات" })).toBeInTheDocument()
        })

        it("prefills name from shipping method", () => {
            renderDialog({ shippingMethod: mockMethod })
            expect(screen.getByDisplayValue("پست پیشتاز")).toBeInTheDocument()
        })

        it("prefills code from shipping method", () => {
            renderDialog({ shippingMethod: mockMethod })
            expect(screen.getByDisplayValue("post-express")).toBeInTheDocument()
        })

        it("calls onOpenChange(false) after successful update", async () => {
            const user = userEvent.setup()
            const onOpenChange = vi.fn()
            renderDialog({ shippingMethod: mockMethod, onOpenChange })
            await user.click(screen.getByRole("button", { name: "ذخیره تغییرات" }))
            await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
        })

        it("resets form when opened for different method", async () => {
            const { rerender } = renderDialog({ shippingMethod: mockMethod })
            const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
            rerender(
                <QueryClientProvider client={qc}>
                    <ShippingMethodFormDialog
                        open={true}
                        shippingMethod={{ ...mockMethod, id: 2, name: "تیپاکس", code: "tipax" }}
                        onOpenChange={vi.fn()}
                    />
                </QueryClientProvider>,
            )
            expect(screen.getByDisplayValue("تیپاکس")).toBeInTheDocument()
        })
    })

    describe("calculation type", () => {
        it("does not show weight fields for fixed type", () => {
            renderDialog({ shippingMethod: null })
            expect(screen.queryByText("هزینه هر کیلوگرم (تومان)")).not.toBeInTheDocument()
        })

        it("shows weight fields when weight type selected", async () => {
            const user = userEvent.setup()
            renderDialog({ shippingMethod: null })
            await user.selectOptions(screen.getByRole("combobox"), "weight")
            expect(screen.getByText("هزینه هر کیلوگرم (تومان)")).toBeInTheDocument()
        })
    })

    describe("free shipping toggle", () => {
        it("does not show threshold input when disabled", () => {
            renderDialog({ shippingMethod: null })
            expect(screen.queryByText(/حداقل مبلغ سفارش برای ارسال رایگان/)).not.toBeInTheDocument()
        })

        it("shows threshold input when free shipping enabled", async () => {
            const user = userEvent.setup()
            renderDialog({ shippingMethod: null })
            const switches = screen.getAllByRole("switch")
            // first switch is free_shipping_enabled
            await user.click(switches[0])
            expect(screen.getByText(/حداقل مبلغ سفارش برای ارسال رایگان/)).toBeInTheDocument()
        })
    })

    describe("code field security", () => {
        it("strips invalid characters from code input", async () => {
            const user = userEvent.setup()
            renderDialog({ shippingMethod: null })
            const inputs = screen.getAllByRole("textbox")
            const codeInput = inputs[1]
            await user.type(codeInput, "Express Post!")
            // only lowercase alphanumeric and - _ allowed
            expect(codeInput).toHaveValue("expresspost")
        })
    })

    describe("cancel", () => {
        it("calls onOpenChange(false) when انصراف clicked", async () => {
            const user = userEvent.setup()
            const onOpenChange = vi.fn()
            renderDialog({ shippingMethod: null, onOpenChange })
            await user.click(screen.getByRole("button", { name: "انصراف" }))
            expect(onOpenChange).toHaveBeenCalledWith(false)
        })
    })
})
