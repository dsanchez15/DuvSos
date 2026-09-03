'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'

export type FeatureFlag = 'habits' | 'goals' | 'checklists' | 'reminders' | 'progress' | 'checkin' | 'study'

export type FeatureFlags = Record<FeatureFlag, boolean>

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  habits: true,
  goals: true,
  checklists: true,
  reminders: true,
  progress: true,
  checkin: true,
  study: true,
}

function mergeFlags(value: unknown): FeatureFlags {
  if (!value || typeof value !== 'object') return { ...DEFAULT_FEATURE_FLAGS }
  return { ...DEFAULT_FEATURE_FLAGS, ...(value as Partial<FeatureFlags>) }
}

function loadFeatureFlags(): Promise<FeatureFlags> {
  return apiClient
    .get<{ user: { featureFlags?: unknown } | null }>('/api/auth/me')
    .then((data) => mergeFlags(data?.user?.featureFlags))
    .catch((err) => {
      console.error('Failed to load feature flags', err)
      return { ...DEFAULT_FEATURE_FLAGS }
    })
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>({ ...DEFAULT_FEATURE_FLAGS })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const next = await loadFeatureFlags()
    setFlags(next)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    loadFeatureFlags().then((next) => {
      if (cancelled) return
      setFlags(next)
      setLoading(false)
    })

    const handleChange = () => {
      refresh()
    }
    window.addEventListener('featureflags-changed', handleChange)
    return () => {
      cancelled = true
      window.removeEventListener('featureflags-changed', handleChange)
    }
  }, [refresh])

  const setFlag = useCallback(async (key: FeatureFlag, value: boolean) => {
    const next = { ...flags, [key]: value }
    setFlags(next)
    try {
      await apiClient.patch('/api/auth/me', { featureFlags: next })
      window.dispatchEvent(new Event('featureflags-changed'))
    } catch (err) {
      console.error('Failed to save feature flags', err)
    }
  }, [flags])

  return { flags, setFlag, loading, refresh }
}
