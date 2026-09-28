import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Verify2FAForm } from '../components/Verify2FAForm'

const defaultProps = {
  onSubmit: vi.fn(),
  isSubmitting: false,
  errorMessage: null,
}

function setup(props = {}) {
  const user = userEvent.setup()
  const result = render(<Verify2FAForm {...defaultProps} {...props} />)
  return { user, ...result }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Verify2FAForm', () => {
  describe('rendering', () => {
    it('renders the totp input field', () => {
      setup()
      expect(screen.getByLabelText('کد شش‌رقمی اپلیکیشن احراز هویت')).toBeInTheDocument()
    })

    it('input has correct attributes for mobile numeric keyboard', () => {
      setup()
      const input = screen.getByLabelText('کد شش‌رقمی اپلیکیشن احراز هویت')
      expect(input).toHaveAttribute('inputMode', 'numeric')
      expect(input).toHaveAttribute('pattern', '[0-9]*')
      expect(input).toHaveAttribute('maxLength', '6')
      expect(input).toHaveAttribute('autoComplete', 'one-time-code')
    })

    it('renders submit button with default text', () => {
      setup()
      expect(screen.getByRole('button', { name: 'تایید' })).toBeInTheDocument()
    })

    it('does not show error banner when errorMessage is null', () => {
      setup()
      expect(screen.queryByText(/خطا/)).not.toBeInTheDocument()
    })
  })

  describe('isSubmitting state', () => {
    it('disables button when isSubmitting is true', () => {
      setup({ isSubmitting: true })
      expect(screen.getByRole('button', { name: 'در حال بررسی...' })).toBeDisabled()
    })

    it('shows loading text when isSubmitting', () => {
      setup({ isSubmitting: true })
      expect(screen.getByRole('button', { name: 'در حال بررسی...' })).toBeInTheDocument()
    })
  })

  describe('error message banner', () => {
    it('displays errorMessage when provided', () => {
      setup({ errorMessage: 'کد وارد شده اشتباه است' })
      expect(screen.getByText('کد وارد شده اشتباه است')).toBeInTheDocument()
    })

    it('hides errorMessage when null', () => {
      setup({ errorMessage: null })
      expect(screen.queryByText('کد وارد شده اشتباه است')).not.toBeInTheDocument()
    })
  })

  describe('input security — non-numeric filtering', () => {
    it('strips non-numeric characters from input', async () => {
      const { user } = setup()
      const input = screen.getByLabelText('کد شش‌رقمی اپلیکیشن احراز هویت')
      await user.type(input, 'abc123')
      expect(input).toHaveValue('123')
    })

    it('accepts only digits', async () => {
      const { user } = setup()
      const input = screen.getByLabelText('کد شش‌رقمی اپلیکیشن احراز هویت')
      await user.type(input, '123456')
      expect(input).toHaveValue('123456')
    })
  })

  describe('validation', () => {
    it('shows error when submitting empty form', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'تایید' }))
      await waitFor(() => {
        expect(screen.getByText(/کد/i, { selector: 'span' })).toBeInTheDocument()
      })
      expect(defaultProps.onSubmit).not.toHaveBeenCalled()
    })

    it('shows error for code shorter than 6 digits', async () => {
      const { user } = setup()
      const input = screen.getByLabelText('کد شش‌رقمی اپلیکیشن احراز هویت')
      await user.type(input, '123')
      await user.click(screen.getByRole('button', { name: 'تایید' }))
      await waitFor(() => {
        expect(screen.getByText(/کد/i, { selector: 'span' })).toBeInTheDocument()
      })
      expect(defaultProps.onSubmit).not.toHaveBeenCalled()
    })
  })

    describe('auto-submit', () => {
    it('auto-submits when exactly 6 digits are entered', async () => {
        const { user } = setup()
        const input = screen.getByLabelText('کد شش‌رقمی اپلیکیشن احراز هویت')
        await user.type(input, '123456')
        await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalled()
        expect(defaultProps.onSubmit.mock.calls[0][0]).toEqual({ totp_code: '123456' })
        })
    })


    it('does not auto-submit when isSubmitting is true', async () => {
        const { user } = setup({ isSubmitting: true })
        const input = screen.getByLabelText('کد شش‌رقمی اپلیکیشن احراز هویت')
        await user.type(input, '123456')
        await waitFor(() => {
        expect(defaultProps.onSubmit).not.toHaveBeenCalled()
        })
    })
    })

  describe('manual submission', () => {
    it('calls onSubmit with correct totp_code on valid input', async () => {
      const { user } = setup()
      const input = screen.getByLabelText('کد شش‌رقمی اپلیکیشن احراز هویت')
      await user.type(input, '654321')
      await user.click(screen.getByRole('button', { name: 'تایید' }))
      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
          { totp_code: '654321' },
          expect.anything()
        )
      })
    })
  })
})