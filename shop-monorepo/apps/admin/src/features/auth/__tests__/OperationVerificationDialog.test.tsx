import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { OperationVerificationDialog } from '../components/OperationVerificationDialog'
import { useOperationVerificationStore } from '../store/operationVerificationStore'

vi.mock('../utils/operationVerificationBridge', () => ({
  resolveOperationVerification: vi.fn(),
}))

import { resolveOperationVerification } from '../utils/operationVerificationBridge'

// Set store state BEFORE render — avoids act() warnings
function setup(storeState: Partial<{
  isOpen: boolean
  isBusy: boolean
  errorMessage: string | null
}> = {}) {
  act(() => {
    useOperationVerificationStore.setState({
      isOpen: true,
      isBusy: false,
      errorMessage: null,
      ...storeState,
    })
  })
  const user = userEvent.setup()
  const result = render(<OperationVerificationDialog />)
  return { user, ...result }
}

beforeEach(() => {
  vi.clearAllMocks()
  act(() => {
    useOperationVerificationStore.setState({
      isOpen: false,
      isBusy: false,
      errorMessage: null,
    })
  })
})

describe('OperationVerificationDialog', () => {
  describe('visibility', () => {
    it('is not visible when store isOpen is false', () => {
      act(() => {
        useOperationVerificationStore.setState({ isOpen: false })
      })
      render(<OperationVerificationDialog />)
      expect(screen.queryByText('تایید رمز عملیاتی')).not.toBeInTheDocument()
    })

    it('is visible when store isOpen is true', () => {
      setup()
      expect(screen.getByText('تایید رمز عملیاتی')).toBeInTheDocument()
    })

    it('shows description text', () => {
      setup()
      expect(screen.getByText(/این عملیات حساس است/)).toBeInTheDocument()
    })
  })

  describe('password input', () => {
    it('renders password input', () => {
      setup()
      expect(screen.getByPlaceholderText('رمز عملیاتی')).toBeInTheDocument()
    })

    it('confirm button is disabled when password is empty', () => {
      setup()
      expect(screen.getByRole('button', { name: 'تایید' })).toBeDisabled()
    })

    it('confirm button is enabled after typing password', async () => {
      const { user } = setup()
      await user.type(screen.getByPlaceholderText('رمز عملیاتی'), 'mypassword')
      expect(screen.getByRole('button', { name: 'تایید' })).not.toBeDisabled()
    })
  })

  describe('cancel', () => {
    it('calls resolveOperationVerification(false) on cancel', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'انصراف' }))
      expect(resolveOperationVerification).toHaveBeenCalledWith(false)
    })

    it('cancel button is disabled when isBusy', () => {
      setup({ isBusy: true })
      expect(screen.getByRole('button', { name: 'انصراف' })).toBeDisabled()
    })
  })

  describe('confirm — success', () => {
    beforeEach(() => {
      server.use(
        http.post('*/auth/staff/operation-password/verify', () =>
          HttpResponse.json({ success: true, data: null, message: 'تایید شد', warnings: [], meta: { request_id: null, timestamp: '' } })
        )
      )
    })

    it('calls resolveOperationVerification(true) on successful verify', async () => {
      const { user } = setup()
      await user.type(screen.getByPlaceholderText('رمز عملیاتی'), 'correct-pass')
      await user.click(screen.getByRole('button', { name: 'تایید' }))
      await waitFor(() => {
        expect(resolveOperationVerification).toHaveBeenCalledWith(true)
      })
    })

    it('clears password after successful verify', async () => {
      const { user } = setup()
      await user.type(screen.getByPlaceholderText('رمز عملیاتی'), 'correct-pass')
      await user.click(screen.getByRole('button', { name: 'تایید' }))
      await waitFor(() => {
        expect(resolveOperationVerification).toHaveBeenCalledWith(true)
      })
      expect(screen.getByPlaceholderText('رمز عملیاتی')).toHaveValue('')
    })
  })

  describe('confirm — failure', () => {
    beforeEach(() => {
      server.use(
        http.post('*/auth/staff/operation-password/verify', () =>
          HttpResponse.json(
            { success: false, message: 'رمز عملیاتی نادرست است', code: 'INVALID_OPERATION_PASSWORD', data: null, meta: { request_id: null, timestamp: '' } },
            { status: 403 }
          )
        )
      )
    })

    it('shows error message on wrong password', async () => {
      const { user } = setup()
      await user.type(screen.getByPlaceholderText('رمز عملیاتی'), 'wrong-pass')
      await user.click(screen.getByRole('button', { name: 'تایید' }))
      await waitFor(() => {
        expect(screen.getByText(/رمز عملیاتی نادرست/)).toBeInTheDocument()
      })
    })

    it('does not call resolveOperationVerification on failure', async () => {
      const { user } = setup()
      await user.type(screen.getByPlaceholderText('رمز عملیاتی'), 'wrong-pass')
      await user.click(screen.getByRole('button', { name: 'تایید' }))
      await waitFor(() => {
        expect(screen.getByText(/رمز عملیاتی نادرست/)).toBeInTheDocument()
      })
      expect(resolveOperationVerification).not.toHaveBeenCalled()
    })
  })

  describe('Enter key', () => {
    beforeEach(() => {
      server.use(
        http.post('*/auth/staff/operation-password/verify', () =>
          HttpResponse.json({ success: true, data: null, message: 'تایید شد', warnings: [], meta: { request_id: null, timestamp: '' } })
        )
      )
    })

    it('submits on Enter key press', async () => {
      const { user } = setup()
      await user.type(screen.getByPlaceholderText('رمز عملیاتی'), 'correct-pass{Enter}')
      await waitFor(() => {
        expect(resolveOperationVerification).toHaveBeenCalledWith(true)
      })
    })
  })
})