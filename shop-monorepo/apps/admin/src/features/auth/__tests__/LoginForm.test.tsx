import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../components/LoginForm'

const defaultProps = {
  onSubmit: vi.fn(),
  isSubmitting: false,
  errorMessage: null,
}

function setup(props = {}) {
  const user = userEvent.setup()
  const result = render(<LoginForm {...defaultProps} {...props} />)
  return { user, ...result }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LoginForm', () => {
  describe('rendering', () => {
    it('renders login and password fields', () => {
      setup()
      expect(screen.getByLabelText('ایمیل یا نام کاربری')).toBeInTheDocument()
      expect(screen.getByLabelText('رمز عبور')).toBeInTheDocument()
    })

    it('renders submit button with correct default text', () => {
      setup()
      expect(screen.getByRole('button', { name: 'ورود' })).toBeInTheDocument()
    })

    it('does not show error banner when errorMessage is null', () => {
      setup()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('isSubmitting state', () => {
    it('disables the button when isSubmitting is true', () => {
      setup({ isSubmitting: true })
      expect(screen.getByRole('button', { name: 'در حال ورود...' })).toBeDisabled()
    })

    it('shows loading text when isSubmitting is true', () => {
      setup({ isSubmitting: true })
      expect(screen.getByRole('button', { name: 'در حال ورود...' })).toBeInTheDocument()
    })

    it('enables the button when isSubmitting is false', () => {
      setup({ isSubmitting: false })
      expect(screen.getByRole('button', { name: 'ورود' })).not.toBeDisabled()
    })
  })

  describe('error message banner', () => {
    it('displays errorMessage when provided', () => {
      setup({ errorMessage: 'نام کاربری یا رمز عبور اشتباه است' })
      expect(screen.getByText('نام کاربری یا رمز عبور اشتباه است')).toBeInTheDocument()
    })

    it('hides errorMessage when null', () => {
      setup({ errorMessage: null })
      expect(screen.queryByText(/نام کاربری یا رمز عبور/)).not.toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('shows validation errors when submitting empty form', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'ورود' }))
      await waitFor(() => {
        expect(screen.getByText('ایمیل یا نام کاربری الزامی است')).toBeInTheDocument()
        expect(screen.getByText('رمز عبور باید حداقل ۸ کاراکتر باشد')).toBeInTheDocument()
      })
      expect(defaultProps.onSubmit).not.toHaveBeenCalled()
    })

    it('shows login field error when login is empty', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'ورود' }))
      await waitFor(() => {
        expect(screen.getByText('ایمیل یا نام کاربری الزامی است')).toBeInTheDocument()
      })
    })

    it('shows password field error when password is empty', async () => {
      const { user } = setup()
      await user.type(screen.getByLabelText('ایمیل یا نام کاربری'), 'admin')
      await user.click(screen.getByRole('button', { name: 'ورود' }))
      await waitFor(() => {
        expect(screen.getByText('رمز عبور باید حداقل ۸ کاراکتر باشد')).toBeInTheDocument()
      })
    })
  })

  describe('password visibility toggle', () => {
    it('password field is hidden by default', () => {
      setup()
      expect(screen.getByLabelText('رمز عبور')).toHaveAttribute('type', 'password')
    })

    it('clicking eye button shows password', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'نمایش رمز عبور' }))
      expect(screen.getByLabelText('رمز عبور')).toHaveAttribute('type', 'text')
    })

    it('clicking eye button again hides password', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'نمایش رمز عبور' }))
      await user.click(screen.getByRole('button', { name: 'مخفی کردن رمز عبور' }))
      expect(screen.getByLabelText('رمز عبور')).toHaveAttribute('type', 'password')
    })
  })

  describe('successful submission', () => {
    it('calls onSubmit with correct values on valid input', async () => {
      const { user } = setup()
      await user.type(screen.getByLabelText('ایمیل یا نام کاربری'), 'admin@example.com')
      await user.type(screen.getByLabelText('رمز عبور'), 'secret123')
      await user.click(screen.getByRole('button', { name: 'ورود' }))
      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
          { login: 'admin@example.com', password: 'secret123' },
          expect.anything()
        )
      })
    })

    it('calls onSubmit exactly once per submit', async () => {
      const { user } = setup()
      await user.type(screen.getByLabelText('ایمیل یا نام کاربری'), 'admin')
      await user.type(screen.getByLabelText('رمز عبور'), 'pass1234')
      await user.click(screen.getByRole('button', { name: 'ورود' }))
      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1)
      })
    })
  })
})