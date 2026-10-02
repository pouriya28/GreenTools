import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { UpdateOrderStatusDialog } from "@/features/orders/components/UpdateOrderStatusDialog"
import type { OrderDetail } from "@/features/orders/types/Order"

// Radix Select inside Dialog (portal-in-portal) does not work in jsdom.
// Render a native <select> so tests can interact normally.
vi.mock("@/components/ui/select", () => ({
    Select: ({
        value,
        onValueChange,
        children,
    }: {
        value: string
        onValueChange: (v: string) => void
        children: React.ReactNode
    }) => (
        <select
            data-testid="status-select"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
        >
            {children}
        </select>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectValue: ({ placeholder }: { placeholder: string }) => <option value="">{placeholder}</option>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
        <option value={value}>{children}</option>
    ),
}))

const API_BASE = "http://localhost:8000/api/v1"

const makeOrder = (overrides: Partial<OrderDetail> = {}): OrderDetail => ({
    id: "01HZ001",
    status: "paid",
    total_amount: 200000,
    shipping_cost: 10000,
    shipping_method_name: "پست",
    created_at: "2024-01-01T00:00:00Z",
    payment_status: "completed",
    items: [],
    address: null,
    shipment: null,
    ...overrides,
})

const server = setupServer(
    http.patch(`${API_BASE}/admin/orders/:id/status`, async ({ request }) => {
        const body = await request.clone().json() as { status: string }
        return HttpResponse.json({
            success: true,
            data: { ...makeOrder(), status: body.status },
        })
    }),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderDialog(props: {
    order: OrderDetail | null
    open?: boolean
    onOpenChange?: (open: boolean) => void
}) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    return render(
        <QueryClientProvider client={qc}>
            <UpdateOrderStatusDialog
                order={props.order}
                open={props.open ?? true}
                onOpenChange={props.onOpenChange ?? vi.fn()}
            />
        </QueryClientProvider>,
    )
}

describe("UpdateOrderStatusDialog", () => {
    describe("null order", () => {
        it("renders nothing when order is null", () => {
            renderDialog({ order: null })
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        })
    })

    describe("dialog content", () => {
        it("shows order id in title", () => {
            renderDialog({ order: makeOrder({ id: "01HZ042" }) })
            expect(screen.getByText(/سفارش #01HZ042/)).toBeInTheDocument()
        })

        it("shows current status label in description", () => {
            renderDialog({ order: makeOrder({ status: "paid" }) })
            expect(screen.getByText(/پرداخت‌شده/)).toBeInTheDocument()
        })

        it("shows final state message when no transitions allowed", () => {
            renderDialog({ order: makeOrder({ status: "delivered" }) })
            expect(screen.getByText(/وضعیت نهایی/)).toBeInTheDocument()
        })

        it("shows final state message for cancelled order", () => {
            renderDialog({ order: makeOrder({ status: "cancelled" }) })
            expect(screen.getByText(/وضعیت نهایی/)).toBeInTheDocument()
        })

        it("renders cancel button", () => {
            renderDialog({ order: makeOrder() })
            expect(screen.getByRole("button", { name: "انصراف" })).toBeInTheDocument()
        })

        it("submit button is disabled initially when transitions exist", () => {
            renderDialog({ order: makeOrder({ status: "paid" }) })
            expect(screen.getByRole("button", { name: /ثبت تغییر/ })).toBeDisabled()
        })

        it("submit button is disabled when order is in final state", () => {
            renderDialog({ order: makeOrder({ status: "delivered" }) })
            expect(screen.getByRole("button", { name: /ثبت تغییر/ })).toBeDisabled()
        })
    })

    describe("status select options", () => {
        it("shows only allowed next statuses for paid → [processing, cancelled]", () => {
            renderDialog({ order: makeOrder({ status: "paid" }) })
            const select = screen.getByTestId("status-select")
            const options = Array.from(select.querySelectorAll("option")).map((o) => o.value)
            expect(options).toContain("processing")
            expect(options).toContain("cancelled")
            expect(options).not.toContain("shipped")
            expect(options).not.toContain("delivered")
        })

        it("shows only allowed next statuses for processing → [packed, cancelled]", () => {
            renderDialog({ order: makeOrder({ status: "processing" }) })
            const select = screen.getByTestId("status-select")
            const options = Array.from(select.querySelectorAll("option")).map((o) => o.value)
            expect(options).toContain("packed")
            expect(options).toContain("cancelled")
            expect(options).not.toContain("shipped")
        })

        it("shows only delivered for shipped order", () => {
            renderDialog({ order: makeOrder({ status: "shipped" }) })
            const select = screen.getByTestId("status-select")
            const options = Array.from(select.querySelectorAll("option")).map((o) => o.value)
            expect(options).toContain("delivered")
            expect(options).not.toContain("cancelled")
        })

        it("does not render select when order is in final state", () => {
            renderDialog({ order: makeOrder({ status: "delivered" }) })
            expect(screen.queryByTestId("status-select")).not.toBeInTheDocument()
        })
    })

    describe("status selection and submission", () => {
        it("enables submit after selecting a status", async () => {
            const user = userEvent.setup()
            renderDialog({ order: makeOrder({ status: "paid" }) })
            await user.selectOptions(screen.getByTestId("status-select"), "processing")
            expect(screen.getByRole("button", { name: /ثبت تغییر/ })).toBeEnabled()
        })

        it("calls onOpenChange(false) after successful submission", async () => {
            const user = userEvent.setup()
            const onOpenChange = vi.fn()
            renderDialog({ order: makeOrder({ status: "paid" }), onOpenChange })
            await user.selectOptions(screen.getByTestId("status-select"), "processing")
            await user.click(screen.getByRole("button", { name: /ثبت تغییر/ }))
            await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
        })

        it("sends correct status to API", async () => {
            const user = userEvent.setup()
            let sentStatus: string | undefined
            server.use(
                http.patch(`${API_BASE}/admin/orders/:id/status`, async ({ request }) => {
                    const body = await request.clone().json() as { status: string }
                    sentStatus = body.status
                    return HttpResponse.json({ success: true, data: makeOrder({ status: body.status as never }) })
                }),
            )
            renderDialog({ order: makeOrder({ status: "processing" }) })
            await user.selectOptions(screen.getByTestId("status-select"), "packed")
            await user.click(screen.getByRole("button", { name: /ثبت تغییر/ }))
            await waitFor(() => expect(sentStatus).toBe("packed"))
        })

        it("cancel button calls onOpenChange(false)", async () => {
            const user = userEvent.setup()
            const onOpenChange = vi.fn()
            renderDialog({ order: makeOrder(), onOpenChange })
            await user.click(screen.getByRole("button", { name: "انصراف" }))
            expect(onOpenChange).toHaveBeenCalledWith(false)
        })
    })

    describe("error state", () => {
        it("keeps dialog open on API error", async () => {
            const user = userEvent.setup()
            const onOpenChange = vi.fn()
            server.use(
                http.patch(`${API_BASE}/admin/orders/:id/status`, () =>
                    HttpResponse.json({ success: false, message: "Invalid transition" }, { status: 422 }),
                ),
            )
            renderDialog({ order: makeOrder({ status: "paid" }), onOpenChange })
            await user.selectOptions(screen.getByTestId("status-select"), "processing")
            await user.click(screen.getByRole("button", { name: /ثبت تغییر/ }))
            await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument())
            expect(onOpenChange).not.toHaveBeenCalledWith(false)
        })
    })

    describe("security", () => {
        it("renders order id as text — not executable HTML", () => {
            renderDialog({ order: makeOrder({ id: '"><img src=x onerror=alert(1)>' }) })
            expect((window as unknown as Record<string, unknown>).__xss).toBeUndefined()
        })
    })
})
