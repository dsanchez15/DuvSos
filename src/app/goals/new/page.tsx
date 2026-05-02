'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import MilestoneItem from '@/components/MilestoneItem'
import PriorityBadge from '@/components/PriorityBadge'
import { Goal } from '@/types/goal'

export default function NewGoalPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'PERSONAL' as 'PROFESIONAL' | 'PERSONAL',
    priority: 'MEDIA' as 'ALTA' | 'MEDIA' | 'BAJA',
    deadline: '',
    estimatedHours: '',
  })
  const [milestones, setMilestones] = useState<{ title: string; targetDate: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', targetDate: '' }])
  }

  const updateMilestone = (index: number, field: 'title' | 'targetDate', value: string) => {
    const updated = [...milestones]
    updated[index][field] = value
    setMilestones(updated)
  }

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('El título es requerido')
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
          milestones: milestones.filter(m => m.title.trim()),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear objetivo')
      }

      router.push('/goals')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Nuevo objetivo
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Define tu meta y hitos
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Título *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Aprender TypeScript"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Objetivo general..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border resize-none"
                  style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Categoría
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as 'PROFESIONAL' | 'PERSONAL' }))}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="PERSONAL">Personal</option>
                    <option value="PROFESIONAL">Profesional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Prioridad
                  </label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as 'ALTA' | 'MEDIA' | 'BAJA' }))}
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Fecha límite
                  </label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Horas estimadas
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.estimatedHours}
                    onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))}
                    placeholder="40"
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Hitos
              </h3>
              <button
                type="button"
                onClick={addMilestone}
                className="text-sm px-3 py-1 rounded-lg border border-dashed"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                + Añadir hito
              </button>
            </div>

            {milestones.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                Sin hitos definidos
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
                        placeholder="Título del hito"
                        className="w-full px-3 py-2 rounded-lg border text-sm"
                        style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      />
                      <input
                        type="date"
                        value={m.targetDate}
                        onChange={e => updateMilestone(i, 'targetDate', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-sm"
                        style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMilestone(i)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <a
              href="/goals"
              className="flex-1 px-4 py-2 rounded-lg border font-medium text-center"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Crear objetivo'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
