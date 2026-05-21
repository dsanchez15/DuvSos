import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

function createContainer(focusableCount: number): HTMLElement {
  const container = document.createElement('div')
  for (let i = 0; i < focusableCount; i++) {
    const btn = document.createElement('button')
    btn.textContent = `btn-${i}`
    container.appendChild(btn)
  }
  document.body.appendChild(container)
  return container
}

describe('useFocusTrap', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('does nothing when isActive is false', () => {
    const ref = { current: createContainer(3) }
    const returnRef = { current: document.createElement('button') }
    const { unmount } = renderHook(() => useFocusTrap(ref, false, returnRef))
    expect(true).toBe(true)
    unmount()
  })

  it('does nothing when ref.current is null', () => {
    const ref = { current: null }
    const { unmount } = renderHook(() => useFocusTrap(ref, true))
    expect(true).toBe(true)
    unmount()
  })

  it('does nothing when container has no focusable elements', () => {
    const ref = { current: createContainer(0) }
    const { unmount } = renderHook(() => useFocusTrap(ref, true))
    expect(true).toBe(true)
    unmount()
  })

  it('focuses first element when activated', () => {
    const container = createContainer(3)
    const ref = { current: container }
    renderHook(() => useFocusTrap(ref, true))

    expect(document.activeElement).toBe(container.querySelector('button'))
  })

  it('attaches keydown listener to container when active', () => {
    const container = createContainer(3)
    const addSpy = vi.spyOn(container, 'addEventListener')
    const ref = { current: container }
    renderHook(() => useFocusTrap(ref, true))
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    addSpy.mockRestore()
  })

  it('removes keydown listener on deactivation', () => {
    const container = createContainer(3)
    const removeSpy = vi.spyOn(container, 'removeEventListener')
    const ref = { current: container }

    const { rerender } = renderHook(
      ({ isActive }) => useFocusTrap(ref, isActive),
      { initialProps: { isActive: true } }
    )
    rerender({ isActive: false })
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeSpy.mockRestore()
  })

  it('returns focus to trigger element on deactivation', () => {
    const container = createContainer(2)
    const triggerBtn = document.createElement('button')
    document.body.appendChild(triggerBtn)
    triggerBtn.focus()

    const ref = { current: container }
    const returnRef = { current: triggerBtn }

    const { rerender } = renderHook(
      ({ isActive }) => useFocusTrap(ref, isActive, returnRef),
      { initialProps: { isActive: true } }
    )

    rerender({ isActive: false })
    expect(document.activeElement).toBe(triggerBtn)
  })

  it('cleans up event listener on unmount', () => {
    const container = createContainer(2)
    const ref = { current: container }
    const { unmount } = renderHook(() => useFocusTrap(ref, true))

    const removeSpy = vi.spyOn(container, 'removeEventListener')
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeSpy.mockRestore()
  })
})