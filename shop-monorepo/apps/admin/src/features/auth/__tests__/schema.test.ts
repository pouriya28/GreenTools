import { describe, it, expect } from 'vitest'
import { loginSchema, totpSchema } from '../schema'

describe('loginSchema', () => {

  describe('login field', () => {
    it('accepts a valid email', () => {
      const result = loginSchema.safeParse({ login: 'admin@example.com', password: 'password123' })
      expect(result.success).toBe(true)
    })

    it('accepts a valid username', () => {
      const result = loginSchema.safeParse({ login: 'admin_user', password: 'password123' })
      expect(result.success).toBe(true)
    })

    it('rejects empty login', () => {
      const result = loginSchema.safeParse({ login: '', password: 'password123' })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('ایمیل یا نام کاربری الزامی است')
    })

    it('rejects missing login', () => {
      const result = loginSchema.safeParse({ password: 'password123' })
      expect(result.success).toBe(false)
    })
  })

  describe('password field', () => {
    it('accepts password with 8 characters', () => {
      const result = loginSchema.safeParse({ login: 'admin', password: '12345678' })
      expect(result.success).toBe(true)
    })

    it('rejects password shorter than 8 characters', () => {
      const result = loginSchema.safeParse({ login: 'admin', password: '1234567' })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('رمز عبور باید حداقل ۸ کاراکتر باشد')
    })

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({ login: 'admin', password: '' })
      expect(result.success).toBe(false)
    })
  })

})

describe('totpSchema', () => {

  it('accepts a valid 6-digit code', () => {
    const result = totpSchema.safeParse({ totp_code: '123456' })
    expect(result.success).toBe(true)
  })

  it('rejects code shorter than 6 digits', () => {
    const result = totpSchema.safeParse({ totp_code: '12345' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('کد باید ۶ رقم باشد')
  })

  it('rejects code longer than 6 digits', () => {
    const result = totpSchema.safeParse({ totp_code: '1234567' })
    expect(result.success).toBe(false)
  })

  it('rejects empty code', () => {
    const result = totpSchema.safeParse({ totp_code: '' })
    expect(result.success).toBe(false)
  })

  it('accepts numeric string code', () => {
    const result = totpSchema.safeParse({ totp_code: '000000' })
    expect(result.success).toBe(true)
  })

})