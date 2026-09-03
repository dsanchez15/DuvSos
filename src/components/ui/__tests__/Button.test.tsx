import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children and defaults to primary md', () => {
    render(<Button>Guardar</Button>)
    const btn = screen.getByRole('button', { name: 'Guardar' })
    expect(btn.className).toContain('bg-primary')
    expect(btn.className).toContain('px-4')
    expect(btn).toHaveAttribute('type', 'button')
  })

  it('applies variant classes', () => {
    const { rerender } = render(<Button variant="danger">Eliminar</Button>)
    expect(screen.getByRole('button').className).toContain('bg-danger')

    rerender(<Button variant="secondary">Cancelar</Button>)
    expect(screen.getByRole('button').className).toContain('bg-bg-surface-hover')

    rerender(<Button variant="ghost">Ver</Button>)
    expect(screen.getByRole('button').className).toContain('text-text-secondary')
  })

  it('applies size classes', () => {
    const { rerender } = render(<Button size="sm">S</Button>)
    expect(screen.getByRole('button').className).toContain('px-3')

    rerender(<Button size="lg">L</Button>)
    expect(screen.getByRole('button').className).toContain('px-6')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabled>Click</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies full width', () => {
    render(<Button fullWidth>Ancho</Button>)
    expect(screen.getByRole('button').className).toContain('w-full')
  })

  it('merges custom className', () => {
    render(<Button className="mt-4">Custom</Button>)
    expect(screen.getByRole('button').className).toContain('mt-4')
  })
})
