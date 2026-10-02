import { describe, it, expect, beforeEach } from "vitest"
import { useNotificationStore } from "@/shared/store/notificationStore"

beforeEach(() => {
useNotificationStore.setState({ items: [] })
})

describe("notificationStore", () => {
describe("push", () => {
it("adds a notification to items", () => {
const { push } = useNotificationStore.getState()
push({ kind: "success", message: "ذخیره شد" })
expect(useNotificationStore.getState().items).toHaveLength(1)
})

    it("returns a unique id string", () => {
        const { push } = useNotificationStore.getState()
        const id = push({ kind: "success", message: "ذخیره شد" })
        expect(typeof id).toBe("string")
        expect(id.length).toBeGreaterThan(0)
    })

    it("returns different ids for multiple pushes", () => {
        const { push } = useNotificationStore.getState()
        const id1 = push({ kind: "success", message: "اول" })
        const id2 = push({ kind: "error", message: "دوم" })
        expect(id1).not.toBe(id2)
    })

    it("stores message and kind correctly", () => {
        const { push } = useNotificationStore.getState()
        push({ kind: "error", message: "خطا رخ داد" })
        const item = useNotificationStore.getState().items[0]
        expect(item.kind).toBe("error")
        expect(item.message).toBe("خطا رخ داد")
    })

    it("stores optional code", () => {
        const { push } = useNotificationStore.getState()
        push({ kind: "error", message: "خطا", code: "ERR_401" })
        expect(useNotificationStore.getState().items[0].code).toBe("ERR_401")
    })

    it("uses default duration for success (3500ms)", () => {
        const { push } = useNotificationStore.getState()
        push({ kind: "success", message: "ذخیره شد" })
        expect(useNotificationStore.getState().items[0].durationMs).toBe(3500)
    })

    it("uses default duration for error (6500ms)", () => {
        const { push } = useNotificationStore.getState()
        push({ kind: "error", message: "خطا" })
        expect(useNotificationStore.getState().items[0].durationMs).toBe(6500)
    })

    it("uses default duration for warning (5500ms)", () => {
        const { push } = useNotificationStore.getState()
        push({ kind: "warning", message: "هشدار" })
        expect(useNotificationStore.getState().items[0].durationMs).toBe(5500)
    })

    it("uses default duration for info (4000ms)", () => {
        const { push } = useNotificationStore.getState()
        push({ kind: "info", message: "اطلاع" })
        expect(useNotificationStore.getState().items[0].durationMs).toBe(4000)
    })

    it("uses custom durationMs when provided", () => {
        const { push } = useNotificationStore.getState()
        push({ kind: "success", message: "ذخیره شد", durationMs: 1000 })
        expect(useNotificationStore.getState().items[0].durationMs).toBe(1000)
    })

    it("accumulates multiple notifications", () => {
        const { push } = useNotificationStore.getState()
        push({ kind: "success", message: "اول" })
        push({ kind: "error", message: "دوم" })
        push({ kind: "info", message: "سوم" })
        expect(useNotificationStore.getState().items).toHaveLength(3)
    })
})

describe("dismiss", () => {
    it("removes notification by id", () => {
        const { push, dismiss } = useNotificationStore.getState()
        const id = push({ kind: "success", message: "ذخیره شد" })
        dismiss(id)
        expect(useNotificationStore.getState().items).toHaveLength(0)
    })

    it("only removes the specified notification", () => {
        const { push, dismiss } = useNotificationStore.getState()
        const id1 = push({ kind: "success", message: "اول" })
        push({ kind: "error", message: "دوم" })
        dismiss(id1)
        const items = useNotificationStore.getState().items
        expect(items).toHaveLength(1)
        expect(items[0].message).toBe("دوم")
    })

    it("does nothing when id not found", () => {
        const { push, dismiss } = useNotificationStore.getState()
        push({ kind: "success", message: "ذخیره شد" })
        dismiss("nonexistent-id")
        expect(useNotificationStore.getState().items).toHaveLength(1)
    })

    it("can dismiss all items one by one", () => {
        const { push, dismiss } = useNotificationStore.getState()
        const id1 = push({ kind: "success", message: "اول" })
        const id2 = push({ kind: "error", message: "دوم" })
        dismiss(id1)
        dismiss(id2)
        expect(useNotificationStore.getState().items).toHaveLength(0)
    })
})
})