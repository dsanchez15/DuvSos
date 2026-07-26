import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'

describe('Badge', () => {
  it('renders with neutral variant by default', () => {
    render(<Badge>Normal</Badge>)
    expect(screen.getByText('Normal').className).toContain('text-text-secondary')
  })

  it('applies variant classes', () => {
    const { rerender } = render(<Badge variant="primary">Alta</Badge>)
    expect(screen.getByText('Alta').className).toContain('text-primary')

    rerender(<Badge variant="success">Hecho</Badge>)
    expect(screen.getByText('Hecho').className).toContain('text-success')

    rerender(<Badge variant="danger">Error</Badge>)
    expect(screen.getByText('Error').className).toContain('text-danger')
  })
})

describe('EmptyState', () => {
  it('renders title, icon and description', () => {
    render(<EmptyState icon="inbox" title="Sin elementos" description="Crea uno nuevo" />)
    expect(screen.getByText('Sin elementos')).toBeInTheDocument()
    expect(screen.getByText('Crea uno nuevo')).toBeInTheDocument()
    expect(screen.getByText('inbox')).toBeInTheDocument()
  })

  it('renders action when provided', () => {
    render(<EmptyState title="Vacío" action={<button>Crear</button>} />)
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument()
  })

  it('hides icon when empty string', () => {
    const { container } = render(<EmptyState icon="" title="Vacío" />)
    expect(container.querySelector('.material-symbols-outlined')).not.toBeInTheDocument()
  })
})

describe('Spinner', () => {
  it('renders with status role and aria-label', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label')
  })

  it('applies size classes', () => {
    const { container, rerender } = render(<Spinner size="sm" />)
    expect(container.querySelector('.h-5')).toBeInTheDocument()

    rerender(<Spinner size="lg" />)
    expect(container.querySelector('.h-12')).toBeInTheDocument()
  })
})
