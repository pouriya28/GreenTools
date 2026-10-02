import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ManualOverrideDialog } from '../components/ManualOverrideDialog'

const EXCHANGE_BASE = 'http://localhost:8000/api/v1/admin/exchange-rates'

const mockCurrentRate = { rate: '65000.0000', status: 'applied', source: 'manual_admin', fetched_at: null }
const mockOverrideResult = { message: 'ok', exchange_rate_id: 1, batch_id: 'BATCH-001' }

const server = setupServer(
  http.get(`${EXCHANGE_BASE}/current`, () =>
    HttpResponse.json({ data: mockCurrentRate }),
  ),
  http.post(`${EXCHANGE_BASE}/override`, () =>
    HttpResponse.json(mockOverrideResult, { status: 201 }),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function setup(props: Partial<Parameters<typeof ManualOverrideDialog>[0]> = {}) {
  const onOpenChange = vi.fn()
  const onSuccess = vi.fn()
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={makeClient()}>
      <ManualOverrideDialog
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        {...props}
      />
    </QueryClientProvider>,
  )
  return { onOpenChange, onSuccess, user }
}

describe('ManualOverrideDialog', () => {
  describe('form step (step=form)', () => {
    it('renders rate and reason fields', () => {
      setup()
      expect(screen.getByRole('spinbutton')).toBeInTheDocument()
      expect(screen.getByLabelText(/دلیل ثبت دستی/)).toBeInTheDocument()
    })

    it('renders "ادامه" submit button', () => {
      setup()
      expect(screen.getByRole('button', { name: 'ادامه' })).toBeInTheDocument()
    })

    it('shows rate validation error when rate is empty', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'ادامه' }))
      await waitFor(() =>
        expect(screen.getByText(/مثبت باشد/)).toBeInTheDocument(),
      )
    })

    it('shows reason validation error when reason is too short', async () => {
      const { user } = setup()
      await user.type(screen.getByRole('spinbutton'), '65000')
      await user.type(screen.getByLabelText(/دلیل ثبت دستی/), 'کوتاه')
      await user.click(screen.getByRole('button', { name: 'ادامه' }))
      await waitFor(() =>
        expect(screen.getByText(/برای audit قابل استفاده/)).toBeInTheDocument(),
      )
    })

    it('shows reason character counter', async () => {
      const { user } = setup()
      await user.type(screen.getByLabelText(/دلیل ثبت دستی/), 'متن تست')
      expect(screen.getByText(/\/500/)).toBeInTheDocument()
    })
  })

  describe('fetch current rate', () => {
    it('fills rate field with current rate from API', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'دریافت نرخ فعلی' }))
      await waitFor(() =>
        expect(screen.getByRole('spinbutton')).toHaveValue(65000),
      )
    })

    it('shows hint text after fetching current rate', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'دریافت نرخ فعلی' }))
      await waitFor(() =>
        expect(screen.getByText(/آخرین نرخ ثبت‌شده/)).toBeInTheDocument(),
      )
    })

    it('shows error when fetch current rate fails', async () => {
      server.use(
        http.get(`${EXCHANGE_BASE}/current`, () =>
          new HttpResponse(null, { status: 500 }),
        ),
      )
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'دریافت نرخ فعلی' }))
      await waitFor(() =>
        expect(screen.getByText(/دریافت نرخ فعلی ناموفق/)).toBeInTheDocument(),
      )
    })
  })

  describe('confirm step (step=confirm)', () => {
    async function goToConfirm(user: ReturnType<typeof userEvent.setup>) {
      await user.type(screen.getByRole('spinbutton'), '65000')  // ← fix
      await user.type(
        screen.getByLabelText(/دلیل ثبت دستی/),
        'نرخ جدید از منبع رسمی بانک مرکزی اخذ شد',
      )
      await user.click(screen.getByRole('button', { name: 'ادامه' }))
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'ثبت نهایی نرخ' })).toBeInTheDocument(),
      )
    }

    it('shows confirm step with rate in message', async () => {
      const { user } = setup()
      await goToConfirm(user)
      expect(screen.getByText(/65000/)).toBeInTheDocument()
    })

    it('"برگشت" button has autoFocus to prevent accidental Enter submission', async () => {
      const { user } = setup()
      await goToConfirm(user)
      expect(screen.getByRole('button', { name: 'برگشت' })).toHaveFocus()
    })

    it('goes back to form step on "برگشت" click', async () => {
      const { user } = setup()
      await goToConfirm(user)
      await user.click(screen.getByRole('button', { name: 'برگشت' }))
      expect(screen.getByRole('button', { name: 'ادامه' })).toBeInTheDocument()
    })

    it('calls onSuccess with batchId after successful submit', async () => {
      const { user, onSuccess } = setup()
      await goToConfirm(user)
      await user.click(screen.getByRole('button', { name: 'ثبت نهایی نرخ' }))
      await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('BATCH-001'))
    })

    it('calls onOpenChange(false) after successful submit', async () => {
      const { user, onOpenChange } = setup()
      await goToConfirm(user)
      await user.click(screen.getByRole('button', { name: 'ثبت نهایی نرخ' }))
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    })

    it('shows error and returns to form on API failure', async () => {
      server.use(
        http.post(`${EXCHANGE_BASE}/override`, () =>
          new HttpResponse(null, { status: 429 }),
        ),
      )
      const { user } = setup()
      await goToConfirm(user)
      await user.click(screen.getByRole('button', { name: 'ثبت نهایی نرخ' }))
      await waitFor(() =>
        expect(screen.getByText(/ناموفق/)).toBeInTheDocument(),
      )
      expect(screen.getByRole('button', { name: 'ادامه' })).toBeInTheDocument()
    })
  })

  describe('security', () => {
    it('rate field is a NumericInput (type=number) to prevent non-numeric entry', () => {
      setup()
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number')
    })

    it('reason field has maxLength=500', () => {
      setup()
      expect(screen.getByLabelText(/دلیل ثبت دستی/)).toHaveAttribute('maxlength', '500')
    })
  })

  describe('close behavior', () => {
    it('calls onOpenChange(false) on "انصراف" click', async () => {
      const { user, onOpenChange } = setup()
      await user.click(screen.getByRole('button', { name: 'انصراف' }))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})