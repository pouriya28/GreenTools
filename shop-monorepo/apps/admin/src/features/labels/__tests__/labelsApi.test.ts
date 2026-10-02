import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import {
    fetchSenderAddresses,
    createSenderAddress,
    generateShippingLabels,
} from "@/features/labels/api/labelsApi"
import type { GenerateShippingLabelsPayload } from "@/features/labels/types/Label"

const B = "http://localhost:8000/api/v1"

const mockAddress = {
    id: 1,
    label: "انبار مرکزی",
    sender_name: "علی احمدی",
    sender_phone: "09121234567",
    province_name: "تهران",
    city_name: "تهران",
    district: null,
    postal_code: "1234567890",
    address_line: "خیابان آزادی",
    plaque: "10",
    unit: null,
    is_default: true,
}

const mockSheet = {
    sender: {
        sender_name: "علی احمدی",
        sender_phone: "09121234567",
        province_name: "تهران",
        city_name: "تهران",
        district: null,
        address_line: "خیابان آزادی",
        plaque: "10",
        unit: null,
        postal_code: "1234567890",
    },
    labels: [
        {
            order_id: 1,
            recipient_name: "سارا رضایی",
            recipient_phone: "09351234567",
            province_name: "اصفهان",
            city_name: "اصفهان",
            district: null,
            address_line: "خیابان چهارباغ",
            plaque: "5",
            unit: null,
            postal_code: "8765432109",
        },
    ],
    layout: {
        paper_size: "a4",
        label_size: "10x15",
        label_width_mm: 100,
        label_height_mm: 150,
        paper_width_mm: 210,
        paper_height_mm: 297,
        columns: 2,
        rows: 1,
    },
}

const server = setupServer(
    http.get(`${B}/admin/sender-addresses`, () =>
        HttpResponse.json({ success: true, data: [mockAddress] }),
    ),
    http.post(`${B}/admin/sender-addresses`, () =>
        HttpResponse.json({ success: true, data: { ...mockAddress, id: 2 } }),
    ),
    http.post(`${B}/admin/shipping-labels`, () =>
        HttpResponse.json({ success: true, data: mockSheet }),
    ),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("labelsApi", () => {
    describe("fetchSenderAddresses", () => {
        it("returns array of sender addresses", async () => {
            const result = await fetchSenderAddresses()
            expect(result).toHaveLength(1)
            expect(result[0].label).toBe("انبار مرکزی")
            expect(result[0].is_default).toBe(true)
        })

        it("returns empty array when no addresses", async () => {
            server.use(
                http.get(`${B}/admin/sender-addresses`, () =>
                    HttpResponse.json({ success: true, data: [] }),
                ),
            )
            const result = await fetchSenderAddresses()
            expect(result).toHaveLength(0)
        })

        it("throws when success=false", async () => {
            server.use(
                http.get(`${B}/admin/sender-addresses`, () =>
                    HttpResponse.json({ success: false, message: "Unauthorized" }),
                ),
            )
            await expect(fetchSenderAddresses()).rejects.toMatchObject({ success: false })
        })

        it("throws on network error", async () => {
            server.use(http.get(`${B}/admin/sender-addresses`, () => HttpResponse.error()))
            await expect(fetchSenderAddresses()).rejects.toThrow()
        })
    })

    describe("createSenderAddress", () => {
        it("sends POST with payload and returns created address", async () => {
            let sentBody: unknown
            server.use(
                http.post(`${B}/admin/sender-addresses`, async ({ request }) => {
                    sentBody = await request.clone().json()
                    return HttpResponse.json({ success: true, data: { ...mockAddress, id: 2 } })
                }),
            )
            const result = await createSenderAddress({
                label: "انبار جدید",
                sender_name: "رضا",
                sender_phone: "09121111111",
                province_name: "تهران",
                city_name: "تهران",
                district: "",
                postal_code: "1234567890",
                address_line: "آزادی",
                plaque: "1",
                unit: "",
                is_default: false,
            })
            expect(sentBody).toMatchObject({ label: "انبار جدید", sender_name: "رضا" })
            expect(result.id).toBe(2)
        })

        it("throws when success=false", async () => {
            server.use(
                http.post(`${B}/admin/sender-addresses`, () =>
                    HttpResponse.json({ success: false, message: "Validation failed" }, { status: 422 }),
                ),
            )
            await expect(
                createSenderAddress({
                    label: "",
                    sender_name: "",
                    sender_phone: "",
                    province_name: "",
                    city_name: "",
                    district: "",
                    postal_code: "",
                    address_line: "",
                    plaque: "",
                    unit: "",
                    is_default: false,
                }),
            ).rejects.toThrow()
        })
    })

    describe("generateShippingLabels", () => {
        const payload: GenerateShippingLabelsPayload = {
            order_ids: ["01HZ001", "01HZ002"],
            sender_address_id: 1,
            paper_size: "a4",
            label_size: "10x15",
            copies_per_order: 1,
        }

        it("returns sheet with sender, labels and layout", async () => {
            const result = await generateShippingLabels(payload)
            expect(result.sender.sender_name).toBe("علی احمدی")
            expect(result.labels).toHaveLength(1)
            expect(result.layout.paper_size).toBe("a4")
        })

        it("sends correct payload to API", async () => {
            let sentBody: unknown
            server.use(
                http.post(`${B}/admin/shipping-labels`, async ({ request }) => {
                    sentBody = await request.clone().json()
                    return HttpResponse.json({ success: true, data: mockSheet })
                }),
            )
            await generateShippingLabels(payload)
            expect(sentBody).toMatchObject({
                order_ids: ["01HZ001", "01HZ002"],
                sender_address_id: 1,
                paper_size: "a4",
                label_size: "10x15",
                copies_per_order: 1,
            })
        })

        it("throws when success=false", async () => {
            server.use(
                http.post(`${B}/admin/shipping-labels`, () =>
                    HttpResponse.json({ success: false, message: "No orders found" }),
                ),
            )
            await expect(generateShippingLabels(payload)).rejects.toMatchObject({ success: false })
        })

        it("throws on network error", async () => {
            server.use(http.post(`${B}/admin/shipping-labels`, () => HttpResponse.error()))
            await expect(generateShippingLabels(payload)).rejects.toThrow()
        })
    })
})
