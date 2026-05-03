'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import MilestoneItem from '@/components/MilestoneItem'
import ProgressRing from '@/components/ProgressRing'
import PriorityBadge from '@/components/PriorityBadge'
import { Goal } from '@/types/goal'

export default function GoalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const goalId = params.id as string
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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

    const updatedMilestones = goal.milestones?.map(m =>
      m.id === milestoneId ? { ...m, completed } : m
    ) || []

    setGoal({ ...goal, milestones: updatedMilestones })

    await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        milestones: updatedMilestones,
      }),
    })
  }

  const handleStatusChange = async (status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'PAUSED') => {
    if (!goal) return
    setSaving(true)

    const res = await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (res.ok) {
      setGoal({ ...goal, status })
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!goal) return
    if (!confirm('¿Eliminar este objetivo?')) return

    const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/goals')
    } else {
      alert('Error al eliminar')
    }
  }

  const hasProgress = goal && (
    goal.status === 'COMPLETED' ||
    goal.totalHoursSpent > 0 ||
    (goal.milestones?.some(m => m.completed) ?? false)
  )

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      ACTIVE: 'Activo',
      COMPLETED: 'Completado',
      PAUSED: 'Pausado',
      CANCELLED: 'Cancelado',
    }
    return labels[status] || status
  }

  const statusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      PENDING: { bg: 'rgba(107,114,128,0.1)', text: '#6b7280' },
      ACTIVE: { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
      COMPLETED: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
      PAUSED: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
      CANCELLED: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
    }
    return colors[status] || colors.PENDING
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
                  {goal.phase && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--color-text-muted)' }}>Fase</span>
                      <span style={{ color: 'var(--color-text-primary)' }}>
                        {goal.phase.number}. {goal.phase.title}
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
                      readOnly={hasProgress === true && goal.status === 'COMPLETED'}
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
                    background: statusColor(goal.status).bg,
                    color: statusColor(goal.status).text,
                  }}
                >
                  {statusLabel(goal.status)}
                </span>
              </div>

              {!hasProgress && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs">
                  Este objetivo aún no tiene progreso. Puedes editar o eliminar.
                </div>
              )}

              <div className="mt-4 space-y-2">
                {goal.status !== 'ACTIVE' && (
                  <button
                    onClick={() => handleStatusChange('ACTIVE')}
                    disabled={saving}
                    className="w-full px-3 py-2 rounded-lg border text-sm hover:bg-primary/5 transition-colors"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    Activar
                  </button>
                )}
                {goal.status !== 'PAUSED' && goal.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleStatusChange('PAUSED')}
                    disabled={saving}
                    className="w-full px-3 py-2 rounded-lg border text-sm hover:bg-primary/5 transition-colors"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    Pausar
                  </button>
                )}
                {goal.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleStatusChange('COMPLETED')}
                    disabled={saving}
                    className="w-full px-3 py-2 rounded-lg border text-sm text-emerald-500 hover:bg-emerald-50 transition-colors"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    Marcar completo
                  </button>
                )}
              </div>

              {!hasProgress && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Eliminar objetivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
