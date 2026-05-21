import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useClickOutside } from '@/hooks/useClickOutside'

describe('useClickOutside', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('does not call handler when enabled is false', () => {
    const handler = vi.fn()
    renderHook(() => useClickOutside({ current: container }, handler, false))

    document.dispatchEvent(new MouseEvent('mousedown'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls handler when clicking outside the element', () => {
    const handler = vi.fn()
    renderHook(() => useClickOutside({ current: container }, handler, true))

    document.dispatchEvent(new MouseEvent('mousedown'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('does not call handler when clicking inside the element', () => {
    const handler = vi.fn()
    renderHook(() => useClickOutside({ current: container }, handler, true))

    container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(handler).not.toHaveBeenCalled()
  })

  it('does nothing when ref is null', () => {
    const handler = vi.fn()
    renderHook(() => useClickOutside({ current: null }, handler, true))

    document.dispatchEvent(new MouseEvent('mousedown'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('cleans up event listener on unmount', () => {
    const handler = vi.fn()
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => useClickOutside({ current: container }, handler, true))
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
    removeSpy.mockRestore()
  })

  it('updates handler when callback changes', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    const { rerender } = renderHook(
      ({ handler }) => useClickOutside({ current: container }, handler, true),
      { initialProps: { handler: handler1 } }
    )
    rerender({ handler: handler2 })

    document.dispatchEvent(new MouseEvent('mousedown'))
    expect(handler2).toHaveBeenCalled()
  })
})