import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'

describe('useLocalStorageState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default value when no stored value exists', () => {
    const { result } = renderHook(() => useLocalStorageState('test-key', false))
    expect(result.current[0]).toBe(false)
  })

  it('returns default value for different types', () => {
    const { result: numResult } = renderHook(() => useLocalStorageState('num', 42))
    expect(numResult.current[0]).toBe(42)

    const { result: strResult } = renderHook(() => useLocalStorageState('str', 'hello'))
    expect(strResult.current[0]).toBe('hello')
  })

  it('stores and retrieves boolean values', () => {
    const { result } = renderHook(() => useLocalStorageState('bool-key', false))
    act(() => result.current[1](true))
    expect(result.current[0]).toBe(true)

    const stored = JSON.parse(localStorage.getItem('bool-key')!)
    expect(stored).toBe(true)
  })

  it('updates state with function updater', () => {
    const { result } = renderHook(() => useLocalStorageState('counter', 0))
    act(() => result.current[1](prev => prev + 1))
    expect(result.current[0]).toBe(1)
  })

  it('replaces state with direct value', () => {
    const { result } = renderHook(() => useLocalStorageState('direct', 'a'))
    act(() => result.current[1]('b'))
    expect(result.current[0]).toBe('b')
  })

  it('persists to localStorage on change', () => {
    const { result } = renderHook(() => useLocalStorageState('persist', 'initial'))
    act(() => result.current[1]('updated'))
    expect(JSON.parse(localStorage.getItem('persist')!)).toBe('updated')
  })

  it('handles localStorage read errors gracefully', () => {
    localStorage.setItem('broken', '{invalid json}')
    const { result } = renderHook(() => useLocalStorageState('broken', 'fallback'))
    expect(result.current[0]).toBe('fallback')
  })

  it('handles localStorage write errors gracefully', () => {
    const original = localStorage.setItem
    localStorage.setItem = vi.fn(() => { throw new Error('quota') })
    const { result } = renderHook(() => useLocalStorageState('quota', 'ok'))
    act(() => result.current[1]('new'))
    expect(result.current[0]).toBe('new')
    localStorage.setItem = original
  })

  it('syncs state across tabs via storage event', () => {
    const { result } = renderHook(() => useLocalStorageState('sync', 'initial'))
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'sync',
        newValue: JSON.stringify('from-another-tab'),
      }))
    })
    expect(result.current[0]).toBe('from-another-tab')
  })

  it('ignores storage events for different keys', () => {
    const { result } = renderHook(() => useLocalStorageState('key-a', 'val-a'))
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'key-b',
        newValue: JSON.stringify('val-b'),
      }))
    })
    expect(result.current[0]).toBe('val-a')
  })

  it('ignores storage events with null newValue', () => {
    const { result } = renderHook(() => useLocalStorageState('null-test', 'original'))
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'null-test',
        newValue: null,
      }))
    })
    expect(result.current[0]).toBe('original')
  })
})