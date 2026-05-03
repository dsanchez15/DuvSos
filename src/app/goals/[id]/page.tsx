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
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Goal>>({})
  const [editMilestones, setEditMilestones] = useState<{ title: string; targetDate: string; id?: string }[]>([])
  const [phases, setPhases] = useState<any[]>([])

  const fetchGoal = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/goals/${goalId}`)
      if (!res.ok) throw new Error('Error al cargar objetivo')

      const data = await res.json()
      setGoal(data.goal)
      setEditForm(data.goal)
      setEditMilestones(data.goal.milestones?.map((m: any) => ({
        id: m.id,
        title: m.title,
        targetDate: m.targetDate ? new Date(m.targetDate).toISOString().split('T')[0] : '',
      })) || [])
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
    fetch('/api/phases').then(r => r.ok && r.json()).then(d => d?.phases && setPhases(d.phases)).catch(() => {})
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

  const handleSaveEdit = async () => {
    if (!goal || !editForm.title?.trim()) return

    const invalidMilestones = editMilestones.filter(m => m.title.trim() && !m.targetDate)
    if (invalidMilestones.length > 0) {
      setError('Todos los hitos deben tener una fecha objetivo')
      return
    }

    setSaving(true)
    setError('')

    const res = await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editForm.title.trim(),
        description: editForm.description?.trim() || null,
        category: editForm.category,
        priority: editForm.priority,
        deadline: editForm.deadline || null,
        estimatedHours: editForm.estimatedHours ? parseFloat(String(editForm.estimatedHours)) : null,
        phaseId: editForm.phaseId || null,
        milestones: editMilestones.filter(m => m.title.trim()).map((m, i) => ({
          ...(m.id ? { id: m.id } : {}),
          title: m.title,
          targetDate: m.targetDate || null,
          order: i,
        })),
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setGoal(data.goal)
      setIsEditing(false)
      setError('')
    } else {
      const err = await res.json()
      setError(err.error || 'Error al guardar')
    }
    setSaving(false)
  }

  const addEditMilestone = () => {
    setEditMilestones([...editMilestones, { title: '', targetDate: '' }])
  }

  const updateEditMilestone = (index: number, field: 'title' | 'targetDate', value: string) => {
    const updated = [...editMilestones]
    updated[index][field] = value
    setEditMilestones(updated)
  }

  const removeEditMilestone = (index: number) => {
    setEditMilestones(editMilestones.filter((_, i) => i !== index))
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
                {isEditing ? 'Editar objetivo' : goal.title}
              </h1>
              {!isEditing && goal.description && (
                <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {goal.description}
                </p>
              )}
            </div>
          </div>
          {!isEditing && <PriorityBadge priority={goal.priority} />}
        </header>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {!isEditing ? (
              <>
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
              </>
            ) : (
              <div className="dashboard-card rounded-xl p-6 border space-y-4" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Título *</label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Descripción</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border resize-none"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Categoría</label>
                    <select
                      value={editForm.category || 'PERSONAL'}
                      onChange={e => setEditForm(f => ({ ...f, category: e.target.value as 'PROFESIONAL' | 'PERSONAL' }))}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >
                      <option value="PERSONAL">Personal</option>
                      <option value="PROFESIONAL">Profesional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Prioridad</label>
                    <select
                      value={editForm.priority || 'MEDIA'}
                      onChange={e => setEditForm(f => ({ ...f, priority: e.target.value as 'ALTA' | 'MEDIA' | 'BAJA' }))}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >
                      <option value="BAJA">Baja</option>
                      <option value="MEDIA">Media</option>
                      <option value="ALTA">Alta</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Fecha límite</label>
                    <input
                      type="date"
                      value={editForm.deadline ? new Date(editForm.deadline).toISOString().split('T')[0] : ''}
                      onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value || null }))}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Horas estimadas</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={editForm.estimatedHours || ''}
                      onChange={e => setEditForm(f => ({ ...f, estimatedHours: e.target.value ? parseFloat(e.target.value) : null }))}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                </div>
                {phases.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Fase</label>
                    <select
                      value={editForm.phaseId || ''}
                      onChange={e => setEditForm(f => ({ ...f, phaseId: e.target.value || null }))}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >
                      <option value="">Sin fase</option>
                      {phases.sort((a: any, b: any) => a.number - b.number).map((p: any) => (
                        <option key={p.id} value={p.id}>Fase {p.number}: {p.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Hitos</h3>
                    <button
                      type="button"
                      onClick={addEditMilestone}
                      className="text-sm px-3 py-1 rounded-lg border border-dashed"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                      + Añadir hito
                    </button>
                  </div>
                  {editMilestones.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>Sin hitos definidos</p>
                  ) : (
                    <div className="space-y-3">
                      {editMilestones.map((m, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={m.title}
                              onChange={e => updateEditMilestone(i, 'title', e.target.value)}
                              placeholder="Título del hito"
                              className="w-full px-3 py-2 rounded-lg border text-sm"
                              style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                            />
                            <input
                              type="date"
                              value={m.targetDate}
                              onChange={e => updateEditMilestone(i, 'targetDate', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border text-sm"
                              style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEditMilestone(i)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { setIsEditing(false); setError(''); }}
                    className="flex-1 px-4 py-2 rounded-lg border font-medium"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            )}
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

              {!hasProgress && !isEditing && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs">
                  Este objetivo aún no tiene progreso. Puedes editar o eliminar.
                </div>
              )}

              {!isEditing && (
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
                  {goal.status !== 'PAUSED' && goal.status !== 'COMPLETED' && goal.status !== 'PENDING' && (
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
              )}

              {!hasProgress && !isEditing && (
                <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full px-3 py-2 rounded-lg text-sm hover:bg-primary/5 transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Editar objetivo
                  </button>
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
