'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import GoalCard from '@/components/GoalCard'
import MilestoneItem from '@/components/MilestoneItem'
import ProgressRing from '@/components/ProgressRing'
import PriorityBadge from '@/components/PriorityBadge'
import { Goal, Milestone } from '@/types/goal'

export default function GoalDetailPage() {
  const params = useParams()
  const goalId = params.id as string
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchGoal = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/goals/${goalId}`)
      if (!res.ok) throw new Error('Error al cargar objetivo')

      const data = await res.json()
      setGoal(data.goal)
      setError('')
    } catch (err) {
      setError('Error al cargar el objetivo')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [goalId])

  useEffect(() => {
    fetchGoal()
  }, [fetchGoal])

  const handleMilestoneToggle = async (milestoneId: string, completed: boolean) => {
    if (!goal) return

    const updatedGoal = {
      ...goal,
      milestones: goal.milestones?.map(m =>
        m.id === milestoneId ? { ...m, completed } : m
      ),
    }
    setGoal(updatedGoal)

    await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: updatedGoal.status,
      }),
    })
  }

  const handleStatusChange = async (status: 'ACTIVE' | 'COMPLETED' | 'PAUSED') => {
    if (!goal) return

    await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    setGoal({ ...goal, status })
  }

  if (loading) {
    return (
      <AppLayout>
        <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
          Cargando...
        </p>
      </AppLayout>
    )
  }

  if (!goal) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-lg mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Objetivo no encontrado
          </p>
          <a href="/goals" className="text-primary hover:underline">
            Volver a objetivos
          </a>
        </div>
      </AppLayout>
    )
  }

  const progress = goal.estimatedHours && goal.estimatedHours > 0
    ? Math.min(100, (goal.totalHoursSpent / goal.estimatedHours) * 100)
    : null

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/goals" className="p-2 rounded-lg hover:bg-primary/10" style={{ color: 'var(--color-text-muted)' }}>
              ←
            </a>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {goal.title}
              </h1>
              {goal.description && (
                <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {goal.description}
                </p>
              )}
            </div>
          </div>
          <PriorityBadge priority={goal.priority} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Progreso
              </h3>
              <div className="flex items-center gap-6">
                {progress !== null && (
                  <ProgressRing progress={progress} size={80} strokeWidth={8} />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-text-muted)' }}>Tiempo invertido</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{goal.totalHoursSpent.toFixed(1)}h</span>
                  </div>
                  {goal.estimatedHours && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--color-text-muted)' }}>Estimado</span>
                      <span style={{ color: 'var(--color-text-primary)' }}>{goal.estimatedHours}h</span>
                    </div>
                  )}
                  {goal.deadline && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--color-text-muted)' }}>Fecha límite</span>
                      <span style={{ color: 'var(--color-text-primary)' }}>
                        {new Date(goal.deadline).toLocaleDateString('es')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Hitos ({goal.milestones?.filter(m => m.completed).length}/{goal.milestones?.length || 0})
              </h3>
              {goal.milestones && goal.milestones.length > 0 ? (
                <div className="space-y-3">
                  {goal.milestones.map(milestone => (
                    <MilestoneItem
                      key={milestone.id}
                      milestone={milestone}
                      onToggle={handleMilestoneToggle}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                  Sin hitos definidos
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Estado
              </h3>
              <div className="space-y-2">
                <span
                  className="inline-flex px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    background: goal.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: goal.status === 'ACTIVE' ? '#10b981' : '#f59e0b',
                  }}
                >
                  {goal.status === 'ACTIVE' ? 'Activo' : goal.status === 'COMPLETED' ? 'Completado' : 'Pausado'}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => handleStatusChange('ACTIVE')}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Activar
                </button>
                <button
                  onClick={() => handleStatusChange('PAUSED')}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Pausar
                </button>
                <button
                  onClick={() => handleStatusChange('COMPLETED')}
                  className="w-full px-3 py-2 rounded-lg border text-sm text-emerald-500"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Marcar completo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
