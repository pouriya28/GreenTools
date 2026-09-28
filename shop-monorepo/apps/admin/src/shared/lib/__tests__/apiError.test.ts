import { describe, it, expect } from 'vitest'
import { AxiosError } from 'axios'
import { ApiError, getApiErrorMessage, applyValidationErrors } from '../apiError'

// Helper to create a fake AxiosError
function makeAxiosError(status: number, body: Record<string, unknown> = {}): AxiosError {
  const error = new AxiosError('Request failed')
  error.response = {
    status,
    data: body,
    headers: {},
    config: {} as never,
    statusText: String(status),
  }
  return error
}

describe('ApiError', () => {

  describe('from AxiosError with response', () => {
    it('parses status correctly', () => {
      const err = new ApiError(makeAxiosError(422))
      expect(err.status).toBe(422)
    })

    it('parses code from response body', () => {
      const err = new ApiError(makeAxiosError(403, { code: 'FORBIDDEN' }))
      expect(err.code).toBe('FORBIDDEN')
    })

    it('falls back to HTTP_{status} when code is missing', () => {
      const err = new ApiError(makeAxiosError(500, {}))
      expect(err.code).toBe('HTTP_500')
    })

    it('parses message from response body', () => {
      const err = new ApiError(makeAxiosError(422, { message: 'اطلاعات نامعتبر است' }))
      expect(err.message).toBe('اطلاعات نامعتبر است')
    })

    it('uses fallback message when body has no message', () => {
      const err = new ApiError(makeAxiosError(500, {}), 'خطای سرور')
      expect(err.message).toBe('خطای سرور')
    })

    it('parses validation errors', () => {
      const err = new ApiError(makeAxiosError(422, {
        errors: { email: ['ایمیل نامعتبر است'] }
      }))
      expect(err.errors).toEqual({ email: ['ایمیل نامعتبر است'] })
    })

    it('defaults errors to empty object when missing', () => {
      const err = new ApiError(makeAxiosError(500, {}))
      expect(err.errors).toEqual({})
    })

    it('parses retryAfter from meta', () => {
      const err = new ApiError(makeAxiosError(429, {
        meta: { retry_after: 60 }
      }))
      expect(err.retryAfter).toBe(60)
    })

    it('retryAfter is null when missing', () => {
      const err = new ApiError(makeAxiosError(429, {}))
      expect(err.retryAfter).toBeNull()
    })
  })

  describe('from network error (no response)', () => {
    it('sets status to 0', () => {
      const err = new ApiError(new AxiosError('Network Error'))
      expect(err.status).toBe(0)
    })

    it('sets code to NETWORK_ERROR', () => {
      const err = new ApiError(new AxiosError('Network Error'))
      expect(err.code).toBe('NETWORK_ERROR')
    })

    it('sets network error message', () => {
      const err = new ApiError(new AxiosError('Network Error'))
      expect(err.message).toBe('ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.')
    })
  })

  describe('from unknown error', () => {
    it('handles plain Error object', () => {
      const err = new ApiError(new Error('something'))
      expect(err.status).toBe(0)
      expect(err.code).toBe('NETWORK_ERROR')
    })

    it('handles null', () => {
      const err = new ApiError(null)
      expect(err.status).toBe(0)
    })

    it('handles string', () => {
      const err = new ApiError('something went wrong')
      expect(err.status).toBe(0)
    })
  })

  describe('computed getters', () => {
    it('isValidation is true for 422', () => {
      expect(new ApiError(makeAxiosError(422)).isValidation).toBe(true)
    })

    it('isValidation is false for 400', () => {
      expect(new ApiError(makeAxiosError(400)).isValidation).toBe(false)
    })

    it('isForbidden is true for 403', () => {
      expect(new ApiError(makeAxiosError(403)).isForbidden).toBe(true)
    })

    it('isRateLimited is true for 429', () => {
      expect(new ApiError(makeAxiosError(429)).isRateLimited).toBe(true)
    })

    it('isMaintenance is true for 503', () => {
      expect(new ApiError(makeAxiosError(503)).isMaintenance).toBe(true)
    })

    it('isNetwork is true for status 0', () => {
      expect(new ApiError(new AxiosError('Network Error')).isNetwork).toBe(true)
    })
  })

})

describe('applyValidationErrors', () => {

  it('returns false for non-422 errors', () => {
    const setError = vi.fn()
    const result = applyValidationErrors(makeAxiosError(500), setError)
    expect(result).toBe(false)
    expect(setError).not.toHaveBeenCalled()
  })

  it('returns false for 422 with no field errors', () => {
    const setError = vi.fn()
    const result = applyValidationErrors(
      makeAxiosError(422, { errors: {} }),
      setError
    )
    expect(result).toBe(false)
    expect(setError).not.toHaveBeenCalled()
  })

  it('calls setError for each field in errors', () => {
    const setError = vi.fn()
    applyValidationErrors(
      makeAxiosError(422, {
        errors: {
          email: ['ایمیل نامعتبر است'],
          password: ['رمز عبور کوتاه است'],
        }
      }),
      setError
    )
    expect(setError).toHaveBeenCalledTimes(2)
    expect(setError).toHaveBeenCalledWith('email', {
      type: 'server',
      message: 'ایمیل نامعتبر است',
    })
    expect(setError).toHaveBeenCalledWith('password', {
      type: 'server',
      message: 'رمز عبور کوتاه است',
    })
  })

  it('returns true when validation errors are applied', () => {
    const setError = vi.fn()
    const result = applyValidationErrors(
      makeAxiosError(422, { errors: { email: ['نامعتبر'] } }),
      setError
    )
    expect(result).toBe(true)
  })

})