import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act, fireEvent } from "@testing-library/react"
import { NotificationDock } from "@/shared/components/feedback/NotificationDock"
import { useNotificationStore } from "@/shared/store/notificationStore"

// framer-motion animations don't work in jsdom — replace with plain DOM elements.
// NOTE: oxc parser (Vite 8) forbids destructuring inside JSX attribute expressions,
// so we use React.createElement with a plain props variable instead.
vi.mock("framer-motion", () => {
const React = require("react")
function makeMotion(tag: string) {
return function MotionEl(props: any) {
const { children, layout, initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
return React.createElement(tag, rest, children)
}
}
return {
AnimatePresence: function AnimatePresence(props: any) {
return React.createElement(React.Fragment, null, props.children)
},
motion: {
div: makeMotion("div"),
button: makeMotion("button"),
span: makeMotion("span"),
ul: makeMotion("ul"),
li: makeMotion("li"),
p: makeMotion("p"),
},
}
})

beforeEach(() => {
useNotificationStore.setState({ items: [] })
vi.useFakeTimers()
})

afterEach(() => {
vi.useRealTimers()
})

describe("NotificationDock", () => {
describe("empty state", () => {
it("renders nothing when no notifications", () => {
const { container } = render()
expect(container.querySelector("[class*='Capsule']")).toBeNull()
expect(screen.queryByRole("button", { name: "بستن" })).not.toBeInTheDocument()
})
})

describe("single notification", () => {
    it("shows notification message", () => {
        render(<NotificationDock />)
        act(() => {
            useNotificationStore.getState().push({ kind: "success", message: "ذخیره شد" })
        })
        expect(screen.getByText("ذخیره شد")).toBeInTheDocument()
    })

    it("shows error notification", () => {
        render(<NotificationDock />)
        act(() => {
            useNotificationStore.getState().push({ kind: "error", message: "خطا رخ داد" })
        })
        expect(screen.getByText("خطا رخ داد")).toBeInTheDocument()
    })

    it("shows warning notification", () => {
        render(<NotificationDock />)
        act(() => {
            useNotificationStore.getState().push({ kind: "warning", message: "هشدار" })
        })
        expect(screen.getByText("هشدار")).toBeInTheDocument()
    })

    it("renders dismiss button", () => {
        render(<NotificationDock />)
        act(() => {
            useNotificationStore.getState().push({ kind: "success", message: "ذخیره شد" })
        })
        expect(screen.getByRole("button", { name: "بستن" })).toBeInTheDocument()
    })

    // userEvent + fake timers → deadlock; fireEvent is synchronous and safe here
    it("dismisses notification when بستن clicked", () => {
        render(<NotificationDock />)
        act(() => {
            useNotificationStore.getState().push({ kind: "success", message: "ذخیره شد" })
        })
        fireEvent.click(screen.getByRole("button", { name: "بستن" }))
        expect(screen.queryByText("ذخیره شد")).not.toBeInTheDocument()
    })

    // waitFor deadlocks with fake timers — advance time synchronously inside act instead
    it("auto-dismisses after durationMs", () => {
        render(<NotificationDock />)
        act(() => {
            useNotificationStore.getState().push({ kind: "success", message: "ذخیره شد", durationMs: 1000 })
        })
        expect(screen.getByText("ذخیره شد")).toBeInTheDocument()
        act(() => { vi.advanceTimersByTime(1000) })
        expect(screen.queryByText("ذخیره شد")).not.toBeInTheDocument()
    })
})

describe("multiple notifications", () => {
    it("shows only last notification by default (collapsed)", () => {
        render(<NotificationDock />)
        act(() => {
            useNotificationStore.getState().push({ kind: "success", message: "اول" })
            useNotificationStore.getState().push({ kind: "error", message: "دوم" })
        })
        expect(screen.queryByText("اول")).not.toBeInTheDocument()
        expect(screen.getByText("دوم")).toBeInTheDocument()
    })

    it("shows '+N پیام دیگر' when multiple notifications exist", () => {
        render(<NotificationDock />)
        act(() => {
            useNotificationStore.getState().push({ kind: "success", message: "اول" })
            useNotificationStore.getState().push({ kind: "error", message: "دوم" })
        })
        expect(screen.getByText(/پیام دیگر/)).toBeInTheDocument()
    })

    // userEvent.hover + fake timers → deadlock; fireEvent.mouseEnter is synchronous
    it("shows all notifications on hover", () => {
        render(<NotificationDock />)
        act(() => {
            useNotificationStore.getState().push({ kind: "success", message: "اول", durationMs: 999999 })
            useNotificationStore.getState().push({ kind: "error", message: "دوم", durationMs: 999999 })
        })
        const dock = screen.getByText("دوم").closest("[class*='fixed']") as HTMLElement
        fireEvent.mouseEnter(dock)
        expect(screen.getByText("اول")).toBeInTheDocument()
        expect(screen.getByText("دوم")).toBeInTheDocument()
    })

    it("hides extra count label after expanding", () => {
        render(<NotificationDock />)
        act(() => {
            useNotificationStore.getState().push({ kind: "success", message: "اول", durationMs: 999999 })
            useNotificationStore.getState().push({ kind: "error", message: "دوم", durationMs: 999999 })
        })
        const dock = screen.getByText("دوم").closest("[class*='fixed']") as HTMLElement
        fireEvent.mouseEnter(dock)
        expect(screen.queryByText(/پیام دیگر/)).not.toBeInTheDocument()
    })
})
})