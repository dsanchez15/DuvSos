import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toggle } from '@/components/ui/Toggle'

describe('Toggle', () => {
  it('renders as switch with aria-checked false', () => {
    render(<Toggle checked={false} onChange={() => {}} ariaLabel="Activar" />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('reflects checked state', () => {
    render(<Toggle checked={true} onChange={() => {}} ariaLabel="Activar" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onChange with the inverted value on click', () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} ariaLabel="Activar" />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('renders label text', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Mostrar sección" />)
    expect(screen.getByText('Mostrar sección')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is set', () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} disabled ariaLabel="Activar" />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toBeDisabled()
    fireEvent.click(toggle)
    expect(onChange).not.toHaveBeenCalled()
  })
})
