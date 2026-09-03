import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'

describe('Input', () => {
  it('renders with Aure field classes', () => {
    render(<Input placeholder="Nombre" />)
    const input = screen.getByPlaceholderText('Nombre')
    expect(input.className).toContain('bg-bg-input')
    expect(input.className).toContain('rounded-[8px]')
  })

  it('associates label with input via htmlFor', () => {
    render(<Input label="Título" />)
    const input = screen.getByLabelText('Título')
    expect(input).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Input label="Título" error="Requerido" />)
    expect(screen.getByText('Requerido')).toBeInTheDocument()
  })

  it('handles onChange', () => {
    const onChange = vi.fn()
    render(<Input onChange={onChange} aria-label="campo" />)
    fireEvent.change(screen.getByLabelText('campo'), { target: { value: 'abc' } })
    expect(onChange).toHaveBeenCalled()
  })
})

describe('Select', () => {
  it('renders options and associates label', () => {
    render(
      <Select label="Prioridad">
        <option value="low">Baja</option>
        <option value="high">Alta</option>
      </Select>
    )
    const select = screen.getByLabelText('Prioridad')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('Baja')).toBeInTheDocument()
  })

  it('handles onChange', () => {
    const onChange = vi.fn()
    render(
      <Select aria-label="sel" onChange={onChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    )
    fireEvent.change(screen.getByLabelText('sel'), { target: { value: 'b' } })
    expect(onChange).toHaveBeenCalled()
  })
})

describe('Textarea', () => {
  it('renders with label and rows', () => {
    render(<Textarea label="Notas" rows={5} />)
    const textarea = screen.getByLabelText('Notas')
    expect(textarea).toHaveAttribute('rows', '5')
  })
})
