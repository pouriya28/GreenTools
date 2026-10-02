import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OrderFilters } from "@/features/orders/components/OrderFilters"
import type { OrderListFilters } from "@/features/orders/types/Order"

vi.mock("@/shared/components/date-picker/DatePicker", () => ({
    DatePicker: ({
        value,
        onChange,
        placeholder,
    }: {
        value: string | null
        onChange: (v: string | null) => void
        placeholder: string
    }) => (
        <input
            data-testid={`datepicker-${placeholder}`}
            value={value ?? ""}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value || null)}
        />
    ),
}))

afterEach(() => vi.useRealTimers())

function renderFilters(filters: OrderListFilters = {}, onChange = vi.fn()) {
    const result = render(<OrderFilters filters={filters} onChange={onChange} />)
    return { onChange, ...result }
}

// Helper: type into input using fireEvent (safe with fake timers)
function typeIntoInput(input: HTMLElement, value: string) {
    fireEvent.change(input, { target: { value } })
}

describe("OrderFilters", () => {
    describe("search input", () => {
        it("renders search input with placeholder", () => {
            renderFilters()
            expect(screen.getByPlaceholderText(/جستجو بر اساس نام/)).toBeInTheDocument()
        })

        it("reflects initial search value from filters", () => {
            renderFilters({ search: "ali" })
            expect(screen.getByPlaceholderText(/جستجو بر اساس نام/)).toHaveValue("ali")
        })

        it("enforces maxLength=100", () => {
            renderFilters()
            expect(screen.getByPlaceholderText(/جستجو بر اساس نام/)).toHaveAttribute("maxlength", "100")
        })

        it("debounces onChange — does not call immediately on typing", () => {
            vi.useFakeTimers()
            const onChange = vi.fn()
            render(<OrderFilters filters={{}} onChange={onChange} />)
            const input = screen.getByPlaceholderText(/جستجو بر اساس نام/)
            typeIntoInput(input, "ali")
            expect(onChange).not.toHaveBeenCalled()
        })

        it("calls onChange after debounce delay", () => {
            vi.useFakeTimers()
            const onChange = vi.fn()
            render(<OrderFilters filters={{}} onChange={onChange} />)
            const input = screen.getByPlaceholderText(/جستجو بر اساس نام/)
            typeIntoInput(input, "ali")
            vi.advanceTimersByTime(400)
            expect(onChange).toHaveBeenCalledWith({ search: "ali" })
        })

        it("trims whitespace before calling onChange", () => {
            vi.useFakeTimers()
            const onChange = vi.fn()
            render(<OrderFilters filters={{}} onChange={onChange} />)
            const input = screen.getByPlaceholderText(/جستجو بر اساس نام/)
            typeIntoInput(input, "  ali  ")
            vi.advanceTimersByTime(400)
            expect(onChange).toHaveBeenCalledWith({ search: "ali" })
        })

        it("calls onChange with undefined when search is cleared", () => {
            vi.useFakeTimers()
            const onChange = vi.fn()
            render(<OrderFilters filters={{ search: "ali" }} onChange={onChange} />)
            const input = screen.getByPlaceholderText(/جستجو بر اساس نام/)
            typeIntoInput(input, "")
            vi.advanceTimersByTime(400)
            expect(onChange).toHaveBeenCalledWith({ search: undefined })
        })

        it("does not call onChange when trimmed value equals current filter", () => {
            vi.useFakeTimers()
            const onChange = vi.fn()
            render(<OrderFilters filters={{ search: "ali" }} onChange={onChange} />)
            const input = screen.getByPlaceholderText(/جستجو بر اساس نام/)
            // value with trailing space — trimmed still equals "ali"
            typeIntoInput(input, "ali ")
            vi.advanceTimersByTime(400)
            expect(onChange).not.toHaveBeenCalled()
        })

        it("does not overwrite input while user is focused and typing", async () => {
            const { rerender } = render(<OrderFilters filters={{}} onChange={vi.fn()} />)
            const input = screen.getByPlaceholderText(/جستجو بر اساس نام/)
            await userEvent.click(input)
            // simulate user having typed "ali " (with trailing space)
            fireEvent.change(input, { target: { value: "ali " } })
            // parent resets filter while input is still focused
            rerender(<OrderFilters filters={{ search: "ali" }} onChange={vi.fn()} />)
            // focus check prevents overwriting active input
            expect(input).toHaveValue("ali ")
        })

        it("resets input when filters.search changes while input is not focused", async () => {
            const { rerender } = render(<OrderFilters filters={{ search: "ali" }} onChange={vi.fn()} />)
            const input = screen.getByPlaceholderText(/جستجو بر اساس نام/)
            input.blur()
            rerender(<OrderFilters filters={{ search: undefined }} onChange={vi.fn()} />)
            await waitFor(() => expect(input).toHaveValue(""))
        })

        it("uses latest onChange reference even if parent re-renders between keystrokes", () => {
            vi.useFakeTimers()
            const onChange1 = vi.fn()
            const onChange2 = vi.fn()
            const { rerender } = render(<OrderFilters filters={{}} onChange={onChange1} />)
            const input = screen.getByPlaceholderText(/جستجو بر اساس نام/)
            typeIntoInput(input, "ali")
            // swap onChange before debounce fires
            rerender(<OrderFilters filters={{}} onChange={onChange2} />)
            vi.advanceTimersByTime(400)
            expect(onChange1).not.toHaveBeenCalled()
            expect(onChange2).toHaveBeenCalledWith({ search: "ali" })
        })
    })

    describe("status select", () => {
        it("renders combobox", () => {
            renderFilters()
            expect(screen.getByRole("combobox")).toBeInTheDocument()
        })
                
        it("lists all 7 order statuses plus 'همه' option", async () => {
            const user = userEvent.setup()
            renderFilters()
            await user.click(screen.getByRole("combobox"))
            expect(screen.getAllByRole("option", { hidden: true })).toHaveLength(8)
        })

        it("calls onChange with selected status", async () => {
            const user = userEvent.setup()
            const { onChange } = renderFilters()
            await user.click(screen.getByRole("combobox"))
            await user.click(screen.getByRole("option", { name: "پرداخت‌شده" }))
            expect(onChange).toHaveBeenCalledWith({ status: "paid" })
        })

        it("calls onChange with undefined when 'همه' selected", async () => {
            const user = userEvent.setup()
            const { onChange } = renderFilters({ status: "paid" })
            await user.click(screen.getByRole("combobox"))
            await user.click(screen.getByRole("option", { name: "همه وضعیت‌ها" }))
            expect(onChange).toHaveBeenCalledWith({ status: undefined })
        })
    })

    describe("date pickers", () => {
        it("renders from-date and to-date pickers", () => {
            renderFilters()
            expect(screen.getByTestId("datepicker-از تاریخ")).toBeInTheDocument()
            expect(screen.getByTestId("datepicker-تا تاریخ")).toBeInTheDocument()
        })

        it("calls onChange with date_from when set", () => {
            const onChange = vi.fn()
            renderFilters({}, onChange)
            fireEvent.change(screen.getByTestId("datepicker-از تاریخ"), { target: { value: "2024-03-01" } })
            expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ date_from: "2024-03-01" }))
        })

        it("calls onChange with date_to when set", () => {
            const onChange = vi.fn()
            renderFilters({}, onChange)
            fireEvent.change(screen.getByTestId("datepicker-تا تاریخ"), { target: { value: "2024-06-01" } })
            expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ date_to: "2024-06-01" }))
        })

        it("calls onChange with undefined date_from when cleared", () => {
            const onChange = vi.fn()
            renderFilters({ date_from: "2024-01-01" }, onChange)
            fireEvent.change(screen.getByTestId("datepicker-از تاریخ"), { target: { value: "" } })
            expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ date_from: undefined }))
        })

        it("clears date_to when date_from is set later than current date_to", () => {
            const onChange = vi.fn()
            renderFilters({ date_from: "2024-01-01", date_to: "2024-06-01" }, onChange)
            fireEvent.change(screen.getByTestId("datepicker-از تاریخ"), { target: { value: "2024-12-01" } })
            expect(onChange).toHaveBeenCalledWith({ date_from: "2024-12-01", date_to: undefined })
        })

        it("clears date_from when date_to is set earlier than current date_from", () => {
            const onChange = vi.fn()
            renderFilters({ date_from: "2024-06-01", date_to: "2024-12-01" }, onChange)
            fireEvent.change(screen.getByTestId("datepicker-تا تاریخ"), { target: { value: "2024-01-01" } })
            expect(onChange).toHaveBeenCalledWith({ date_to: "2024-01-01", date_from: undefined })
        })

        it("does not clear date_to when date_from is valid and earlier", () => {
            const onChange = vi.fn()
            renderFilters({ date_to: "2024-12-01" }, onChange)
            fireEvent.change(screen.getByTestId("datepicker-از تاریخ"), { target: { value: "2024-01-01" } })
            expect(onChange).toHaveBeenCalledWith({ date_from: "2024-01-01" })
        })
    })
})
