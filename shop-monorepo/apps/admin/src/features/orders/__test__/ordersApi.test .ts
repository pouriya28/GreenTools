import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { fetchOrders, fetchOrder, updateOrderStatus } from "@/features/orders/api/ordersApi"

const BASE = "/admin/orders"

const mockListPage1 = {
  success: true,
  data: {
    data: [
      {
        id: "01HZ",
        status: "pending_payment",
        total_amount: 150000,
        items_count: 2,
        created_at: "2024-01-01T00:00:00Z",
        customer_name: "Ali",
        customer_phone: "09121234567",
      },
    ],
    meta: { current_page: 1, last_page: 2, per_page: 15, total: 20 },
  },
}

const mockDetail = {
  success: true,
  data: {
    id: 1,
    status: "paid",
    total_amount: 200000,
    shipping_cost: 10000,
    shipping_method_name: "پست پیشتاز",
    created_at: "2024-01-01T00:00:00Z",
    payment_status: "completed",
    items: [
      { id: 1, product_id: 5, product_name: "دستکش", sku: "GL-01", unit_price: 95000, quantity: 2, subtotal: 190000 },
    ],
    address: {
      recipient_name: "Ali",
      recipient_phone: "09121234567",
      province_name: "تهران",
      city_name: "تهران",
      district: null,
      postal_code: "1234567890",
      address_line: "خیابان آزادی",
      plaque: "1",
      unit: null,
      latitude: null,
      longitude: null,
    },
    shipment: null,
  },
}

const server = setupServer(
  http.get(BASE, () => HttpResponse.json(mockListPage1)),
  http.get(`${BASE}/:id`, () => HttpResponse.json(mockDetail)),
  http.patch(`${BASE}/:id/status`, async ({ request }) => {
    const body = await request.clone().json() as { status: string }
    return HttpResponse.json({ success: true, data: { ...mockDetail.data, status: body.status } })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("ordersApi", () => {
  describe("fetchOrders", () => {
    it("returns paginated list", async () => {
      const result = await fetchOrders({})
      expect(result.data).toHaveLength(1)
      expect(result.meta.total).toBe(20)
    })

    it("passes filters as query params", async () => {
      let capturedUrl: URL | null = null
      server.use(
        http.get(BASE, ({ request }) => {
          capturedUrl = new URL(request.url)
          return HttpResponse.json(mockListPage1)
        }),
      )
      await fetchOrders({ status: "paid", page: 2, per_page: 10 })
      expect(capturedUrl!.searchParams.get("status")).toBe("paid")
      expect(capturedUrl!.searchParams.get("page")).toBe("2")
      expect(capturedUrl!.searchParams.get("per_page")).toBe("10")
    })

    it("throws when success=false", async () => {
      server.use(http.get(BASE, () => HttpResponse.json({ success: false, message: "Forbidden" })))
      await expect(fetchOrders({})).rejects.toMatchObject({ success: false })
    })

    it("throws on network error", async () => {
      server.use(http.get(BASE, () => HttpResponse.error()))
      await expect(fetchOrders({})).rejects.toThrow()
    })
  })

  describe("fetchOrder", () => {
    it("returns order detail by id", async () => {
      const result = await fetchOrder(1)
      expect(result.id).toBe(1)
      expect(result.items).toHaveLength(1)
      expect(result.address?.recipient_name).toBe("Ali")
    })

    it("throws on 404", async () => {
      server.use(http.get(`${BASE}/:id`, () => new HttpResponse(null, { status: 404 })))
      await expect(fetchOrder(999)).rejects.toThrow()
    })

    it("passes correct id in URL", async () => {
      let capturedId: string | undefined
      server.use(
        http.get(`${BASE}/:id`, ({ params }) => {
          capturedId = params.id as string
          return HttpResponse.json(mockDetail)
        }),
      )
      await fetchOrder(42)
      expect(capturedId).toBe("42")
    })

    it("throws when success=false", async () => {
      server.use(http.get(`${BASE}/:id`, () => HttpResponse.json({ success: false })))
      await expect(fetchOrder(1)).rejects.toMatchObject({ success: false })
    })
  })

  describe("updateOrderStatus", () => {
    it("sends PATCH with status body", async () => {
      let body: unknown
      server.use(
        http.patch(`${BASE}/:id/status`, async ({ request }) => {
          body = await request.clone().json()
          return HttpResponse.json({ success: true, data: { ...mockDetail.data, status: "processing" } })
        }),
      )
      const result = await updateOrderStatus(1, "processing")
      expect(body).toEqual({ status: "processing" })
      expect(result.status).toBe("processing")
    })

    it("throws on 422", async () => {
      server.use(
        http.patch(`${BASE}/:id/status`, () =>
          HttpResponse.json({ success: false, message: "Invalid transition" }, { status: 422 }),
        ),
      )
      await expect(updateOrderStatus(1, "cancelled")).rejects.toThrow()
    })

    it("throws when success=false", async () => {
      server.use(http.patch(`${BASE}/:id/status`, () => HttpResponse.json({ success: false })))
      await expect(updateOrderStatus(1, "paid")).rejects.toMatchObject({ success: false })
    })
  })
})
