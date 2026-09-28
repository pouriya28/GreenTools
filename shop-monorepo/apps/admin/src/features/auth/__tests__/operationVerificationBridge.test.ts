import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  waitForOperationVerification,
  resolveOperationVerification,
} from '../utils/operationVerificationBridge'

// vi.hoisted ensures these exist before vi.mock runs
const { mockOpen, mockClose } = vi.hoisted(() => ({
  mockOpen: vi.fn(),
  mockClose: vi.fn(),
}))

vi.mock('../store/operationVerificationStore', () => ({
  useOperationVerificationStore: {
    getState: () => ({ open: mockOpen, close: mockClose }),
  },
}))

beforeEach(() => {
    resolveOperationVerification(false)
    vi.clearAllMocks()
  // Reset module-level bridge state
  
})

describe('waitForOperationVerification', () => {
  it('opens the store modal on first call', () => {
    waitForOperationVerification()
    expect(mockOpen).toHaveBeenCalledTimes(1)
    resolveOperationVerification(false)
  })

  it('returns a Promise', () => {
    const result = waitForOperationVerification()
    expect(result).toBeInstanceOf(Promise)
    resolveOperationVerification(false)
  })

  it('does not open modal again when already awaiting', () => {
    waitForOperationVerification()
    waitForOperationVerification()
    waitForOperationVerification()
    expect(mockOpen).toHaveBeenCalledTimes(1)
    resolveOperationVerification(false)
  })

  it('resolves true when resolveOperationVerification(true) is called', async () => {
    const promise = waitForOperationVerification()
    resolveOperationVerification(true)
    await expect(promise).resolves.toBe(true)
  })

  it('resolves false when resolveOperationVerification(false) is called', async () => {
    const promise = waitForOperationVerification()
    resolveOperationVerification(false)
    await expect(promise).resolves.toBe(false)
  })

  it('all concurrent callers resolve with the same result', async () => {
    const p1 = waitForOperationVerification()
    const p2 = waitForOperationVerification()
    const p3 = waitForOperationVerification()
    resolveOperationVerification(true)
    const results = await Promise.all([p1, p2, p3])
    expect(results).toEqual([true, true, true])
  })
})

describe('resolveOperationVerification', () => {
  it('closes the store after resolving', () => {
    waitForOperationVerification()
    resolveOperationVerification(true)
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('allows a new modal cycle after resolving', () => {
    waitForOperationVerification()
    resolveOperationVerification(true)
    // New cycle
    waitForOperationVerification()
    expect(mockOpen).toHaveBeenCalledTimes(2)
    resolveOperationVerification(false)
  })
})