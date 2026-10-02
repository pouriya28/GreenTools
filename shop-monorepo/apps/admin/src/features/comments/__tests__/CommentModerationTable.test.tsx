import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CommentModerationTable } from "@/features/comments/components/CommentModerationTable"
import type { CommentAdminItem } from "@/features/comments/types/CommentAdmin"

const B = "http://localhost:8000/api/v1"

const server = setupServer(
    http.patch(`${B}/admin/comments/:id/approve`, () =>
        HttpResponse.json({ data: makeComment({ status: "approved" }) }),
    ),
    http.patch(`${B}/admin/comments/:id/reject`, () =>
        HttpResponse.json({ data: makeComment({ status: "rejected" }) }),
    ),
    http.delete(`${B}/admin/comments/:id`, () => new HttpResponse(null, { status: 204 })),
    http.post(`${B}/comments`, () => HttpResponse.json({ data: makeComment() })),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeComment(overrides: Partial<CommentAdminItem> = {}): CommentAdminItem {
    return {
        id: 1,
        commentable_type: "product",
        commentable_id: 10,
        parent_id: null,
        parent: null,
        body: "محصول خوبی بود",
        rating: 4,
        status: "pending",
        member: { id: 5, name: "علی محمدی", email: "ali@example.com" },
        guest_name: null,
        guest_email: null,
        created_at: "2024-01-01T00:00:00Z",
        ...overrides,
    }
}

function renderTable(comments: CommentAdminItem[]) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    return render(
        <QueryClientProvider client={qc}>
            <CommentModerationTable comments={comments} />
        </QueryClientProvider>,
    )
}

describe("CommentModerationTable", () => {
    describe("empty state", () => {
        it("shows empty message when no comments", () => {
            renderTable([])
            expect(screen.getByText(/هیچ نظر در انتظار/)).toBeInTheDocument()
        })

        it("does not render table when empty", () => {
            renderTable([])
            expect(screen.queryByRole("table")).not.toBeInTheDocument()
        })
    })

    describe("rendering", () => {
        it("renders member name", () => {
            renderTable([makeComment()])
            expect(screen.getByText("علی محمدی")).toBeInTheDocument()
        })

        it("renders member email", () => {
            renderTable([makeComment()])
            expect(screen.getByText("ali@example.com")).toBeInTheDocument()
        })

        it("renders guest name when no member", () => {
            renderTable([makeComment({ member: null, guest_name: "مهمان", guest_email: "g@g.com" })])
            expect(screen.getByText("مهمان")).toBeInTheDocument()
        })

        it("renders 'مهمان' fallback when no member and no guest_name", () => {
            renderTable([makeComment({ member: null, guest_name: null, guest_email: null })])
            expect(screen.getByText("مهمان")).toBeInTheDocument()
        })

        it("renders comment body", () => {
            renderTable([makeComment({ body: "این محصول عالیه" })])
            expect(screen.getByText("این محصول عالیه")).toBeInTheDocument()
        })

        it("renders rating as stars", () => {
            renderTable([makeComment({ rating: 3 })])
            expect(screen.getByText("★★★")).toBeInTheDocument()
        })

        it("renders — when rating is null", () => {
            renderTable([makeComment({ rating: null })])
            expect(screen.getByText("—")).toBeInTheDocument()
        })

        it("renders status badge for pending", () => {
            renderTable([makeComment({ status: "pending" })])
            expect(screen.getByText("در انتظار")).toBeInTheDocument()
        })

        it("renders status badge for approved", () => {
            renderTable([makeComment({ status: "approved" })])
            expect(screen.getByText("تاییدشده")).toBeInTheDocument()
        })

        it("renders parent body when comment is a reply", () => {
            renderTable([makeComment({ parent: { id: 5, body: "نظر اصلی" } })])
            expect(screen.getByText(/پاسخ به: نظر اصلی/)).toBeInTheDocument()
        })

        it("renders action buttons for each comment", () => {
            renderTable([makeComment()])
            expect(screen.getByRole("button", { name: "تایید" })).toBeInTheDocument()
            expect(screen.getByRole("button", { name: "رد" })).toBeInTheDocument()
            expect(screen.getByRole("button", { name: "پاسخ" })).toBeInTheDocument()
            expect(screen.getByRole("button", { name: "حذف" })).toBeInTheDocument()
        })
    })

    describe("approve action", () => {
        it("calls approve mutation with correct comment id", async () => {
            const user = userEvent.setup()
            let approvedId: string | undefined
            server.use(
                http.patch(`${B}/admin/comments/:id/approve`, ({ params }) => {
                    approvedId = params.id as string
                    return HttpResponse.json({ data: makeComment({ status: "approved" }) })
                }),
            )
            renderTable([makeComment({ id: 7 })])
            await user.click(screen.getByRole("button", { name: "تایید" }))
            expect(approvedId).toBe("7")
        })
    })

    describe("reject action", () => {
        it("calls reject mutation with correct comment id", async () => {
            const user = userEvent.setup()
            let rejectedId: string | undefined
            server.use(
                http.patch(`${B}/admin/comments/:id/reject`, ({ params }) => {
                    rejectedId = params.id as string
                    return HttpResponse.json({ data: makeComment({ status: "rejected" }) })
                }),
            )
            renderTable([makeComment({ id: 3 })])
            await user.click(screen.getByRole("button", { name: "رد" }))
            expect(rejectedId).toBe("3")
        })
    })

    describe("delete action", () => {
        it("calls delete mutation with correct comment id", async () => {
            const user = userEvent.setup()
            let deletedId: string | undefined
            server.use(
                http.delete(`${B}/admin/comments/:id`, ({ params }) => {
                    deletedId = params.id as string
                    return new HttpResponse(null, { status: 204 })
                }),
            )
            renderTable([makeComment({ id: 9 })])
            await user.click(screen.getByRole("button", { name: "حذف" }))
            expect(deletedId).toBe("9")
        })
    })

    describe("per-comment pending — only clicked row disabled", () => {
        it("does not disable other rows while one is pending", async () => {
            const user = userEvent.setup()
            let resolveApprove!: () => void
            server.use(
                http.patch(`${B}/admin/comments/:id/approve`, () =>
                    new Promise<Response>((resolve) => {
                        resolveApprove = () =>
                            resolve(HttpResponse.json({ data: makeComment({ status: "approved" }) }) as Response)
                    }),
                ),
            )
            const comments = [makeComment({ id: 1 }), makeComment({ id: 2, body: "نظر دوم" })]
            renderTable(comments)

            const approveButtons = screen.getAllByRole("button", { name: "تایید" })
            await user.click(approveButtons[0])

            // row 1 is pending → disabled
            expect(approveButtons[0]).toBeDisabled()
            // row 2 should NOT be disabled
            expect(approveButtons[1]).toBeEnabled()

            resolveApprove()
        })
    })

    describe("reply toggle", () => {
        it("shows reply form when پاسخ clicked", async () => {
            const user = userEvent.setup()
            renderTable([makeComment()])
            await user.click(screen.getByRole("button", { name: "پاسخ" }))
            expect(screen.getByPlaceholderText(/پاسخ پشتیبانی/)).toBeInTheDocument()
        })

        it("hides reply form when پاسخ clicked again", async () => {
            const user = userEvent.setup()
            renderTable([makeComment()])
            await user.click(screen.getByRole("button", { name: "پاسخ" }))
            await user.click(screen.getByRole("button", { name: "پاسخ" }))
            expect(screen.queryByPlaceholderText(/پاسخ پشتیبانی/)).not.toBeInTheDocument()
        })

        it("shows reply form only for clicked comment when multiple exist", async () => {
            const user = userEvent.setup()
            const comments = [makeComment({ id: 1, body: "نظر اول" }), makeComment({ id: 2, body: "نظر دوم" })]
            renderTable(comments)
            const replyButtons = screen.getAllByRole("button", { name: "پاسخ" })
            await user.click(replyButtons[1])
            // only one reply form visible
            expect(screen.getAllByPlaceholderText(/پاسخ پشتیبانی/)).toHaveLength(1)
        })
    })

    describe("security", () => {
        it("does not execute XSS in comment body", () => {
            const xss = '<img src=x onerror="window.__xss=true">'
            renderTable([makeComment({ body: xss })])
            expect((window as unknown as Record<string, unknown>).__xss).toBeUndefined()
            expect(screen.getByText(xss)).toBeInTheDocument()
        })

        it("does not execute XSS in author name", () => {
            const xss = '<script>window.__xss2=true</script>'
            renderTable([makeComment({ member: { id: 1, name: xss, email: "x@x.com" } })])
            expect((window as unknown as Record<string, unknown>).__xss2).toBeUndefined()
        })

        it("does not execute XSS in parent body", () => {
            const xss = '"><img src=x onerror=alert(1)>'
            renderTable([makeComment({ parent: { id: 5, body: xss } })])
            expect(screen.getByText(`پاسخ به: ${xss}`)).toBeInTheDocument()
        })
    })
})
