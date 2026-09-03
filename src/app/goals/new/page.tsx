'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { Phase } from '@/types/goal'
import { useAppTranslation } from '@/components/LanguageProvider'

export default function NewGoalPage() {
  const { t } = useAppTranslation()
  const router = useRouter()
  const [phases, setPhases] = useState<Phase[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'PERSONAL' as 'PROFESIONAL' | 'PERSONAL',
    priority: 'MEDIA' as 'ALTA' | 'MEDIA' | 'BAJA',
    deadline: '',
    estimatedHours: '',
    phaseId: '',
  })
  const [milestones, setMilestones] = useState<{ title: string; targetDate: string }[]>([])
  const [milestoneErrors, setMilestoneErrors] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/phases').then(res => res.ok && res.json()).then(data => {
      if (data?.phases) setPhases(data.phases)
    }).catch(() => {})
  }, [])

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', targetDate: '' }])
  }

  const updateMilestone = (index: number, field: 'title' | 'targetDate', value: string) => {
    const updated = [...milestones]
    updated[index][field] = value
    setMilestones(updated)
    if (milestoneErrors[index]) {
      setMilestoneErrors(prev => { const n = { ...prev }; delete n[index]; return n; })
    }
  }

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
    if (milestoneErrors[index]) {
      setMilestoneErrors(prev => { const n = { ...prev }; delete n[index]; return n; })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError(t('goals.titleLabel').replace(' *', '') + ' ' + t('common.required').toLowerCase())
      return
    }

    const errors: Record<number, string> = {}
    let hasError = false
    milestones.forEach((m, i) => {
      if (m.title.trim() && !m.targetDate) {
        errors[i] = t('goals.milestoneDateRequired')
        hasError = true
      }
    })
    setMilestoneErrors(errors)

    if (hasError) {
      setError('')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          deadline: form.deadline || null,
          estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : null,
          phaseId: form.phaseId || null,
          milestones: milestones.filter(m => m.title.trim()),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t('common.error'))
      }

      router.push('/goals')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const priorityLabel = (p: string) => {
    if (p === 'ALTA') return t('goals.priorityHigh')
    if (p === 'MEDIA') return t('goals.priorityMedium')
    return t('goals.priorityLow')
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('goals.newGoal')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {t('goals.newPageSubtitle')}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-[8px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="dashboard-card rounded-[8px] p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('goals.titleLabel')}
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={t('goals.titlePlaceholder')}
                  className="w-full px-4 py-2 rounded-[8px] border"
                  style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('goals.descriptionLabel')}
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={t('goals.descriptionPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-2 rounded-[8px] border resize-none"
                  style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('goals.categoryLabel')}
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as 'PROFESIONAL' | 'PERSONAL' }))}
                    className="w-full px-4 py-2 rounded-[8px] border"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="PERSONAL">{t('goals.categoryPersonal')}</option>
                    <option value="PROFESIONAL">{t('goals.categoryProfessional')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('goals.priorityLabel')}
                  </label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as 'ALTA' | 'MEDIA' | 'BAJA' }))}
                    className="w-full px-4 py-2 rounded-[8px] border"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="BAJA">{priorityLabel('BAJA')}</option>
                    <option value="MEDIA">{priorityLabel('MEDIA')}</option>
                    <option value="ALTA">{priorityLabel('ALTA')}</option>
                  </select>
                </div>
              </div>

              {phases.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('goals.phaseLabel')}
                  </label>
                  <select
                    value={form.phaseId}
                    onChange={e => setForm(f => ({ ...f, phaseId: e.target.value }))}
                    className="w-full px-4 py-2 rounded-[8px] border"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="">{t('goals.noPhase')}</option>
                    {phases.sort((a, b) => a.number - b.number).map(p => (
                      <option key={p.id} value={p.id}>Phase {p.number}: {p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('goals.deadlineLabel')}
                  </label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className="w-full px-4 py-2 rounded-[8px] border"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('goals.estimatedHoursLabel')}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.estimatedHours}
                    onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))}
                    placeholder="40"
                    className="w-full px-4 py-2 rounded-[8px] border"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-[8px] p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {t('goals.milestones')}
              </h3>
              <button
                type="button"
                onClick={addMilestone}
                className="text-sm px-3 py-1 rounded-[8px] border border-dashed"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                {t('goals.addMilestone')}
              </button>
            </div>

            {milestones.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                {t('goals.noMilestones')}
              </p>
            ) : (
              <div className="space-y-3">
                {milestones.map((m, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={m.title}
                        onChange={e => updateMilestone(i, 'title', e.target.value)}
                        placeholder={t('goals.milestoneTitlePlaceholder')}
                        className="w-full px-3 py-2 rounded-[8px] border text-sm"
                        style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      />
                      <div>
                        <input
                          type="date"
                          value={m.targetDate}
                          onChange={e => updateMilestone(i, 'targetDate', e.target.value)}
                          className={`w-full px-3 py-2 rounded-[8px] border text-sm ${milestoneErrors[i] ? 'border-red-500' : ''}`}
                          style={{ background: 'var(--color-bg-input)', borderColor: milestoneErrors[i] ? '#ef4444' : 'var(--color-border)', color: 'var(--color-text-primary)' }}
                        />
                        {milestoneErrors[i] && (
                          <p className="text-xs text-red-500 mt-1">{milestoneErrors[i]}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMilestone(i)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-[8px]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Link
              href="/goals"
              className="flex-1 px-4 py-2 rounded-[8px] border font-medium text-center"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              {t('common.cancel')}
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
