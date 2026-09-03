'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { DailyProgress, WeeklyCheckIn, Goal, Phase } from '@/types/goal'

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function useProgressData() {
  const [entries, setEntries] = useState<DailyProgress[]>([])
  const [checkins, setCheckins] = useState<WeeklyCheckIn[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(() => getMonday(new Date()))

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const end = new Date(currentWeek)
      end.setDate(end.getDate() + 6)

      const startStr = currentWeek.toISOString().split('T')[0]
      const endStr = end.toISOString().split('T')[0]

      const [entriesData, goalsData, phasesData, checkinsData] = await Promise.all([
        apiClient
          .get<{ entries: DailyProgress[] }>(`/api/progress/daily?startDate=${startStr}&endDate=${endStr}`)
          .catch(() => null),
        apiClient.get<{ goals: Goal[] }>('/api/goals?status=ACTIVE,PENDING').catch(() => null),
        apiClient.get<{ phases: Phase[] }>('/api/phases').catch(() => null),
        apiClient.get<{ checkins: WeeklyCheckIn[] }>('/api/checkin').catch(() => null),
      ])

      if (entriesData) setEntries(entriesData.entries)
      if (goalsData) setGoals(goalsData.goals)
      if (phasesData) setPhases(phasesData.phases)
      if (checkinsData) setCheckins(checkinsData.checkins)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentWeek])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const prevWeek = useCallback(() => {
    setCurrentWeek((week) => {
      const d = new Date(week)
      d.setDate(d.getDate() - 7)
      return d
    })
  }, [])

  const nextWeek = useCallback(() => {
    setCurrentWeek((week) => {
      const d = new Date(week)
      d.setDate(d.getDate() + 7)
      return d
    })
  }, [])

  return {
    entries,
    checkins,
    goals,
    phases,
    loading,
    currentWeek,
    prevWeek,
    nextWeek,
    refetch: fetchEntries,
  }
}
