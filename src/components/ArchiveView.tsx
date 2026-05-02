'use client'

import { useState, useMemo } from 'react'
import { Habit } from '@/types/habit'
import { calculateStreak, calculateCompletionRate } from '@/lib/habit-utils'

interface ArchiveViewProps {
  habits: Habit[]
  loading?: boolean
}

export default function ArchiveView({ habits, loading }: ArchiveViewProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }, [])

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ]

  const periodStart = new Date(selectedYear, selectedMonth - 1, 1)
  const periodEnd = new Date(selectedYear, selectedMonth, 1)

  const periodData = useMemo(() => {
    return habits.map((habit) => {
      const periodCompletions = habit.completions.filter((c) => {
        const d = new Date(c.date)
        return d >= periodStart && d < periodEnd
      })

      const streak = calculateStreak(habit.completions, habit.goalType, habit.goalValue)
      const rate = calculateCompletionRate(periodCompletions, habit.goalType, habit.goalValue)

      return {
        habit,
        completions: periodCompletions.length,
        streak,
        rate,
      }
    })
  }, [habits, selectedYear, selectedMonth])

  const totalCompletions = periodData.reduce((sum, d) => sum + d.completions, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Archivo Histórico</h2>
        <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>Analiza tu progreso pasado</p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-3">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="rf-select px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="rf-select px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="summary-card dashboard-card rounded-xl p-4 shadow-sm border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Completaciones</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>{totalCompletions}</p>
        </div>
        <div className="summary-card dashboard-card rounded-xl p-4 shadow-sm border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Hábitos Activos</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>{habits.filter((h) => h.state === 'Active').length}</p>
        </div>
        <div className="summary-card dashboard-card rounded-xl p-4 shadow-sm border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Mejor Racha</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
            {Math.max(0, ...periodData.map((d) => d.streak))}
          </p>
        </div>
      </div>

      {/* Habit Breakdown */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Detalle por Hábito</h3>
        {periodData.length === 0 ? (
          <div className="empty-state text-center py-8 rounded-xl border border-dashed" style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>No hay hábitos para mostrar</p>
          </div>
        ) : (
          periodData.map(({ habit, completions, streak, rate }) => (
            <div
              key={habit.id}
              className="archive-habit-card dashboard-card rounded-xl p-4 shadow-sm border-l-4"
              style={{ background: 'var(--color-bg-surface)', borderLeftColor: habit.color }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{habit.title}</h4>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {completions} completaciones · Racha actual: {streak} · Tasa: {rate}%
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium`}
                    style={
                      habit.state === 'Active'
                        ? { background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }
                        : habit.state === 'Paused'
                        ? { background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }
                        : { background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)' }
                    }>
                    {habit.state === 'Active' ? 'Activo' : habit.state === 'Paused' ? 'Pausado' : 'Archivado'}
                  </span>
                </div>
              </div>

              {/* Streak chart - simple bar representation */}
              {habit.completions.length > 0 && (
                <div className="mt-3">
                  <div className="flex gap-0.5 flex-wrap">
                    {Array.from({ length: Math.min(30, habit.completions.length) }, (_, i) => {
                      const completion = habit.completions[i]
                      return (
                        <div
                          key={i}
                          className="completion-dot w-3 h-3 rounded-sm"
                          style={{ backgroundColor: habit.color }}
                          title={new Date(completion.date).toLocaleDateString('es')}
                        />
                      )
                    })}
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Últimas completaciones</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
