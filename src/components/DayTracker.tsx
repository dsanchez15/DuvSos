'use client'

import { useState } from 'react'

interface DailyProgressForm {
  date: string
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
  const [form, setForm] = useState<DailyProgressForm>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    gymCompleted: initialData?.gymCompleted || false,
    sleepHours: initialData?.sleepHours ?? null,
    studyHours: initialData?.studyHours ?? null,
    workHours: initialData?.workHours ?? null,
    notes: initialData?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit(form)
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
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
          Fecha
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Horas de sueño
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
            Horas de estudio
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
            Horas de trabajo
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
            {form.gymCompleted ? '✓ Gym completado' : 'Gym'}
          </button>
        </div>
      </div>

      {form.gymCompleted && form.sleepHours !== null && form.sleepHours < 7 && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm">
          ⚠️ Gimnasio requiere al menos 7 horas de sueño
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Notas
        </label>
        <textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Notas sobre el día..."
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
        {loading ? 'Guardando...' : 'Guardar progreso'}
      </button>
    </form>
  )
}
