import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import {
    getPendingComments,
    approveComment,
    rejectComment,
    deleteCommentAsStaff,
    replyToComment,
} from "@/features/comments/api/commentsAdminApi"

const B = "http://localhost:8000/api/v1"

const mockComment = {
    id: 1,
    commentable_type: "product",
    commentable_id: 10,
    parent_id: null,
    parent: null,
    body: "محصول خوبی بود",
    rating: 4,
    status: "pending",
    member: { id: 5, name: "علی", email: "ali@example.com" },
    guest_name: null,
    guest_email: null,
    created_at: "2024-01-01T00:00:00Z",
}

const mockListResponse = {
    data: {
        items: [mockComment],
        meta: { current_page: 1, last_page: 2, total: 25 },
    },
}

const server = setupServer(
    http.get(`${B}/admin/comments`, () => HttpResponse.json(mockListResponse)),
    http.patch(`${B}/admin/comments/:id/approve`, () =>
        HttpResponse.json({ data: { ...mockComment, status: "approved" } }),
    ),
    http.patch(`${B}/admin/comments/:id/reject`, () =>
        HttpResponse.json({ data: { ...mockComment, status: "rejected" } }),
    ),
    http.delete(`${B}/admin/comments/:id`, () => new HttpResponse(null, { status: 204 })),
    http.post(`${B}/comments`, () => HttpResponse.json({ data: { ...mockComment, id: 99 } })),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("commentsAdminApi", () => {
    describe("getPendingComments", () => {
        it("returns items and meta", async () => {
            const result = await getPendingComments()
            expect(result.items).toHaveLength(1)
            expect(result.meta.total).toBe(25)
            expect(result.meta.last_page).toBe(2)
        })

        it("passes page as query param", async () => {
            let capturedUrl: URL | null = null
            server.use(
                http.get(`${B}/admin/comments`, ({ request }) => {
                    capturedUrl = new URL(request.url)
                    return HttpResponse.json(mockListResponse)
                }),
            )
            await getPendingComments(3)
            expect(capturedUrl!.searchParams.get("page")).toBe("3")
        })

        it("defaults to page 1", async () => {
            let capturedUrl: URL | null = null
            server.use(
                http.get(`${B}/admin/comments`, ({ request }) => {
                    capturedUrl = new URL(request.url)
                    return HttpResponse.json(mockListResponse)
                }),
            )
            await getPendingComments()
            expect(capturedUrl!.searchParams.get("page")).toBe("1")
        })

        it("throws on network error", async () => {
            server.use(http.get(`${B}/admin/comments`, () => HttpResponse.error()))
            await expect(getPendingComments()).rejects.toThrow()
        })
    })

    describe("approveComment", () => {
        it("sends PATCH to correct URL and returns updated comment", async () => {
            const result = await approveComment(1)
            expect(result.status).toBe("approved")
        })

        it("passes correct comment id in URL", async () => {
            let capturedId: string | undefined
            server.use(
                http.patch(`${B}/admin/comments/:id/approve`, ({ params }) => {
                    capturedId = params.id as string
                    return HttpResponse.json({ data: { ...mockComment, status: "approved" } })
                }),
            )
            await approveComment(42)
            expect(capturedId).toBe("42")
        })

        it("throws on 403", async () => {
            server.use(
                http.patch(`${B}/admin/comments/:id/approve`, () =>
                    new HttpResponse(null, { status: 403 }),
                ),
            )
            await expect(approveComment(1)).rejects.toThrow()
        })
    })

    describe("rejectComment", () => {
        it("sends PATCH to reject URL and returns rejected comment", async () => {
            const result = await rejectComment(1)
            expect(result.status).toBe("rejected")
        })

        it("passes correct comment id in URL", async () => {
            let capturedId: string | undefined
            server.use(
                http.patch(`${B}/admin/comments/:id/reject`, ({ params }) => {
                    capturedId = params.id as string
                    return HttpResponse.json({ data: { ...mockComment, status: "rejected" } })
                }),
            )
            await rejectComment(7)
            expect(capturedId).toBe("7")
        })
    })

    describe("deleteCommentAsStaff", () => {
        it("sends DELETE and resolves without value", async () => {
            await expect(deleteCommentAsStaff(1)).resolves.toBeUndefined()
        })

        it("passes correct id in URL", async () => {
            let capturedId: string | undefined
            server.use(
                http.delete(`${B}/admin/comments/:id`, ({ params }) => {
                    capturedId = params.id as string
                    return new HttpResponse(null, { status: 204 })
                }),
            )
            await deleteCommentAsStaff(99)
            expect(capturedId).toBe("99")
        })

        it("throws on 404", async () => {
            server.use(
                http.delete(`${B}/admin/comments/:id`, () =>
                    new HttpResponse(null, { status: 404 }),
                ),
            )
            await expect(deleteCommentAsStaff(1)).rejects.toThrow()
        })
    })

    describe("replyToComment", () => {
        it("sends POST to /comments with correct payload", async () => {
            let sentBody: unknown
            server.use(
                http.post(`${B}/comments`, async ({ request }) => {
                    sentBody = await request.clone().json()
                    return HttpResponse.json({ data: { ...mockComment, id: 99 } })
                }),
            )
            await replyToComment({
                commentable_type: "product",
                commentable_id: 10,
                parent_id: 1,
                body: "پاسخ پشتیبانی",
            })
            expect(sentBody).toEqual({
                commentable_type: "product",
                commentable_id: 10,
                parent_id: 1,
                body: "پاسخ پشتیبانی",
            })
        })

        it("returns created comment", async () => {
            const result = await replyToComment({
                commentable_type: "product",
                commentable_id: 10,
                parent_id: 1,
                body: "پاسخ",
            })
            expect(result.id).toBe(99)
        })

        it("throws on 422", async () => {
            server.use(
                http.post(`${B}/comments`, () =>
                    HttpResponse.json({ message: "Validation error" }, { status: 422 }),
                ),
            )
            await expect(
                replyToComment({ commentable_type: "p", commentable_id: 1, parent_id: 1, body: "" }),
            ).rejects.toThrow()
        })
    })
})
