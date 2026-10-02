import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StoreStatusToggle } from "@/features/storeStatus/components/StoreStatusToggle"

// ConfirmActionDialog uses Radix Dialog (portal) — mock for jsdom compatibility
vi.mock("@/features/pricing/components/shared/ConfirmActionDialog", () => ({
    ConfirmActionDialog: ({
        open,
        title,
        confirmLabel,
        isBusy,
        errorMessage,
        onConfirm,
        onOpenChange,
        description,
    }: {
        open: boolean
        title: string
        confirmLabel: string
        isBusy: boolean
        errorMessage: string | null
        onConfirm: () => void
        onOpenChange: (open: boolean) => void
        description: React.ReactNode
    }) =>
        open ? (
            <div role="dialog" aria-label={title}>
                <div>{description}</div>
                {errorMessage && <p data-testid="dialog-error">{errorMessage}</p>}
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isBusy}
                >
                    {isBusy ? "در حال پردازش..." : confirmLabel}
                </button>
                <button type="button" onClick={() => onOpenChange(false)}>
                    انصراف
                </button>
            </div>
        ) : null,
}))

const B = "http://localhost:8000/api/v1"

const mockOpen = { is_open: true, closed_reason: null, closed_by_user_id: null, closed_at: null }
const mockClosed = { is_open: false, closed_reason: "تعمیرات", closed_by_user_id: 1, closed_at: "2024-01-01T00:00:00Z" }

const server = setupServer(
    http.get(`${B}/admin/store-status`, () =>
        HttpResponse.json({ success: true, data: mockOpen }),
    ),
    http.post(`${B}/admin/store-status/close`, () =>
        HttpResponse.json({ success: true, data: mockClosed }),
    ),
    http.post(`${B}/admin/store-status/open`, () =>
        HttpResponse.json({ success: true, data: mockOpen }),
    ),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderToggle(initialStatus = mockOpen) {
    server.use(
        http.get(`${B}/admin/store-status`, () =>
            HttpResponse.json({ success: true, data: initialStatus }),
        ),
    )
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false, refetchInterval: false }, mutations: { retry: false } },
    })
    return render(
        <QueryClientProvider client={qc}>
            <StoreStatusToggle />
        </QueryClientProvider>,
    )
}

describe("StoreStatusToggle", () => {
    describe("loading state", () => {
        it("renders nothing while loading", () => {
            const qc = new QueryClient({
                defaultOptions: { queries: { retry: false, refetchInterval: false } },
            })
            // slow response — still loading
            server.use(
                http.get(`${B}/admin/store-status`, () =>
                    new Promise((resolve) =>
                        setTimeout(() => resolve(HttpResponse.json({ success: true, data: mockOpen })), 500),
                    ),
                ),
            )
            const { container } = render(
                <QueryClientProvider client={qc}>
                    <StoreStatusToggle />
                </QueryClientProvider>,
            )
            expect(container.firstChild).toBeNull()
        })
    })

    describe("open store state", () => {
        it("shows 'بستن فروشگاه' button when store is open", async () => {
            renderToggle(mockOpen)
            expect(await screen.findByRole("button", { name: /بستن فروشگاه/ })).toBeInTheDocument()
        })

        it("does not show 'باز کردن' button when store is open", async () => {
            renderToggle(mockOpen)
            await screen.findByRole("button", { name: /بستن فروشگاه/ })
            expect(screen.queryByRole("button", { name: /باز کردن/ })).not.toBeInTheDocument()
        })

        it("opens confirm dialog when 'بستن فروشگاه' clicked", async () => {
            const user = userEvent.setup()
            renderToggle(mockOpen)
            await user.click(await screen.findByRole("button", { name: /بستن فروشگاه/ }))
            expect(screen.getByRole("dialog", { name: "بستن فروشگاه" })).toBeInTheDocument()
        })

        it("closes dialog when انصراف clicked", async () => {
            const user = userEvent.setup()
            renderToggle(mockOpen)
            await user.click(await screen.findByRole("button", { name: /بستن فروشگاه/ }))
            await user.click(screen.getByRole("button", { name: "انصراف" }))
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        })

        it("calls closeStore API when confirm clicked", async () => {
            const user = userEvent.setup()
            let called = false
            server.use(
                http.post(`${B}/admin/store-status/close`, () => {
                    called = true
                    return HttpResponse.json({ success: true, data: mockClosed })
                }),
            )
            renderToggle(mockOpen)
            await user.click(await screen.findByRole("button", { name: /بستن فروشگاه/ }))
            await user.click(screen.getByRole("button", { name: /بله، فروشگاه بسته شود/ }))
            await waitFor(() => expect(called).toBe(true))
        })

        it("sends reason to closeStore when entered", async () => {
            const user = userEvent.setup()
            let sentBody: unknown
            server.use(
                http.post(`${B}/admin/store-status/close`, async ({ request }) => {
                    sentBody = await request.clone().json()
                    return HttpResponse.json({ success: true, data: mockClosed })
                }),
            )
            renderToggle(mockOpen)
            await user.click(await screen.findByRole("button", { name: /بستن فروشگاه/ }))
            await user.type(screen.getByPlaceholderText(/دلیل بستن/), "تعمیرات")
            await user.click(screen.getByRole("button", { name: /بله، فروشگاه بسته شود/ }))
            await waitFor(() => expect(sentBody).toMatchObject({ reason: "تعمیرات" }))
        })

        it("closes dialog after successful close", async () => {
            const user = userEvent.setup()
            renderToggle(mockOpen)
            await user.click(await screen.findByRole("button", { name: /بستن فروشگاه/ }))
            await user.click(screen.getByRole("button", { name: /بله، فروشگاه بسته شود/ }))
            await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
        })

        it("keeps dialog open on close API failure", async () => {
            const user = userEvent.setup()
            server.use(
                http.post(`${B}/admin/store-status/close`, () =>
                    HttpResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 403 }),
                ),
            )
            renderToggle(mockOpen)
            await user.click(await screen.findByRole("button", { name: /بستن فروشگاه/ }))
            await user.click(screen.getByRole("button", { name: /بله، فروشگاه بسته شود/ }))
            // dialog stays open — error was caught and close was prevented
            await waitFor(() =>
                expect(screen.getByRole("dialog", { name: "بستن فروشگاه" })).toBeInTheDocument()
            )
        })
    })

    describe("closed store state", () => {
        it("shows 'باز کردن فروشگاه' button when store is closed", async () => {
            renderToggle(mockClosed)
            expect(await screen.findByRole("button", { name: /باز کردن فروشگاه/ })).toBeInTheDocument()
        })

        it("does not show 'بستن' button when store is closed", async () => {
            renderToggle(mockClosed)
            await screen.findByRole("button", { name: /باز کردن فروشگاه/ })
            expect(screen.queryByRole("button", { name: /بستن فروشگاه/ })).not.toBeInTheDocument()
        })

        it("calls openStore API when button clicked", async () => {
            const user = userEvent.setup()
            let called = false
            server.use(
                http.post(`${B}/admin/store-status/open`, () => {
                    called = true
                    return HttpResponse.json({ success: true, data: mockOpen })
                }),
            )
            renderToggle(mockClosed)
            await user.click(await screen.findByRole("button", { name: /باز کردن فروشگاه/ }))
            await waitFor(() => expect(called).toBe(true))
        })

        it("shows error message when open API fails", async () => {
            const user = userEvent.setup()
            server.use(
                http.post(`${B}/admin/store-status/open`, () =>
                    HttpResponse.json({ success: false, message: "خطای سرور" }, { status: 500 }),
                ),
            )
            renderToggle(mockClosed)
            await user.click(await screen.findByRole("button", { name: /باز کردن فروشگاه/ }))
            expect(await screen.findByText(/خطا در باز کردن فروشگاه|خطای سرور/)).toBeInTheDocument()
        })

        it("button is disabled while open mutation is pending", async () => {
            const user = userEvent.setup()
            server.use(
                http.post(`${B}/admin/store-status/open`, () =>
                    new Promise((resolve) =>
                        setTimeout(() => resolve(HttpResponse.json({ success: true, data: mockOpen })), 300),
                    ),
                ),
            )
            renderToggle(mockClosed)
            const btn = await screen.findByRole("button", { name: /باز کردن فروشگاه/ })
            await user.click(btn)
            expect(await screen.findByRole("button", { name: /در حال باز کردن/ })).toBeDisabled()
        })
    })
})
