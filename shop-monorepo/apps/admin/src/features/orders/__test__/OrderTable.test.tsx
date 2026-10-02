import { describe, it, expect, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OrderTable } from "@/features/orders/components/OrderTable"
import type { OrderListItem } from "@/features/orders/types/Order"

const makeOrder = (overrides: Partial<OrderListItem> = {}): OrderListItem => ({
  id: "01HZ001",
  status: "pending_payment",
  total_amount: 150000,
  items_count: 3,
  created_at: "2024-06-01T10:00:00Z",
  customer_name: "علی محمدی",
  customer_phone: "09121234567",
  ...overrides,
})

describe("OrderTable", () => {
  describe("empty state", () => {
    it("shows empty message when orders array is empty", () => {
      render(<OrderTable orders={[]} onView={vi.fn()} />)
      expect(screen.getByText(/سفارشی با این فیلترها پیدا نشد/)).toBeInTheDocument()
    })

    it("does not render a table when empty", () => {
      render(<OrderTable orders={[]} onView={vi.fn()} />)
      expect(screen.queryByRole("table")).not.toBeInTheDocument()
    })
  })

  describe("table rendering", () => {
    it("renders column headers", () => {
      render(<OrderTable orders={[makeOrder()]} onView={vi.fn()} />)
      expect(screen.getByText("شماره سفارش")).toBeInTheDocument()
      expect(screen.getByText("خریدار")).toBeInTheDocument()
      expect(screen.getByText("وضعیت")).toBeInTheDocument()
      expect(screen.getByText("تعداد اقلام")).toBeInTheDocument()
      expect(screen.getByText("مبلغ کل")).toBeInTheDocument()
      expect(screen.getByText("تاریخ ثبت")).toBeInTheDocument()
      expect(screen.getByText("عملیات")).toBeInTheDocument()
    })

    it("renders order id with # prefix", () => {
      render(<OrderTable orders={[makeOrder({ id: "01HZ999" })]} onView={vi.fn()} />)
      expect(screen.getByText("#01HZ999")).toBeInTheDocument()
    })

    it("renders customer name", () => {
      render(<OrderTable orders={[makeOrder()]} onView={vi.fn()} />)
      expect(screen.getByText("علی محمدی")).toBeInTheDocument()
    })

    it("renders customer phone", () => {
      render(<OrderTable orders={[makeOrder()]} onView={vi.fn()} />)
      expect(screen.getByText("09121234567")).toBeInTheDocument()
    })

    it("renders — when customer_name is null", () => {
      render(<OrderTable orders={[makeOrder({ customer_name: null })]} onView={vi.fn()} />)
      expect(screen.getByText("—")).toBeInTheDocument()
    })

    it("does not render phone row when customer_phone is null", () => {
      render(<OrderTable orders={[makeOrder({ customer_phone: null })]} onView={vi.fn()} />)
      expect(screen.queryByText("09121234567")).not.toBeInTheDocument()
    })

    it("renders status badge", () => {
      render(<OrderTable orders={[makeOrder({ status: "paid" })]} onView={vi.fn()} />)
      expect(screen.getByText("پرداخت‌شده")).toBeInTheDocument()
    })

    it("renders multiple orders as multiple rows", () => {
      const orders = [
        makeOrder({ id: "01A", customer_name: "Ali" }),
        makeOrder({ id: "02B", customer_name: "Sara" }),
        makeOrder({ id: "03C", customer_name: "Reza" }),
      ]
      render(<OrderTable orders={orders} onView={vi.fn()} />)
      expect(screen.getByText("#01A")).toBeInTheDocument()
      expect(screen.getByText("#02B")).toBeInTheDocument()
      expect(screen.getByText("#03C")).toBeInTheDocument()
    })
  })

  describe("view button", () => {
    it("renders detail button for each order", () => {
      const orders = [makeOrder({ id: "01A" }), makeOrder({ id: "02B" })]
      render(<OrderTable orders={orders} onView={vi.fn()} />)
      expect(screen.getAllByRole("button", { name: "جزئیات" })).toHaveLength(2)
    })

    it("calls onView with correct order when button clicked", async () => {
      const user = userEvent.setup()
      const onView = vi.fn()
      const order = makeOrder({ id: "01HZ001" })
      render(<OrderTable orders={[order]} onView={onView} />)
      await user.click(screen.getByRole("button", { name: "جزئیات" }))
      expect(onView).toHaveBeenCalledWith(order)
    })

    it("calls onView with correct order when multiple orders present", async () => {
      const user = userEvent.setup()
      const onView = vi.fn()
      const orders = [
        makeOrder({ id: "01A", customer_name: "Ali" }),
        makeOrder({ id: "02B", customer_name: "Sara" }),
      ]
      render(<OrderTable orders={orders} onView={onView} />)
      const buttons = screen.getAllByRole("button", { name: "جزئیات" })
      await user.click(buttons[1])
      expect(onView).toHaveBeenCalledWith(orders[1])
    })
  })

  describe("security", () => {
    it("does not execute XSS in customer_name", () => {
      const xss = '<img src=x onerror="window.__xss=true">'
      render(<OrderTable orders={[makeOrder({ customer_name: xss })]} onView={vi.fn()} />)
      expect((window as unknown as Record<string, unknown>).__xss).toBeUndefined()
      // rendered as text, not HTML
      expect(screen.getByText(xss)).toBeInTheDocument()
    })

    it("does not execute XSS in customer_phone", () => {
      const xss = '<script>window.__xss2=true</script>'
      render(<OrderTable orders={[makeOrder({ customer_phone: xss })]} onView={vi.fn()} />)
      expect((window as unknown as Record<string, unknown>).__xss2).toBeUndefined()
    })

    it("does not execute XSS in order id", () => {
      const xss = '"><img src=x onerror=alert(1)>'
      render(<OrderTable orders={[makeOrder({ id: xss })]} onView={vi.fn()} />)
      expect(screen.getByText(`#${xss}`)).toBeInTheDocument()
    })
  })
})
