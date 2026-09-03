import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui/Card'

describe('Card', () => {
  it('renders children with surface styles and default padding', () => {
    render(<Card>Contenido</Card>)
    const card = screen.getByText('Contenido')
    expect(card.className).toContain('bg-bg-surface')
    expect(card.className).toContain('rounded-[8px]')
    expect(card.className).toContain('p-4')
  })

  it('applies padding variants', () => {
    const { rerender } = render(<Card padding="none">C</Card>)
    expect(screen.getByText('C').className).not.toContain('p-4')

    rerender(<Card padding="sm">C</Card>)
    expect(screen.getByText('C').className).toContain('p-3')

    rerender(<Card padding="lg">C</Card>)
    expect(screen.getByText('C').className).toContain('p-5')
  })

  it('adds hover styles when hoverable', () => {
    render(<Card hoverable>C</Card>)
    expect(screen.getByText('C').className).toContain('hover:shadow-md')
  })
})
