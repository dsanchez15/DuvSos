'use client'

interface CheckInFormProps {
  onSubmit: (data: {
    weekStartDate: string
    fatigueLevel: number
    completedHours: number | null
    deviations: string
    adjustmentNotes: string
  }) => Promise<void>
  initialData?: {
    weekStartDate?: string
    fatigueLevel?: number
    completedHours?: number | null
    deviations?: string
    adjustmentNotes?: string
  }
}

export default function CheckInForm({ onSubmit, initialData }: CheckInFormProps) {
  const today = new Date()
  const weekStart = new Date(today)
  const day = weekStart.getDay()
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
  weekStart.setDate(diff)

  const [form, setForm] = useState({
    weekStartDate: initialData?.weekStartDate || weekStart.toISOString().split('T')[0],
    fatigueLevel: initialData?.fatigueLevel ?? 3,
    completedHours: initialData?.completedHours ?? null,
    deviations: initialData?.deviations || '',
    adjustmentNotes: initialData?.adjustmentNotes || '',
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
          Semana del
        </label>
        <input
          type="date"
          value={form.weekStartDate}
          onChange={e => setForm(f => ({ ...f, weekStartDate: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border"
          style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Nivel de fatiga (1-5)
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(level => (
            <button
              key={level}
              type="button"
              onClick={() => setForm(f => ({ ...f, fatigueLevel: level }))}
              className={`w-10 h-10 rounded-lg border font-medium transition-colors ${
                form.fatigueLevel === level ? 'bg-primary text-white border-primary' : ''
              }`}
              style={form.fatigueLevel !== level ? { background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' } : {}}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Horas completadas
        </label>
        <input
          type="number"
          step="0.5"
          min="0"
          value={form.completedHours ?? ''}
          onChange={e => setForm(f => ({ ...f, completedHours: e.target.value ? parseFloat(e.target.value) : null }))}
          placeholder="25"
          className="w-full px-3 py-2 rounded-lg border"
          style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Desviaciones
        </label>
        <textarea
          value={form.deviations}
          onChange={e => setForm(f => ({ ...f, deviations: e.target.value }))}
          placeholder="¿Qué salió del plan?"
          rows={2}
          className="w-full px-3 py-2 rounded-lg border resize-none"
          style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Notas de ajuste
        </label>
        <textarea
          value={form.adjustmentNotes}
          onChange={e => setForm(f => ({ ...f, adjustmentNotes: e.target.value }))}
          placeholder="¿Qué ajustes harás para la próxima semana?"
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
        {loading ? 'Guardando...' : 'Guardar check-in'}
      </button>
    </form>
  )
}

import { useState } from 'react'
