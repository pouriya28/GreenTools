import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import {
    fetchShippingMethods,
    createShippingMethod,
    updateShippingMethod,
    deleteShippingMethod,
} from "@/features/shippingMethods/api/shippingMethodsApi"
import type { ShippingMethodFormValues } from "@/features/shippingMethods/types/ShippingMethod"

const B = "http://localhost:8000/api/v1"

const mockMethod = {
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

const defaultFormValues: ShippingMethodFormValues = {
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
}

const server = setupServer(
    http.get(`${B}/admin/shipping-methods`, () =>
        HttpResponse.json({ success: true, data: [mockMethod] }),
    ),
    http.post(`${B}/admin/shipping-methods`, () =>
        HttpResponse.json({ success: true, data: { ...mockMethod, id: 2 } }),
    ),
    http.put(`${B}/admin/shipping-methods/:id`, () =>
        HttpResponse.json({ success: true, data: mockMethod }),
    ),
    http.delete(`${B}/admin/shipping-methods/:id`, () =>
        new HttpResponse(null, { status: 204 }),
    ),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("shippingMethodsApi", () => {
    describe("fetchShippingMethods", () => {
        it("returns array of shipping methods", async () => {
            const result = await fetchShippingMethods()
            expect(result).toHaveLength(1)
            expect(result[0].name).toBe("پست پیشتاز")
            expect(result[0].code).toBe("post-express")
        })

        it("returns empty array when no methods", async () => {
            server.use(
                http.get(`${B}/admin/shipping-methods`, () =>
                    HttpResponse.json({ success: true, data: [] }),
                ),
            )
            const result = await fetchShippingMethods()
            expect(result).toHaveLength(0)
        })

        it("throws on network error", async () => {
            server.use(http.get(`${B}/admin/shipping-methods`, () => HttpResponse.error()))
            await expect(fetchShippingMethods()).rejects.toThrow()
        })
    })

    describe("createShippingMethod", () => {
        it("sends POST with form values and returns created method", async () => {
            let sentBody: unknown
            server.use(
                http.post(`${B}/admin/shipping-methods`, async ({ request }) => {
                    sentBody = await request.clone().json()
                    return HttpResponse.json({ success: true, data: { ...mockMethod, id: 2 } })
                }),
            )
            const result = await createShippingMethod(defaultFormValues)
            expect(sentBody).toMatchObject({ name: "پست پیشتاز", code: "post-express" })
            expect(result.id).toBe(2)
        })

        it("throws on 422 validation error", async () => {
            server.use(
                http.post(`${B}/admin/shipping-methods`, () =>
                    HttpResponse.json({ message: "Validation error" }, { status: 422 }),
                ),
            )
            await expect(createShippingMethod(defaultFormValues)).rejects.toThrow()
        })
    })

    describe("updateShippingMethod", () => {
        it("sends PUT to correct URL with partial values", async () => {
            let capturedId: string | undefined
            let sentBody: unknown
            server.use(
                http.put(`${B}/admin/shipping-methods/:id`, async ({ request, params }) => {
                    capturedId = params.id as string
                    sentBody = await request.clone().json()
                    return HttpResponse.json({ success: true, data: mockMethod })
                }),
            )
            await updateShippingMethod(1, { name: "پست سریع" })
            expect(capturedId).toBe("1")
            expect(sentBody).toMatchObject({ name: "پست سریع" })
        })

        it("throws on 404", async () => {
            server.use(
                http.put(`${B}/admin/shipping-methods/:id`, () =>
                    new HttpResponse(null, { status: 404 }),
                ),
            )
            await expect(updateShippingMethod(999, { name: "x" })).rejects.toThrow()
        })
    })

    describe("deleteShippingMethod", () => {
        it("sends DELETE and resolves without value", async () => {
            await expect(deleteShippingMethod(1)).resolves.toBeUndefined()
        })

        it("passes correct id in URL", async () => {
            let capturedId: string | undefined
            server.use(
                http.delete(`${B}/admin/shipping-methods/:id`, ({ params }) => {
                    capturedId = params.id as string
                    return new HttpResponse(null, { status: 204 })
                }),
            )
            await deleteShippingMethod(42)
            expect(capturedId).toBe("42")
        })

        it("throws on 404", async () => {
            server.use(
                http.delete(`${B}/admin/shipping-methods/:id`, () =>
                    new HttpResponse(null, { status: 404 }),
                ),
            )
            await expect(deleteShippingMethod(1)).rejects.toThrow()
        })
    })
})
