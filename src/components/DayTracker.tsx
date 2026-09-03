'use client'

import { useState, useEffect } from 'react'
import { Goal } from '@/types/goal'
import { useAppTranslation } from '@/components/LanguageProvider'

interface DailyProgressForm {
  date: string
  goalId: string
  plannedTime: string | null
  actualTime: string | null
  gymCompleted: boolean
  sleepHours: number | null
  studyHours: number | null
  workHours: number | null
  notes: string
}

interface DayTrackerProps {
  onSubmit: (data: DailyProgressForm) => Promise<void>
  initialData?: Partial<DailyProgressForm>
}

export default function DayTracker({ onSubmit, initialData }: DayTrackerProps) {
  const { t } = useAppTranslation()
  const [goals, setGoals] = useState<Goal[]>([])
  const [form, setForm] = useState<DailyProgressForm>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    goalId: initialData?.goalId || '',
    plannedTime: initialData?.plannedTime ?? null,
    actualTime: initialData?.actualTime ?? null,
    gymCompleted: initialData?.gymCompleted || false,
    sleepHours: initialData?.sleepHours ?? null,
    studyHours: initialData?.studyHours ?? null,
    workHours: initialData?.workHours ?? null,
    notes: initialData?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/goals?status=ACTIVE')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.goals) setGoals(data.goals) })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit(form)
      setForm(f => ({ ...f, plannedTime: null, actualTime: null, notes: '' }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('progress.saveError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          {t('progress.dateLabel')}
        </label>
        <input
          type="date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border"
          style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          required
        />
      </div>

      {goals.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
{t('progress.goalLabel')}
           </label>
          <select
            value={form.goalId}
            onChange={e => setForm(f => ({ ...f, goalId: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border"
            style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="">{t('progress.generalGoal')}</option>
            {goals.map(g => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
{t('progress.plannedTimeLabel')}
           </label>
          <input
            type="time"
            value={form.plannedTime ?? ''}
            onChange={e => setForm(f => ({ ...f, plannedTime: e.target.value || null }))}
            className="w-full px-3 py-2 rounded-lg border"
            style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
{t('progress.actualTimeLabel')}
           </label>
          <input
            type="time"
            value={form.actualTime ?? ''}
            onChange={e => setForm(f => ({ ...f, actualTime: e.target.value || null }))}
            className="w-full px-3 py-2 rounded-lg border"
            style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
{t('progress.sleepHours')}
           </label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            value={form.sleepHours ?? ''}
            onChange={e => setForm(f => ({ ...f, sleepHours: e.target.value ? parseFloat(e.target.value) : null }))}
            placeholder="7.5"
            className="w-full px-3 py-2 rounded-lg border"
            style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
{t('progress.studyHours')}
           </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={form.studyHours ?? ''}
            onChange={e => setForm(f => ({ ...f, studyHours: e.target.value ? parseFloat(e.target.value) : null }))}
            placeholder="2"
            className="w-full px-3 py-2 rounded-lg border"
            style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
{t('progress.workHours')}
           </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={form.workHours ?? ''}
            onChange={e => setForm(f => ({ ...f, workHours: e.target.value ? parseFloat(e.target.value) : null }))}
            placeholder="1"
            className="w-full px-3 py-2 rounded-lg border"
            style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, gymCompleted: !f.gymCompleted }))}
            className={`w-full px-3 py-2 rounded-lg border font-medium transition-colors ${
              form.gymCompleted
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'border'
            }`}
            style={form.gymCompleted ? {} : { background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            {form.gymCompleted ? `✓ ${t('dashboard.gymDone')}` : t('dashboard.gym')}
          </button>
        </div>
      </div>

      {form.gymCompleted && form.sleepHours !== null && form.sleepHours < 7 && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm">
          {t('dashboard.gymSleepWarning')}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          {t('progress.notesLabel')}
        </label>
        <textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder={t('progress.notesPlaceholder')}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border resize-none"
          style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? t('progress.saving') : t('progress.saveProgress')}
      </button>
    </form>
  )
}