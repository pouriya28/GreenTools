import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import { NumericInput } from '../components/shared/NumericInput'

describe('NumericInput', () => {
  it('renders input with type="number"', () => {
    render(<NumericInput />)
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
  })

  it('blurs input on wheel event to prevent accidental value change', async () => {
    render(<NumericInput />)
    const input = screen.getByRole('spinbutton')
    const blurSpy = vi.spyOn(input, 'blur')
    input.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))
    expect(blurSpy).toHaveBeenCalled()
  })

  it('calls custom onWheel handler if provided', () => {
    const onWheel = vi.fn()
    render(<NumericInput onWheel={onWheel} />)
    const input = screen.getByRole('spinbutton')
    input.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))
    expect(onWheel).toHaveBeenCalled()
  })

  it('forwards ref to input element', () => {
    const ref = vi.fn()
    render(<NumericInput ref={ref} />)
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement))
  })

  it('passes additional props to input', () => {
    render(<NumericInput min={0} max={999} step="0.0001" aria-label="نرخ ارز" />)
    const input = screen.getByRole('spinbutton', { name: 'نرخ ارز' })
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '999')
    expect(input).toHaveAttribute('step', '0.0001')
  })
})