import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '@/components/ui/Modal'

describe('Modal', () => {
  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Título">
        Contenido
      </Modal>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders with dialog ARIA attributes when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Editar">
        Contenido
      </Modal>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
    expect(screen.getByText('Editar')).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('closes on Escape key', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="T">
        C
      </Modal>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when clicking the overlay', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="T">
        C
      </Modal>
    )
    const overlay = screen.getByRole('dialog').parentElement!
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when clicking inside the panel', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="T">
        C
      </Modal>
    )
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not close on overlay click when closeOnOverlayClick is false', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="T" closeOnOverlayClick={false}>
        C
      </Modal>
    )
    const overlay = screen.getByRole('dialog').parentElement!
    fireEvent.click(overlay)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes via the close button', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="T">
        C
      </Modal>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders footer actions', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T" footer={<button>Guardar</button>}>
        C
      </Modal>
    )
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })
})
