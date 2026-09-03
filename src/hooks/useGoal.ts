'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient, ApiError } from '@/lib/api-client'
import type { Goal, Phase } from '@/types/goal'

type TranslateFn = (key: string, params?: Record<string, string | number>) => string

export interface EditableMilestone {
  id?: string
  title: string
  targetDate: string
}

export interface GoalEditData {
  title: string
  description?: string | null
  category: Goal['category']
  priority: Goal['priority']
  deadline?: string | null
  estimatedHours?: number | null
  phaseId?: string | null
  milestones: EditableMilestone[]
}

export function useGoal(goalId: string, t: TranslateFn) {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [phases, setPhases] = useState<Phase[]>([])

  const tRef = useCallback((key: string) => t(key), [t])

  const fetchGoal = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.get<{ goal: Goal }>(`/api/goals/${goalId}`)
      setGoal(data.goal)
      setError('')
    } catch (err) {
      setError(tRef('goals.errors.loadGoal'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [goalId, tRef])

  useEffect(() => {
    fetchGoal()
    apiClient
      .get<{ phases: Phase[] }>('/api/phases')
      .then((d) => d?.phases && setPhases(d.phases))
      .catch(() => {})
  }, [fetchGoal])

  const toggleMilestone = useCallback(
    async (milestoneId: string, completed: boolean) => {
      if (!goal || goal.status !== 'ACTIVE') return

      const updatedMilestones =
        goal.milestones?.map((m) => (m.id === milestoneId ? { ...m, completed } : m)) || []

      setGoal({ ...goal, milestones: updatedMilestones })

      try {
        await apiClient.patch(`/api/goals/${goalId}`, { milestones: updatedMilestones })
      } catch (err) {
        console.error(err)
      }
    },
    [goal, goalId]
  )

  const changeStatus = useCallback(
    async (status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'PAUSED') => {
      if (!goal) return

      if (goal.status === 'PENDING' && status === 'COMPLETED') {
        setError(tRef('goals.alerts.pendingNoComplete'))
        return
      }
      if (goal.status === 'COMPLETED') {
        setError(tRef('goals.alerts.completedLocked'))
        return
      }

      setSaving(true)
      setError('')
      try {
        await apiClient.patch(`/api/goals/${goalId}`, { status })
        setGoal({ ...goal, status })
      } catch (err) {
        console.error(err)
      }
      setSaving(false)
    },
    [goal, goalId, tRef]
  )

  const deleteGoal = useCallback(async (): Promise<boolean> => {
    try {
      await apiClient.delete(`/api/goals/${goalId}`)
      return true
    } catch {
      return false
    }
  }, [goalId])

  const saveEdit = useCallback(
    async (data: GoalEditData): Promise<boolean> => {
      if (!goal) return false

      if (goal.status !== 'PENDING') {
        setError(tRef('goals.alerts.activeNoEdit'))
        return false
      }

      setSaving(true)
      setError('')
      try {
        const result = await apiClient.patch<{ goal: Goal }>(`/api/goals/${goalId}`, {
          title: data.title.trim(),
          description: data.description?.trim() || null,
          category: data.category,
          priority: data.priority,
          deadline: data.deadline || null,
          estimatedHours: data.estimatedHours ?? null,
          phaseId: data.phaseId || null,
          milestones: data.milestones
            .filter((m) => m.title.trim())
            .map((m, i) => ({
              ...(m.id ? { id: m.id } : {}),
              title: m.title,
              targetDate: m.targetDate || null,
              order: i,
            })),
        })
        setGoal(result.goal)
        setError('')
        setSaving(false)
        return true
      } catch (err) {
        setError(err instanceof ApiError ? err.message : tRef('common.error'))
        setSaving(false)
        return false
      }
    },
    [goal, goalId, tRef]
  )

  // Derived permissions
  const permissions = goal
    ? {
        canEdit: goal.status === 'PENDING',
        canDelete:
          goal.status === 'PENDING' ||
          (goal.status === 'PAUSED' && !(goal.milestones?.some((m) => m.completed) ?? false)),
        canCheckMilestones: goal.status === 'ACTIVE',
        canActivate: goal.status !== 'ACTIVE' && goal.status !== 'COMPLETED',
        canPause: goal.status === 'ACTIVE',
        canComplete: goal.status !== 'COMPLETED' && goal.status !== 'PENDING',
        canChangeStatus: goal.status !== 'COMPLETED',
      }
    : null

  return {
    goal,
    loading,
    error,
    saving,
    phases,
    permissions,
    setError,
    fetchGoal,
    toggleMilestone,
    changeStatus,
    deleteGoal,
    saveEdit,
  }
}
