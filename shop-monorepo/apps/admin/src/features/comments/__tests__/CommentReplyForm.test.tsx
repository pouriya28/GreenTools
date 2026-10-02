import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CommentReplyForm } from "@/features/comments/components/CommentReplyForm"

const B = "http://localhost:8000/api/v1"

const mockReply = {
    id: 99,
    commentable_type: "product",
    commentable_id: 10,
    parent_id: 1,
    body: "پاسخ پشتیبانی",
    rating: null,
    status: "approved",
    member: null,
    guest_name: null,
    guest_email: null,
    created_at: "2024-01-01T00:00:00Z",
}

const server = setupServer(
    http.post(`${B}/comments`, () => HttpResponse.json({ data: mockReply })),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const defaultProps = {
    commentableType: "product",
    commentableId: 10,
    parentId: 1,
    onDone: vi.fn(),
}

function renderForm(props = defaultProps) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    return render(
        <QueryClientProvider client={qc}>
            <CommentReplyForm {...props} />
        </QueryClientProvider>,
    )
}

describe("CommentReplyForm", () => {
    describe("rendering", () => {
        it("renders textarea with placeholder", () => {
            renderForm()
            expect(screen.getByPlaceholderText(/پاسخ پشتیبانی/)).toBeInTheDocument()
        })

        it("renders submit and cancel buttons", () => {
            renderForm()
            expect(screen.getByRole("button", { name: "ارسال پاسخ" })).toBeInTheDocument()
            expect(screen.getByRole("button", { name: "انصراف" })).toBeInTheDocument()
        })

        it("textarea has maxLength=2000", () => {
            renderForm()
            expect(screen.getByPlaceholderText(/پاسخ پشتیبانی/)).toHaveAttribute("maxlength", "2000")
        })
    })

    describe("validation", () => {
        it("shows error when body is too short (less than 3 chars)", async () => {
            const user = userEvent.setup()
            renderForm()
            await user.type(screen.getByPlaceholderText(/پاسخ پشتیبانی/), "ab")
            await user.click(screen.getByRole("button", { name: "ارسال پاسخ" }))
            expect(await screen.findByText(/حداقل ۳ کاراکتر/)).toBeInTheDocument()
        })

        it("shows error when body is empty", async () => {
            const user = userEvent.setup()
            renderForm()
            await user.click(screen.getByRole("button", { name: "ارسال پاسخ" }))
            expect(await screen.findByText(/حداقل ۳ کاراکتر/)).toBeInTheDocument()
        })

        it("does not show error for valid body", async () => {
            const user = userEvent.setup()
            renderForm()
            await user.type(screen.getByPlaceholderText(/پاسخ پشتیبانی/), "پاسخ معتبر")
            await user.click(screen.getByRole("button", { name: "ارسال پاسخ" }))
            await waitFor(() =>
                expect(screen.queryByText(/حداقل ۳ کاراکتر/)).not.toBeInTheDocument(),
            )
        })
    })

    describe("submission", () => {
        it("sends correct payload to API", async () => {
            const user = userEvent.setup()
            let sentBody: unknown
            server.use(
                http.post(`${B}/comments`, async ({ request }) => {
                    sentBody = await request.clone().json()
                    return HttpResponse.json({ data: mockReply })
                }),
            )
            renderForm()
            await user.type(screen.getByPlaceholderText(/پاسخ پشتیبانی/), "پاسخ من")
            await user.click(screen.getByRole("button", { name: "ارسال پاسخ" }))
            await waitFor(() =>
                expect(sentBody).toEqual({
                    commentable_type: "product",
                    commentable_id: 10,
                    parent_id: 1,
                    body: "پاسخ من",
                }),
            )
        })

        it("calls onDone after successful submit", async () => {
            const user = userEvent.setup()
            const onDone = vi.fn()
            renderForm({ ...defaultProps, onDone })
            await user.type(screen.getByPlaceholderText(/پاسخ پشتیبانی/), "پاسخ معتبر")
            await user.click(screen.getByRole("button", { name: "ارسال پاسخ" }))
            await waitFor(() => expect(onDone).toHaveBeenCalledOnce())
        })

        it("clears textarea after successful submit", async () => {
            const user = userEvent.setup()
            renderForm()
            const textarea = screen.getByPlaceholderText(/پاسخ پشتیبانی/)
            await user.type(textarea, "پاسخ معتبر")
            await user.click(screen.getByRole("button", { name: "ارسال پاسخ" }))
            await waitFor(() => expect(textarea).toHaveValue(""))
        })

        it("shows pending text on submit button while loading", async () => {
            const user = userEvent.setup()
            server.use(
                http.post(`${B}/comments`, () =>
                    new Promise((resolve) =>
                        setTimeout(() => resolve(HttpResponse.json({ data: mockReply })), 500),
                    ),
                ),
            )
            renderForm()
            await user.type(screen.getByPlaceholderText(/پاسخ پشتیبانی/), "پاسخ معتبر")
            await user.click(screen.getByRole("button", { name: "ارسال پاسخ" }))
            expect(await screen.findByRole("button", { name: /در حال ارسال/ })).toBeInTheDocument()
        })

        it("shows error message on API failure", async () => {
            const user = userEvent.setup()
            server.use(
                http.post(`${B}/comments`, () =>
                    new HttpResponse(null, { status: 500 }),
                ),
            )
            renderForm()
            await user.type(screen.getByPlaceholderText(/پاسخ پشتیبانی/), "پاسخ معتبر")
            await user.click(screen.getByRole("button", { name: "ارسال پاسخ" }))
            expect(await screen.findByText(/ارسال پاسخ با خطا مواجه شد/)).toBeInTheDocument()
        })

        it("does not call onDone on API failure", async () => {
            const user = userEvent.setup()
            const onDone = vi.fn()
            server.use(
                http.post(`${B}/comments`, () => new HttpResponse(null, { status: 500 })),
            )
            renderForm({ ...defaultProps, onDone })
            await user.type(screen.getByPlaceholderText(/پاسخ پشتیبانی/), "پاسخ معتبر")
            await user.click(screen.getByRole("button", { name: "ارسال پاسخ" }))
            await screen.findByText(/ارسال پاسخ با خطا مواجه شد/)
            expect(onDone).not.toHaveBeenCalled()
        })
    })

    describe("cancel", () => {
        it("calls onDone when انصراف clicked", async () => {
            const user = userEvent.setup()
            const onDone = vi.fn()
            renderForm({ ...defaultProps, onDone })
            await user.click(screen.getByRole("button", { name: "انصراف" }))
            expect(onDone).toHaveBeenCalledOnce()
        })

        it("does not submit when انصراف clicked", async () => {
            const user = userEvent.setup()
            let called = false
            server.use(http.post(`${B}/comments`, () => { called = true; return HttpResponse.json({ data: mockReply }) }))
            renderForm()
            await user.type(screen.getByPlaceholderText(/پاسخ پشتیبانی/), "پاسخ")
            await user.click(screen.getByRole("button", { name: "انصراف" }))
            expect(called).toBe(false)
        })
    })

    describe("security", () => {
        it("trims body before sending — does not send only-whitespace", async () => {
            const user = userEvent.setup()
            renderForm()
            await user.type(screen.getByPlaceholderText(/پاسخ پشتیبانی/), "   ")
            await user.click(screen.getByRole("button", { name: "ارسال پاسخ" }))
            expect(await screen.findByText(/حداقل ۳ کاراکتر/)).toBeInTheDocument()
        })
    })
})
