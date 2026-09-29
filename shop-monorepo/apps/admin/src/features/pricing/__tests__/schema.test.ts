import { describe, it, expect } from 'vitest'
import {
  manualOverrideSchema,
  editProposalPriceSchema,
  exchangeRateScheduleSchema,
} from '../schema'

describe('manualOverrideSchema', () => {
  const valid = { rate: 65000, reason: 'نرخ جدید از منبع رسمی بانک مرکزی اخذ شد' }

  describe('valid inputs', () => {
    it('accepts valid rate and reason', () => {
      expect(manualOverrideSchema.safeParse(valid).success).toBe(true)
    })

    it('coerces rate from string to number', () => {
      const result = manualOverrideSchema.safeParse({ ...valid, rate: '65000' })
      expect(result.success).toBe(true)
      if (result.success) expect(typeof result.data.rate).toBe('number')
    })
  })

  describe('rate validation', () => {
    it('rejects empty string (coerces to 0, fails positive check)', () => {
      const result = manualOverrideSchema.safeParse({ ...valid, rate: '' })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('نرخ ارز باید عددی مثبت باشد')
    })

    it('rejects zero', () => {
      const result = manualOverrideSchema.safeParse({ ...valid, rate: 0 })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('نرخ ارز باید عددی مثبت باشد')
    })

    it('rejects negative number', () => {
      expect(manualOverrideSchema.safeParse({ ...valid, rate: -1 }).success).toBe(false)
    })

    it('accepts decimal rate', () => {
      expect(manualOverrideSchema.safeParse({ ...valid, rate: 65000.5 }).success).toBe(true)
    })
  })

  describe('reason validation', () => {
    it('rejects reason shorter than 10 chars', () => {
      const result = manualOverrideSchema.safeParse({ ...valid, reason: 'کوتاه' })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('۱۰ کاراکتر')
    })

    it('rejects reason longer than 500 chars', () => {
      expect(manualOverrideSchema.safeParse({ ...valid, reason: 'ب'.repeat(501) }).success).toBe(false)
    })

    it('accepts reason exactly 10 chars', () => {
      expect(manualOverrideSchema.safeParse({ ...valid, reason: 'ب'.repeat(10) }).success).toBe(true)
    })

    it('accepts reason exactly 500 chars', () => {
      expect(manualOverrideSchema.safeParse({ ...valid, reason: 'ب'.repeat(500) }).success).toBe(true)
    })
  })
})

describe('editProposalPriceSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid integer price', () => {
      expect(editProposalPriceSchema.safeParse({ edited_price_toman: 1200000 }).success).toBe(true)
    })

    it('accepts minimum price of 1', () => {
      expect(editProposalPriceSchema.safeParse({ edited_price_toman: 1 }).success).toBe(true)
    })

    it('accepts maximum price', () => {
      expect(editProposalPriceSchema.safeParse({ edited_price_toman: 99999999999 }).success).toBe(true)
    })
  })

  describe('invalid inputs', () => {
    it('rejects zero', () => {
      expect(editProposalPriceSchema.safeParse({ edited_price_toman: 0 }).success).toBe(false)
    })

    it('rejects negative number', () => {
      expect(editProposalPriceSchema.safeParse({ edited_price_toman: -1 }).success).toBe(false)
    })

    it('rejects decimal (must be integer)', () => {
      const result = editProposalPriceSchema.safeParse({ edited_price_toman: 1200000.5 })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('صحیح')
    })

    it('rejects above maximum', () => {
      expect(editProposalPriceSchema.safeParse({ edited_price_toman: 100000000000 }).success).toBe(false)
    })

    it('rejects string', () => {
      expect(editProposalPriceSchema.safeParse({ edited_price_toman: '1200000' }).success).toBe(false)
    })
  })
})

describe('exchangeRateScheduleSchema', () => {
  const validDaily = { frequency: 'daily' as const, run_time: '08:30', is_active: true }
  const validWeekly = { ...validDaily, frequency: 'weekly' as const, days_of_week: [1, 3] }
  const validMonthly = { ...validDaily, frequency: 'monthly' as const, days_of_month: [1, 15] }

  describe('valid inputs', () => {
    it('accepts valid daily schedule', () => {
      expect(exchangeRateScheduleSchema.safeParse(validDaily).success).toBe(true)
    })

    it('accepts valid weekly schedule with days', () => {
      expect(exchangeRateScheduleSchema.safeParse(validWeekly).success).toBe(true)
    })

    it('accepts valid monthly schedule with days', () => {
      expect(exchangeRateScheduleSchema.safeParse(validMonthly).success).toBe(true)
    })

    it('defaults is_active to true when omitted', () => {
      const result = exchangeRateScheduleSchema.safeParse({ frequency: 'daily', run_time: '09:00' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.is_active).toBe(true)
    })
  })

  describe('run_time validation', () => {
    it('accepts valid HH:mm format', () => {
      expect(exchangeRateScheduleSchema.safeParse({ ...validDaily, run_time: '23:59' }).success).toBe(true)
      expect(exchangeRateScheduleSchema.safeParse({ ...validDaily, run_time: '00:00' }).success).toBe(true)
    })

    it('rejects 24:00', () => {
      expect(exchangeRateScheduleSchema.safeParse({ ...validDaily, run_time: '24:00' }).success).toBe(false)
    })

    it('rejects invalid format', () => {
      expect(exchangeRateScheduleSchema.safeParse({ ...validDaily, run_time: '8:30' }).success).toBe(false)
      expect(exchangeRateScheduleSchema.safeParse({ ...validDaily, run_time: '08:60' }).success).toBe(false)
      expect(exchangeRateScheduleSchema.safeParse({ ...validDaily, run_time: 'abc' }).success).toBe(false)
    })
  })

  describe('frequency validation', () => {
    it('rejects unknown frequency', () => {
      expect(exchangeRateScheduleSchema.safeParse({ ...validDaily, frequency: 'hourly' }).success).toBe(false)
    })
  })

  describe('conditional days_of_week (weekly)', () => {
    it('rejects weekly without days_of_week', () => {
      const result = exchangeRateScheduleSchema.safeParse({ ...validDaily, frequency: 'weekly' })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('days_of_week')
      expect(result.error?.issues[0].message).toContain('هفتگی')
    })

    it('rejects weekly with empty days_of_week', () => {
      const result = exchangeRateScheduleSchema.safeParse({
        ...validDaily, frequency: 'weekly', days_of_week: [],
      })
      expect(result.success).toBe(false)
    })

    it('rejects day_of_week outside 0-6', () => {
      expect(exchangeRateScheduleSchema.safeParse({ ...validWeekly, days_of_week: [7] }).success).toBe(false)
      expect(exchangeRateScheduleSchema.safeParse({ ...validWeekly, days_of_week: [-1] }).success).toBe(false)
    })
  })

  describe('conditional days_of_month (monthly)', () => {
    it('rejects monthly without days_of_month', () => {
      const result = exchangeRateScheduleSchema.safeParse({ ...validDaily, frequency: 'monthly' })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('days_of_month')
      expect(result.error?.issues[0].message).toContain('ماهانه')
    })

    it('rejects day_of_month outside 1-31', () => {
      expect(exchangeRateScheduleSchema.safeParse({ ...validMonthly, days_of_month: [0] }).success).toBe(false)
      expect(exchangeRateScheduleSchema.safeParse({ ...validMonthly, days_of_month: [32] }).success).toBe(false)
    })

    it('daily schedule does not require days_of_month', () => {
      expect(exchangeRateScheduleSchema.safeParse(validDaily).success).toBe(true)
    })
  })
})