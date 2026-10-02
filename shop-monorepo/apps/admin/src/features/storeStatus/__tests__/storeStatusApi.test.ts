import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { fetchStoreStatus, closeStore, openStore } from "@/features/storeStatus/api/storeStatusApi"

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

describe("storeStatusApi", () => {
    describe("fetchStoreStatus", () => {
        it("returns store status", async () => {
            const result = await fetchStoreStatus()
            expect(result.is_open).toBe(true)
            expect(result.closed_reason).toBeNull()
        })

        it("returns closed status correctly", async () => {
            server.use(
                http.get(`${B}/admin/store-status`, () =>
                    HttpResponse.json({ success: true, data: mockClosed }),
                ),
            )
            const result = await fetchStoreStatus()
            expect(result.is_open).toBe(false)
            expect(result.closed_reason).toBe("تعمیرات")
        })

        it("throws on network error", async () => {
            server.use(http.get(`${B}/admin/store-status`, () => HttpResponse.error()))
            await expect(fetchStoreStatus()).rejects.toThrow()
        })
    })

    describe("closeStore", () => {
        it("sends POST to close endpoint and returns closed status", async () => {
            const result = await closeStore()
            expect(result.is_open).toBe(false)
        })

        it("sends reason in request body when provided", async () => {
            let sentBody: unknown
            server.use(
                http.post(`${B}/admin/store-status/close`, async ({ request }) => {
                    sentBody = await request.clone().json()
                    return HttpResponse.json({ success: true, data: mockClosed })
                }),
            )
            await closeStore("تعمیرات سرور")
            expect(sentBody).toMatchObject({ reason: "تعمیرات سرور" })
        })

        it("throws on 403", async () => {
            server.use(
                http.post(`${B}/admin/store-status/close`, () =>
                    new HttpResponse(null, { status: 403 }),
                ),
            )
            await expect(closeStore()).rejects.toThrow()
        })
    })

    describe("openStore", () => {
        it("sends POST to open endpoint and returns open status", async () => {
            const result = await openStore()
            expect(result.is_open).toBe(true)
        })

        it("throws on 403", async () => {
            server.use(
                http.post(`${B}/admin/store-status/open`, () =>
                    new HttpResponse(null, { status: 403 }),
                ),
            )
            await expect(openStore()).rejects.toThrow()
        })
    })
})
