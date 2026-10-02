import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import { api } from "@/shared/lib/axios"
import { useAuthStore } from "@/features/auth/store/authStore"

const B = "http://localhost:8000/api/v1"

// --- MSW server -----------------------------------------------------------

const server = setupServer()

beforeEach(() => {
  server.listen({ onUnhandledRequest: "bypass" })
  useAuthStore.setState({ accessToken: "old-token", user: null })
})

afterEach(() => {
  server.resetHandlers()
  server.close()
  vi.restoreAllMocks()
  useAuthStore.setState({ accessToken: null, user: null })
})

// --------------------------------------------------------------------------

describe("axios interceptor — token refresh", () => {
  it("attaches Authorization header from authStore on every request", async () => {
    let capturedAuth: string | null = null

    server.use(
      http.get(`${B}/admin/products`, ({ request }) => {
        capturedAuth = request.headers.get("Authorization")
        return HttpResponse.json({ data: [] })
      })
    )

    await api.get("/admin/products")
    expect(capturedAuth).toBe("Bearer old-token")
  })

  it("retries original request with new token after successful refresh", async () => {
    let callCount = 0

    server.use(
      http.get(`${B}/admin/products`, () => {
        callCount++
        if (callCount === 1) {
          return new HttpResponse(null, { status: 401 })
        }
        return HttpResponse.json({ data: [] })
      }),
      http.post(`${B}/auth/refresh`, () =>
        HttpResponse.json({
          success: true,
          data: {
            access_token: "new-token",
            user: { id: "1", email: "admin@test.com" },
          },
        })
      )
    )

    await api.get("/admin/products")
    expect(callCount).toBe(2)
  })

    it("stores the new token in authStore after successful refresh", async () => {
        let callCount = 0
        server.use(
        http.get(`${B}/admin/products`, () => {
            callCount++
            if (callCount === 1) return new HttpResponse(null, { status: 401 })
            return HttpResponse.json({ data: [] })
        }),
        http.post(`${B}/auth/refresh`, () =>
            HttpResponse.json({
            success: true,
            data: {
                access_token: "new-token",
                user: { id: "1", email: "admin@test.com" },
            },
            })
        )
        )

        await api.get("/admin/products")
        expect(useAuthStore.getState().accessToken).toBe("new-token")
    })

  it("clears session when refresh request returns 401", async () => {
    server.use(
      http.get(`${B}/admin/products`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${B}/auth/refresh`, () => new HttpResponse(null, { status: 401 }))
    )

    await expect(api.get("/admin/products")).rejects.toThrow()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it("clears session when refresh response has invalid shape", async () => {
    server.use(
      http.get(`${B}/admin/products`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${B}/auth/refresh`, () =>
        // Missing required fields — isValidTokenData should reject this
        HttpResponse.json({ success: true, data: { wrong_field: true } })
      )
    )

    await expect(api.get("/admin/products")).rejects.toThrow()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it("does NOT trigger refresh when 401 comes from /auth/refresh itself (loop prevention)", async () => {
    let refreshCallCount = 0

    server.use(
      http.post(`${B}/auth/refresh`, () => {
        refreshCallCount++
        return new HttpResponse(null, { status: 401 })
      })
    )

    await expect(api.post("/auth/refresh")).rejects.toThrow()
    // Refresh endpoint itself returned 401 — must not re-trigger refresh
    expect(refreshCallCount).toBe(1)
  })

  it("does NOT trigger refresh when 401 comes from /auth/staff/login", async () => {
    let refreshCallCount = 0

    server.use(
      http.post(`${B}/auth/staff/login`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${B}/auth/refresh`, () => {
        refreshCallCount++
        return HttpResponse.json({ success: true, data: { access_token: "t", user: {} } })
      })
    )

    await expect(api.post("/auth/staff/login")).rejects.toThrow()
    expect(refreshCallCount).toBe(0)
  })

  it("does not retry the same request twice (_retry flag prevents double refresh)", async () => {
    let refreshCallCount = 0

    server.use(
      // Always returns 401 — even after retry
      http.get(`${B}/admin/products`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${B}/auth/refresh`, () => {
        refreshCallCount++
        return HttpResponse.json({
          success: true,
          data: { access_token: "new-token", user: { id: "1", email: "a@b.com" } },
        })
      })
    )

    await expect(api.get("/admin/products")).rejects.toThrow()
    // Refresh should be attempted exactly once — not again when retry also gets 401
    expect(refreshCallCount).toBe(1)
  })

  it("passes through non-401 errors without triggering refresh", async () => {
    let refreshCallCount = 0

    server.use(
      http.get(`${B}/admin/products`, () => new HttpResponse(null, { status: 500 })),
      http.post(`${B}/auth/refresh`, () => {
        refreshCallCount++
        return HttpResponse.json({ success: true, data: {} })
      })
    )

    await expect(api.get("/admin/products")).rejects.toThrow()
    expect(refreshCallCount).toBe(0)
  })

  it("passes through 403 without triggering token refresh", async () => {
    let refreshCallCount = 0

    server.use(
      http.get(`${B}/admin/products`, () =>
        HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 })
      ),
      http.post(`${B}/auth/refresh`, () => {
        refreshCallCount++
        return HttpResponse.json({ success: true, data: {} })
      })
    )

    await expect(api.get("/admin/products")).rejects.toThrow()
    expect(refreshCallCount).toBe(0)
  })
})

describe("axios interceptor — parallel 401 handling", () => {
  it("only makes one refresh call when multiple requests get 401 simultaneously", async () => {
    let refreshCallCount = 0
    let productCallCount = 0

    server.use(
      http.get(`${B}/admin/products`, () => {
        productCallCount++
        if (productCallCount <= 2) {
          return new HttpResponse(null, { status: 401 })
        }
        return HttpResponse.json({ data: [] })
      }),
      http.get(`${B}/admin/categories`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${B}/auth/refresh`, async () => {
        refreshCallCount++
        // Simulate network delay so both 401s arrive before refresh completes
        await new Promise((r) => setTimeout(r, 50))
        return HttpResponse.json({
          success: true,
          data: { access_token: "new-token", user: { id: "1", email: "a@b.com" } },
        })
      }),
      http.get(`${B}/admin/categories`, () => HttpResponse.json({ data: [] }))
    )

    await Promise.allSettled([
      api.get("/admin/products"),
      api.get("/admin/categories"),
    ])

    expect(refreshCallCount).toBe(1)
  })
})
