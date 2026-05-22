import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { SidebarProvider, useSidebar } from '@/components/SidebarContext'

function renderWithProvider() {
  return renderHook(() => useSidebar(), { wrapper: SidebarProvider })
}

describe('SidebarContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('innerWidth', 1280)
  })

  it('starts expanded on desktop by default', () => {
    const { result } = renderWithProvider()
    expect(result.current.isExpanded).toBe(true)
    expect(result.current.isCollapsed).toBe(false)
    expect(result.current.mode).toBe('expanded')
  })

  it('toggle collapses on desktop', () => {
    const { result } = renderWithProvider()
    act(() => result.current.toggle())
    expect(result.current.isCollapsed).toBe(true)
    expect(result.current.isExpanded).toBe(false)
  })

  it('toggle again expands on desktop', () => {
    const { result } = renderWithProvider()
    act(() => result.current.toggle())
    act(() => result.current.toggle())
    expect(result.current.isExpanded).toBe(true)
  })

  it('expand sets expanded mode on desktop', () => {
    const { result } = renderWithProvider()
    act(() => result.current.collapse())
    act(() => result.current.expand())
    expect(result.current.isExpanded).toBe(true)
  })

  it('collapse sets collapsed mode on desktop', () => {
    const { result } = renderWithProvider()
    act(() => result.current.collapse())
    expect(result.current.isCollapsed).toBe(true)
  })

  it('persists collapsed state to localStorage', () => {
    const { result } = renderWithProvider()
    act(() => result.current.toggle())
    const stored = JSON.parse(localStorage.getItem('sidebar-state')!)
    expect(stored.collapsed).toBe(true)
  })

  it('starts collapsed on mobile viewport', () => {
    vi.stubGlobal('innerWidth', 600)
    const { result } = renderWithProvider()
    expect(result.current.isCollapsed).toBe(true)
  })

  it('openMobileOverlay and closeMobileOverlay work on mobile', () => {
    vi.stubGlobal('innerWidth', 600)
    const { result } = renderWithProvider()
    act(() => result.current.openMobileOverlay())
    expect(result.current.isMobileOverlayOpen).toBe(true)
    expect(result.current.mode).toBe('mobile-overlay')

    act(() => result.current.closeMobileOverlay())
    expect(result.current.isMobileOverlayOpen).toBe(false)
  })

  it('toggle on mobile opens overlay', () => {
    vi.stubGlobal('innerWidth', 600)
    const { result } = renderWithProvider()
    act(() => result.current.toggle())
    expect(result.current.isMobileOverlayOpen).toBe(true)
  })

  it('openMobileOverlay does nothing on desktop', () => {
    vi.stubGlobal('innerWidth', 1280)
    const { result } = renderWithProvider()
    act(() => result.current.openMobileOverlay())
    expect(result.current.isMobileOverlayOpen).toBe(false)
  })

  it('throws when useSidebar is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useSidebar())).toThrow(
      'useSidebar must be used within a SidebarProvider'
    )
    consoleError.mockRestore()
  })
})