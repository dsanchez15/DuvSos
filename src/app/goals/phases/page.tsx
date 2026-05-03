'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { Phase } from '@/types/goal'

export default function PhasesPage() {
  const router = useRouter()
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ number: '', title: '', description: '', startDate: '', endDate: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPhases()
  }, [])

  const fetchPhases = async () => {
    try {
      const res = await fetch('/api/phases')
      if (res.ok) {
        const data = await res.json()
        setPhases(data.phases)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.number) return

    setSaving(true)
    try {
      const res = await fetch('/api/phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: parseInt(form.number),
          title: form.title.trim(),
          description: form.description.trim() || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      })

      if (res.ok) {
        setForm({ number: '', title: '', description: '', startDate: '', endDate: '' })
        setShowForm(false)
        fetchPhases()
      }
    } finally {
      setSaving(false)
    }
  }

  const deletePhase = async (id: string) => {
    if (!confirm('¿Eliminar esta fase? Los objetivos asociados quedarán sin fase.')) return
    try {
      const res = await fetch(`/api/phases/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPhases(phases.filter(p => p.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a href="/goals" className="p-2 rounded-lg hover:bg-primary/10" style={{ color: 'var(--color-text-muted)' }}>
              ←
            </a>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Fases del plan
              </h1>
              <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Organiza tus objetivos en fases temporizadas
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            {showForm ? 'Cancelar' : '+ Nueva fase'}
          </button>
        </header>

        {showForm && (
          <div className="dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Nueva fase
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Número de fase *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.number}
                    onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Título *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Fundamentos"
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción de la fase..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border resize-none"
                  style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Crear fase'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Cargando...</p>
        ) : phases.length === 0 ? (
          <div className="text-center py-12 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}>
            <p className="text-lg mb-2" style={{ color: 'var(--color-text-primary)' }}>Sin fases</p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Crea fases para organizar tus objetivos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phases.sort((a, b) => a.number - b.number).map(phase => (
              <div
                key={phase.id}
                className="dashboard-card rounded-xl p-6 border relative"
                style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {phase.number}
                    </span>
                    <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{phase.title}</h3>
                  </div>
                  <button
                    onClick={() => deletePhase(phase.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {phase.description && (
                  <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{phase.description}</p>
                )}
                {(phase.startDate || phase.endDate) && (
                  <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {phase.startDate && new Date(phase.startDate).toLocaleDateString('es')}
                    {phase.startDate && phase.endDate && ' - '}
                    {phase.endDate && new Date(phase.endDate).toLocaleDateString('es')}
                  </p>
                )}
                <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {phase._count?.goals || 0} objetivos
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}