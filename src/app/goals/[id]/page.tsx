'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import MilestoneItem from '@/components/MilestoneItem'
import ProgressRing from '@/components/ProgressRing'
import PriorityBadge from '@/components/PriorityBadge'
import { Goal } from '@/types/goal'
import { t, setLanguage, getLanguage } from '@/lib/i18n'

type Language = 'en' | 'es';

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
  const [milestoneErrors, setMilestoneErrors] = useState<Record<number, string>>({})
  const [phases, setPhases] = useState<any[]>([])
  const [lang, setLang] = useState<Language>(getLanguage())

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

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang)
    setLang(newLang)
  }

  const handleMilestoneToggle = async (milestoneId: string, completed: boolean) => {
    if (!goal || goal.status !== 'ACTIVE') return

    const updatedMilestones = goal.milestones?.map(m =>
      m.id === milestoneId ? { ...m, completed } : m
    ) || []

    setGoal({ ...goal, milestones: updatedMilestones })

    await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestones: updatedMilestones }),
    })
  }

  const handleStatusChange = async (status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'PAUSED') => {
    if (!goal) return

    // Validation rules
    if (goal.status === 'PENDING' && status === 'COMPLETED') {
      setError(t('goals.alerts.pendingNoComplete'))
      return
    }
    if (goal.status === 'COMPLETED') {
      setError(t('goals.alerts.completedLocked'))
      return
    }

    setSaving(true)
    setError('')

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
    if (!confirm(t('common.confirm'))) return

    const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/goals')
    } else {
      alert(t('common.error'))
    }
  }

  const handleSaveEdit = async () => {
    if (!goal || !editForm.title?.trim()) return

    // Only PENDING goals can be edited
    if (goal.status !== 'PENDING') {
      setError(t('goals.alerts.activeNoEdit'))
      return
    }

    // Validate each milestone has a date
    const errors: Record<number, string> = {}
    let hasError = false
    editMilestones.forEach((m, i) => {
      if (m.title.trim() && !m.targetDate) {
        errors[i] = t('goals.milestoneDateRequired')
        hasError = true
      }
    })
    setMilestoneErrors(errors)

    if (hasError) return

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
      setMilestoneErrors({})
      setError('')
    } else {
      const err = await res.json()
      setError(err.error || t('common.error'))
    }
    setSaving(false)
  }

  const addEditMilestone = () => {
    setEditMilestones([...editMilestones, { title: '', targetDate: '' }])
    setMilestoneErrors({})
  }

  const updateEditMilestone = (index: number, field: 'title' | 'targetDate', value: string) => {
    const updated = [...editMilestones]
    updated[index][field] = value
    setEditMilestones(updated)
    if (milestoneErrors[index]) {
      setMilestoneErrors(prev => { const n = { ...prev }; delete n[index]; return n; })
    }
  }

  const removeEditMilestone = (index: number) => {
    setEditMilestones(editMilestones.filter((_, i) => i !== index))
    if (milestoneErrors[index]) {
      setMilestoneErrors(prev => { const n = { ...prev }; delete n[index]; return n; })
    }
  }

  // Derive permissions from status
  const canEdit = goal?.status === 'PENDING'
  const canDelete = goal?.status === 'PENDING' ||
    (goal?.status === 'PAUSED' && !(goal.milestones?.some(m => m.completed) ?? false))
  const canCheckMilestones = goal?.status === 'ACTIVE'
  const canActivate = goal?.status !== 'ACTIVE' && goal?.status !== 'COMPLETED'
  const canPause = goal?.status === 'ACTIVE'
  const canComplete = goal?.status !== 'COMPLETED' && goal?.status !== 'PENDING'
  const canChangeStatus = goal?.status !== 'COMPLETED'

  const statusLabel = (status: string) => {
    return t(`goals.status.${status.toLowerCase()}`)
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
          {t('common.loading')}
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
            {t('common.back')}
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
        {/* Language toggle */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleLanguageChange('es')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${lang === 'es' ? 'bg-primary text-white' : 'border'}`}
            style={lang === 'es' ? {} : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            ES
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${lang === 'en' ? 'bg-primary text-white' : 'border'}`}
            style={lang === 'en' ? {} : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            EN
          </button>
        </div>

        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/goals" className="p-2 rounded-lg hover:bg-primary/10" style={{ color: 'var(--color-text-muted)' }}>
              ←
            </a>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {isEditing ? t('goals.actions.editGoal') : goal.title}
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
                    {t('goals.progress.title')}
                  </h3>
                  <div className="flex items-center gap-6">
                    {progress !== null && (
                      <ProgressRing progress={progress} size={80} strokeWidth={8} />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--color-text-muted)' }}>{t('goals.progress.timeInvested')}</span>
                        <span style={{ color: 'var(--color-text-primary)' }}>{goal.totalHoursSpent.toFixed(1)}h</span>
                      </div>
                      {goal.estimatedHours && (
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--color-text-muted)' }}>{t('goals.progress.estimated')}</span>
                          <span style={{ color: 'var(--color-text-primary)' }}>{goal.estimatedHours}h</span>
                        </div>
                      )}
                      {goal.deadline && (
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--color-text-muted)' }}>{t('goals.progress.deadline')}</span>
                          <span style={{ color: 'var(--color-text-primary)' }}>
                            {new Date(goal.deadline).toLocaleDateString(lang === 'es' ? 'es' : 'en')}
                          </span>
                        </div>
                      )}
                      {goal.phase && (
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--color-text-muted)' }}>{t('goals.progress.phase')}</span>
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
                    {t('goals.milestones')} ({goal.milestones?.filter(m => m.completed).length}/{goal.milestones?.length || 0})
                  </h3>
                  {goal.milestones && goal.milestones.length > 0 ? (
                    <div className="space-y-3">
                      {goal.milestones.map(milestone => (
                        <MilestoneItem
                          key={milestone.id}
                          milestone={milestone}
                          onToggle={canCheckMilestones ? handleMilestoneToggle : undefined}
                          readOnly={!canCheckMilestones}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                      Sin hitos definidos
                    </p>
                  )}
                  {!canCheckMilestones && goal.milestones && goal.milestones.length > 0 && (
                    <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {goal.status === 'PAUSED' ? t('goals.alerts.pausedNoCheck') :
                       goal.status === 'PENDING' ? t('goals.alerts.pendingNoComplete') :
                       t('goals.alerts.completedLocked')}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="dashboard-card rounded-xl p-6 border space-y-4" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('goals.titleLabel')}</label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('goals.descriptionLabel')}</label>
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
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('goals.categoryLabel')}</label>
                    <select
                      value={editForm.category || 'PERSONAL'}
                      onChange={e => setEditForm(f => ({ ...f, category: e.target.value as 'PROFESIONAL' | 'PERSONAL' }))}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >
                      <option value="PERSONAL">Personal</option>
                      <option value="PROFESIONAL">Professional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('goals.priorityLabel')}</label>
                    <select
                      value={editForm.priority || 'MEDIA'}
                      onChange={e => setEditForm(f => ({ ...f, priority: e.target.value as 'ALTA' | 'MEDIA' | 'BAJA' }))}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >
                      <option value="BAJA">{t('goals.status.pending') === 'Pendiente' ? 'Baja' : 'Low'}</option>
                      <option value="MEDIA">{t('goals.status.pending') === 'Pendiente' ? 'Media' : 'Medium'}</option>
                      <option value="ALTA">{t('goals.status.pending') === 'Pendiente' ? 'Alta' : 'High'}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('goals.deadlineLabel')}</label>
                    <input
                      type="date"
                      value={editForm.deadline ? new Date(editForm.deadline).toISOString().split('T')[0] : ''}
                      onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value || null }))}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('goals.estimatedHoursLabel')}</label>
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
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('goals.phaseLabel')}</label>
                    <select
                      value={editForm.phaseId || ''}
                      onChange={e => setEditForm(f => ({ ...f, phaseId: e.target.value || null }))}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >
                      <option value="">{t('goals.noPhase')}</option>
                      {phases.sort((a: any, b: any) => a.number - b.number).map((p: any) => (
                        <option key={p.id} value={p.id}>Phase {p.number}: {p.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('goals.milestones')}</h3>
                    <button
                      type="button"
                      onClick={addEditMilestone}
                      className="text-sm px-3 py-1 rounded-lg border border-dashed"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                      {t('goals.addMilestone')}
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
                              placeholder={t('goals.milestoneTitlePlaceholder')}
                              className="w-full px-3 py-2 rounded-lg border text-sm"
                              style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                            />
                            <div>
                              <input
                                type="date"
                                value={m.targetDate}
                                onChange={e => updateEditMilestone(i, 'targetDate', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border text-sm ${milestoneErrors[i] ? 'border-red-500' : ''}`}
                                style={{ background: 'var(--color-bg-input)', borderColor: milestoneErrors[i] ? '#ef4444' : 'var(--color-border)', color: 'var(--color-text-primary)' }}
                              />
                              {milestoneErrors[i] && (
                                <p className="text-xs text-red-500 mt-1">{milestoneErrors[i]}</p>
                              )}
                            </div>
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
                    onClick={() => { setIsEditing(false); setMilestoneErrors({}); setError(''); }}
                    className="flex-1 px-4 py-2 rounded-lg border font-medium"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? t('common.loading') : t('common.save')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {t('goals.status.pending') === 'Pendiente' ? 'Estado' : 'Status'}
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

              {canEdit && !isEditing && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs">
                  {t('goals.alerts.noProgress')}
                </div>
              )}

              {!isEditing && canChangeStatus && (
                <div className="mt-4 space-y-2">
                  {canActivate && (
                    <button
                      onClick={() => handleStatusChange('ACTIVE')}
                      disabled={saving}
                      className="w-full px-3 py-2 rounded-lg border text-sm hover:bg-primary/5 transition-colors"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                      {t('goals.actions.activate')}
                    </button>
                  )}
                  {canPause && (
                    <button
                      onClick={() => handleStatusChange('PAUSED')}
                      disabled={saving}
                      className="w-full px-3 py-2 rounded-lg border text-sm hover:bg-primary/5 transition-colors"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                      {t('goals.actions.pause')}
                    </button>
                  )}
                  {canComplete && (
                    <button
                      onClick={() => handleStatusChange('COMPLETED')}
                      disabled={saving}
                      className="w-full px-3 py-2 rounded-lg border text-sm text-emerald-500 hover:bg-emerald-50 transition-colors"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      {t('goals.actions.complete')}
                    </button>
                  )}
                </div>
              )}

              {!isEditing && (
                <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
                  {canEdit && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full px-3 py-2 rounded-lg text-sm hover:bg-primary/5 transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {t('goals.actions.editGoal')}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      {t('goals.actions.deleteGoal')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
