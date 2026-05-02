'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import GoalCard from '@/components/GoalCard'
import { Goal } from '@/types/goal'

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<{ status?: string; category?: string }>({})

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter.status) params.set('status', filter.status)
      if (filter.category) params.set('category', filter.category)

      const res = await fetch(`/api/goals?${params}`)
      if (!res.ok) throw new Error('Error al cargar objetivos')

      const data = await res.json()
      setGoals(data.goals)
      setError('')
    } catch (err) {
      setError('Error al cargar los objetivos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Objetivos
            </h1>
            <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Plan de mejora continua
            </p>
          </div>
          <a
            href="/goals/new"
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            + Nuevo objetivo
          </a>
        </header>

        <div className="flex gap-2 flex-wrap">
          <select
            value={filter.status || ''}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value || undefined }))}
            className="px-3 py-2 rounded-lg border"
            style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="COMPLETED">Completado</option>
            <option value="PAUSED">Pausado</option>
          </select>

          <select
            value={filter.category || ''}
            onChange={e => setFilter(f => ({ ...f, category: e.target.value || undefined }))}
            className="px-3 py-2 rounded-lg border"
            style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="">Todas las categorías</option>
            <option value="PROFESIONAL">Profesional</option>
            <option value="PERSONAL">Personal</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
            Cargando...
          </p>
        ) : error ? (
          <p className="text-center py-8 text-red-500">{error}</p>
        ) : goals.length === 0 ? (
          <div className="text-center py-12 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}>
            <p className="text-lg mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Sin objetivos
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Crea tu primer objetivo para empezar
            </p>
            <a
              href="/goals/new"
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors inline-block"
            >
              Crear objetivo
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onClick={() => window.location.href = `/goals/${goal.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
