'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import DayTracker from '@/components/DayTracker'
import WeekCalendar from '@/components/WeekCalendar'
import { DailyProgress } from '@/types/goal'

export default function ProgressPage() {
  const [entries, setEntries] = useState<DailyProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  })

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const end = new Date(currentWeek)
      end.setDate(end.getDate() + 6)

      const res = await fetch(`/api/progress/daily?startDate=${currentWeek.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`)
      if (!res.ok) throw new Error('Error al cargar progreso')

      const data = await res.json()
      setEntries(data.entries)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentWeek])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const handleSubmit = async (data: any) => {
    const res = await fetch('/api/progress/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al guardar')
    }

    await fetchEntries()
  }

  const prevWeek = () => {
    const d = new Date(currentWeek)
    d.setDate(d.getDate() - 7)
    setCurrentWeek(d)
  }

  const nextWeek = () => {
    const d = new Date(currentWeek)
    d.setDate(d.getDate() + 7)
    setCurrentWeek(d)
  }

  const weekLabel = `${currentWeek.toLocaleDateString('es', { month: 'short', day: 'numeric' })} - ${new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('es', { month: 'short', day: 'numeric', year: 'numeric' })}`

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Progreso diario
            </h1>
            <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Registra tu actividad diaria
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-primary/10" style={{ color: 'var(--color-text-muted)' }}>
                  ←
                </button>
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {weekLabel}
                </span>
                <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-primary/10" style={{ color: 'var(--color-text-muted)' }}>
                  →
                </button>
              </div>
              <WeekCalendar entries={entries} weekStart={currentWeek} />
            </div>
          </div>

          <div>
            <div className="dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Registrar día
              </h3>
              <DayTracker onSubmit={handleSubmit} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
