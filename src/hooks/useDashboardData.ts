'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { FeatureFlags } from '@/hooks/useFeatureFlags'
import {
  MODULE_COLORS,
  sortByPriority,
  type HabitTracker,
  type DashboardChecklistItem,
  type DashboardTodo,
  type UpcomingReminder,
  type DayData,
  type WorkloadDay,
  type DashboardMetrics,
  type PerformanceStats,
} from '@/types/dashboard'

interface RawChecklist {
  id: number
  title: string
  color?: string
  items?: { id: number; title: string; completed: boolean; priority?: string }[]
}

interface DashboardDataOptions {
  year: number
  month: number
  flags: FeatureFlags
}

/**
 * Loads all dashboard data and exposes the quick actions that mutate it.
 * Calendar/workload data refetches when year/month change.
 */
export function useDashboardData({ year, month, flags }: DashboardDataOptions) {
  const [habits, setHabits] = useState<HabitTracker[]>([])
  const [checklists, setChecklists] = useState<DashboardChecklistItem[]>([])
  const [todos, setTodos] = useState<DashboardTodo[]>([])
  const [upcomingReminders, setUpcomingReminders] = useState<UpcomingReminder[]>([])
  const [calendarData, setCalendarData] = useState<Record<string, DayData>>({})
  const [workloadData, setWorkloadData] = useState<Record<string, WorkloadDay>>({})
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchHabits = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    return apiClient.get<HabitTracker[]>(`/api/dashboard/critical-habits?date=${today}`)
  }, [])

  const fetchChecklists = useCallback(async () => {
    const rawChecklists = await apiClient.get<RawChecklist[]>('/api/checklists')
    const items: DashboardChecklistItem[] = []
    for (const cl of rawChecklists) {
      if (cl.items && Array.isArray(cl.items)) {
        for (const item of cl.items) {
          if (!item.completed) {
            items.push({
              id: item.id,
              title: item.title,
              completed: item.completed,
              priority: item.priority || 'normal',
              checklistId: cl.id,
              checklistTitle: cl.title,
              checklistColor: cl.color || MODULE_COLORS.checklist,
            })
          }
        }
      }
    }
    return sortByPriority(items)
  }, [])

  const fetchTodos = useCallback(async () => {
    const rawTodos = await apiClient.get<DashboardTodo[]>('/api/todos')
    const activeTodos = (rawTodos || [])
      .filter((t) => !t.completed)
      .map((t) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        priority: t.priority || 'normal',
        dueDate: t.dueDate,
        category: t.category,
      }))
    return sortByPriority(activeTodos)
  }, [])

  const fetchUpcomingReminders = useCallback(async () => {
    return apiClient.get<UpcomingReminder[]>('/api/dashboard/upcoming-reminders')
  }, [])

  const fetchCalendarData = useCallback(async () => {
    setLoading(true)
    const data = await apiClient.get<Record<string, DayData>>(
      `/api/dashboard/calendar?year=${year}&month=${month}`
    )
    setLoading(false)
    return data
  }, [year, month])

  const fetchWorkloadData = useCallback(async () => {
    const monthStr = String(month).padStart(2, '0')
    const lastDay = new Date(year, month, 0).getDate()
    return apiClient.get<Record<string, WorkloadDay>>(
      `/api/dashboard/workload?start=${year}-${monthStr}-01&end=${year}-${monthStr}-${lastDay}`
    )
  }, [year, month])

  const fetchAnalytics = useCallback(async () => {
    return apiClient.get<DashboardMetrics>('/api/dashboard/metrics')
  }, [])

  const fetchPerformanceStats = useCallback(async () => {
    return apiClient.get<PerformanceStats>('/api/stats')
  }, [])

  useEffect(() => {
    if (flags.habits) {
      fetchHabits().then(setHabits).catch((err) => console.error(err))
    }
    if (flags.checklists) {
      fetchChecklists().then(setChecklists).catch((err) => console.error(err))
    }
    fetchTodos().then(setTodos).catch((err) => console.error(err))
    if (flags.reminders) {
      fetchUpcomingReminders().then(setUpcomingReminders).catch((err) => console.error(err))
    }
    fetchCalendarData().then(setCalendarData).catch((err) => console.error(err))
    fetchWorkloadData().then(setWorkloadData).catch((err) => console.error(err))
    fetchAnalytics().then(setMetrics).catch((err) => console.error(err))
    if (flags.goals) {
      fetchPerformanceStats().then(setPerformanceStats).catch((err) => console.error(err))
    }
  }, [
    flags,
    fetchHabits,
    fetchChecklists,
    fetchTodos,
    fetchUpcomingReminders,
    fetchCalendarData,
    fetchWorkloadData,
    fetchAnalytics,
    fetchPerformanceStats,
  ])

  // ─── Actions ───

  const markHabitDone = useCallback(async (id: number) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      await apiClient.post(`/api/habits/${id}/completions`, { date: today })
      setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, completedToday: true } : h)))
      fetchAnalytics().then(setMetrics).catch((err) => console.error(err))
    } catch (err) {
      console.error(err)
    }
  }, [fetchAnalytics])

  const markTodoDone = useCallback(async (id: number) => {
    try {
      await apiClient.patch(`/api/todos/${id}`, { completed: true })
      setTodos((prev) => prev.filter((t) => t.id !== id))
      fetchAnalytics().then(setMetrics).catch((err) => console.error(err))
    } catch (err) {
      console.error(err)
    }
  }, [fetchAnalytics])

  const markChecklistItemDone = useCallback(async (checklistId: number, itemId: number) => {
    try {
      await apiClient.put(`/api/checklists/${checklistId}/items/${itemId}`, { completed: true })
      setChecklists((prev) => prev.filter((i) => i.id !== itemId))
      fetchAnalytics().then(setMetrics).catch((err) => console.error(err))
    } catch (err) {
      console.error(err)
    }
  }, [fetchAnalytics])

  const markReminderDone = useCallback(async (id: number) => {
    try {
      await apiClient.patch(`/api/reminders/${id}`, { completed: true })
      setUpcomingReminders((prev) => prev.filter((r) => r.id !== id && !String(r.id).startsWith(`${id}-`)))
      fetchCalendarData().then(setCalendarData).catch((err) => console.error(err))
      fetchWorkloadData().then(setWorkloadData).catch((err) => console.error(err))
      fetchAnalytics().then(setMetrics).catch((err) => console.error(err))
    } catch (err) {
      console.error(err)
    }
  }, [fetchCalendarData, fetchWorkloadData, fetchAnalytics])

  return {
    habits,
    checklists,
    todos,
    upcomingReminders,
    calendarData,
    workloadData,
    metrics,
    performanceStats,
    loading,
    fetchCalendar: fetchCalendarData,
    fetchPerformanceStats,
    markHabitDone,
    markTodoDone,
    markChecklistItemDone,
    markReminderDone,
  }
}
