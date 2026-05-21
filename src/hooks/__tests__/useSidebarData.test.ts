import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockUser = { user: { name: 'Test', email: 'test@test.com', checklistAlertDays: 3 } }
const mockChecklists = [
  { id: 1, endDate: new Date(Date.now() + 86400000).toISOString() },
  { id: 2, endDate: null },
  { id: 3, endDate: new Date(Date.now() - 86400000 * 10).toISOString() },
]

function createFetchMock(responses: Record<string, unknown>) {
  return vi.fn((url: string) => {
    const data = responses[url]
    return Promise.resolve({
      ok: data !== null && data !== undefined,
      json: () => Promise.resolve(data),
    })
  })
}

describe('useSidebarData', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
    vi.resetModules()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('returns loading state initially when no cache', async () => {
    global.fetch = createFetchMock({})
    const { useSidebarData } = await import('@/hooks/useSidebarData')
    const { result } = renderHook(() => useSidebarData())
    expect(result.current.isLoading).toBe(true)
  })

  it('fetches and returns user data', async () => {
    global.fetch = createFetchMock({
      '/api/auth/me': mockUser,
      '/api/checklists': mockChecklists,
    })

    const { useSidebarData } = await import('@/hooks/useSidebarData')
    const { result } = renderHook(() => useSidebarData())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(result.current.user?.name).toBe('Test')
    expect(result.current.isLoading).toBe(false)
  })

  it('calculates expiring count from checklists', async () => {
    const expiringChecklist = {
      id: 99,
      endDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    }
    const futureChecklist = {
      id: 100,
      endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    }
    global.fetch = createFetchMock({
      '/api/auth/me': mockUser,
      '/api/checklists': [expiringChecklist, futureChecklist],
    })

    const { useSidebarData } = await import('@/hooks/useSidebarData')
    const { result } = renderHook(() => useSidebarData())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(result.current.expiringCount).toBe(1)
  })

  it('returns null user when auth fetch fails', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url === '/api/auth/me') return Promise.resolve({ ok: false, json: () => Promise.resolve(null) })
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    const { useSidebarData } = await import('@/hooks/useSidebarData')
    const { result } = renderHook(() => useSidebarData())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('handles fetch errors gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

    const { useSidebarData } = await import('@/hooks/useSidebarData')
    const { result } = renderHook(() => useSidebarData())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(result.current.user).toBeNull()
    expect(result.current.expiringCount).toBe(0)
    expect(result.current.isLoading).toBe(false)
  })

  it('handles null user alert days with default of 3', async () => {
    const userNoDays = { user: { name: 'NoDays', email: 'n@test.com' } }
    const checklistExpiring = [{
      id: 1,
      endDate: new Date(Date.now() + 86400000).toISOString(),
    }]
    global.fetch = createFetchMock({
      '/api/auth/me': userNoDays,
      '/api/checklists': checklistExpiring,
    })

    const { useSidebarData } = await import('@/hooks/useSidebarData')
    const { result } = renderHook(() => useSidebarData())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(result.current.expiringCount).toBe(1)
  })

  it('skips expiring count when checklistAlertDays is 0', async () => {
    const userZeroDays = { user: { name: 'Zero', email: 'z@test.com', checklistAlertDays: 0 } }
    global.fetch = createFetchMock({
      '/api/auth/me': userZeroDays,
      '/api/checklists': [{ id: 1, endDate: new Date(Date.now() + 86400000).toISOString() }],
    })

    const { useSidebarData } = await import('@/hooks/useSidebarData')
    const { result } = renderHook(() => useSidebarData())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(result.current.expiringCount).toBe(0)
  })
})