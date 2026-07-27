'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
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

/**
 * Loads all dashboard data and exposes the quick actions that mutate it.
 * Calendar/workload data refetches when year/month change.
 */
export function useDashboardData(year: number, month: number) {
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
    try {
      setHabits(await apiClient.get<HabitTracker[]>(`/api/dashboard/critical-habits?date=${today}`))
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchChecklistsAndTodos = useCallback(async () => {
    try {
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
      setChecklists(sortByPriority(items))
    } catch (err) {
      console.error(err)
    }

    try {
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
      setTodos(sortByPriority(activeTodos))
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchUpcomingReminders = useCallback(async () => {
    try {
      setUpcomingReminders(await apiClient.get<UpcomingReminder[]>('/api/dashboard/upcoming-reminders'))
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchCalendar = useCallback(async () => {
    setLoading(true)
    const monthStr = String(month).padStart(2, '0')
    const lastDay = new Date(year, month, 0).getDate()
    try {
      const calData = await apiClient.get<Record<string, DayData>>(
        `/api/dashboard/calendar?year=${year}&month=${month}`
      )
      setCalendarData(calData)
    } catch (err) {
      console.error(err)
    }
    try {
      const wlData = await apiClient.get<Record<string, WorkloadDay>>(
        `/api/dashboard/workload?start=${year}-${monthStr}-01&end=${year}-${monthStr}-${lastDay}`
      )
      setWorkloadData(wlData)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [year, month])

  const fetchAnalytics = useCallback(async () => {
    try {
      setMetrics(await apiClient.get<DashboardMetrics>('/api/dashboard/metrics'))
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchPerformanceStats = useCallback(async () => {
    try {
      setPerformanceStats(await apiClient.get<PerformanceStats>('/api/stats'))
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    fetchHabits()
    fetchChecklistsAndTodos()
    fetchUpcomingReminders()
    fetchCalendar()
    fetchAnalytics()
    fetchPerformanceStats()
  }, [fetchHabits, fetchChecklistsAndTodos, fetchUpcomingReminders, fetchCalendar, fetchAnalytics, fetchPerformanceStats])

  // ─── Actions ───

  const markHabitDone = useCallback(async (id: number) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      await apiClient.post(`/api/habits/${id}/completions`, { date: today })
      setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, completedToday: true } : h)))
      fetchAnalytics()
    } catch (err) {
      console.error(err)
    }
  }, [fetchAnalytics])

  const markTodoDone = useCallback(async (id: number) => {
    try {
      await apiClient.patch(`/api/todos/${id}`, { completed: true })
      setTodos((prev) => prev.filter((t) => t.id !== id))
      fetchAnalytics()
    } catch (err) {
      console.error(err)
    }
  }, [fetchAnalytics])

  const markChecklistItemDone = useCallback(async (checklistId: number, itemId: number) => {
    try {
      await apiClient.put(`/api/checklists/${checklistId}/items/${itemId}`, { completed: true })
      setChecklists((prev) => prev.filter((i) => i.id !== itemId))
      fetchAnalytics()
    } catch (err) {
      console.error(err)
    }
  }, [fetchAnalytics])

  const markReminderDone = useCallback(async (id: number) => {
    try {
      await apiClient.patch(`/api/reminders/${id}`, { completed: true })
      setUpcomingReminders((prev) => prev.filter((r) => r.id !== id && !String(r.id).startsWith(`${id}-`)))
      fetchCalendar()
      fetchAnalytics()
    } catch (err) {
      console.error(err)
    }
  }, [fetchCalendar, fetchAnalytics])

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
    fetchCalendar,
    fetchPerformanceStats,
    markHabitDone,
    markTodoDone,
    markChecklistItemDone,
    markReminderDone,
  }
}
