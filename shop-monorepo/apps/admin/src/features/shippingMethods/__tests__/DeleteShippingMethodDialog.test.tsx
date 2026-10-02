import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { DeleteShippingMethodDialog } from "@/features/shippingMethods/components/DeleteShippingMethodDialog"
import type { ShippingMethod } from "@/features/shippingMethods/types/ShippingMethod"

vi.mock("@/features/pricing/components/shared/ConfirmActionDialog", () => ({
    ConfirmActionDialog: ({
        open,
        title,
        description,
        confirmLabel,
        isBusy,
        errorMessage,
        onConfirm,
        onOpenChange,
    }: {
        open: boolean
        title: string
        description: React.ReactNode
        confirmLabel: string
        isBusy: boolean
        errorMessage: string | null
        onConfirm: () => void
        onOpenChange: (open: boolean) => void
    }) =>
        open ? (
            <div role="dialog" aria-label={title}>
                <div>{description}</div>
                {errorMessage && <p data-testid="dialog-error">{errorMessage}</p>}
                <button type="button" onClick={onConfirm} disabled={isBusy}>
                    {confirmLabel}
                </button>
                <button type="button" onClick={() => onOpenChange(false)}>
                    انصراف
                </button>
            </div>
        ) : null,
}))

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
    http.delete(`${B}/admin/shipping-methods/:id`, () =>
        new HttpResponse(null, { status: 204 }),
    ),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderDialog(props: {
    shippingMethod: ShippingMethod | null
    open?: boolean
    onOpenChange?: (open: boolean) => void
}) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    return render(
        <QueryClientProvider client={qc}>
            <DeleteShippingMethodDialog
                shippingMethod={props.shippingMethod}
                open={props.open ?? true}
                onOpenChange={props.onOpenChange ?? vi.fn()}
            />
        </QueryClientProvider>,
    )
}

describe("DeleteShippingMethodDialog", () => {
    describe("rendering", () => {
        it("shows method name in description", () => {
            renderDialog({ shippingMethod: mockMethod })
            expect(screen.getByText(/پست پیشتاز/)).toBeInTheDocument()
        })

        it("shows confirm and cancel buttons", () => {
            renderDialog({ shippingMethod: mockMethod })
            expect(screen.getByRole("button", { name: "بله، حذف شود" })).toBeInTheDocument()
            expect(screen.getByRole("button", { name: "انصراف" })).toBeInTheDocument()
        })

        it("shows empty description when shippingMethod is null", () => {
            renderDialog({ shippingMethod: null })
            expect(screen.queryByText(/مطمئن هستید/)).not.toBeInTheDocument()
        })
    })

    describe("confirm delete", () => {
        it("calls delete API with correct id", async () => {
            const user = userEvent.setup()
            let deletedId: string | undefined
            server.use(
                http.delete(`${B}/admin/shipping-methods/:id`, ({ params }) => {
                    deletedId = params.id as string
                    return new HttpResponse(null, { status: 204 })
                }),
            )
            renderDialog({ shippingMethod: mockMethod })
            await user.click(screen.getByRole("button", { name: "بله، حذف شود" }))
            await waitFor(() => expect(deletedId).toBe("1"))
        })

        it("calls onOpenChange(false) after successful delete", async () => {
            const user = userEvent.setup()
            const onOpenChange = vi.fn()
            renderDialog({ shippingMethod: mockMethod, onOpenChange })
            await user.click(screen.getByRole("button", { name: "بله، حذف شود" }))
            await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
        })

        it("keeps dialog open on API error", async () => {
            const user = userEvent.setup()
            const onOpenChange = vi.fn()
            server.use(
                http.delete(`${B}/admin/shipping-methods/:id`, () =>
                    new HttpResponse(null, { status: 500 }),
                ),
            )
            renderDialog({ shippingMethod: mockMethod, onOpenChange })
            await user.click(screen.getByRole("button", { name: "بله، حذف شود" }))
            await waitFor(() =>
                expect(screen.getByRole("dialog")).toBeInTheDocument(),
            )
            expect(onOpenChange).not.toHaveBeenCalledWith(false)
        })
    })

    describe("cancel", () => {
        it("calls onOpenChange(false) when انصراف clicked", async () => {
            const user = userEvent.setup()
            const onOpenChange = vi.fn()
            renderDialog({ shippingMethod: mockMethod, onOpenChange })
            await user.click(screen.getByRole("button", { name: "انصراف" }))
            expect(onOpenChange).toHaveBeenCalledWith(false)
        })
    })
})
