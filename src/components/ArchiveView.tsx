'use client'

import { useState, useMemo } from 'react'
import { Habit } from '@/types/habit'
import { calculateStreak, calculateCompletionRate } from '@/lib/habit-utils'
import { useAppTranslation } from '@/components/LanguageProvider'

interface ArchiveViewProps {
  habits: Habit[]
  loading?: boolean
}

export default function ArchiveView({ habits, loading }: ArchiveViewProps) {
  const { t } = useAppTranslation()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }, [])

  const months = [
    { value: 1, label: t('habits.archive.months.january') },
    { value: 2, label: t('habits.archive.months.february') },
    { value: 3, label: t('habits.archive.months.march') },
    { value: 4, label: t('habits.archive.months.april') },
    { value: 5, label: t('habits.archive.months.may') },
    { value: 6, label: t('habits.archive.months.june') },
    { value: 7, label: t('habits.archive.months.july') },
    { value: 8, label: t('habits.archive.months.august') },
    { value: 9, label: t('habits.archive.months.september') },
    { value: 10, label: t('habits.archive.months.october') },
    { value: 11, label: t('habits.archive.months.november') },
    { value: 12, label: t('habits.archive.months.december') },
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
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('habits.archive.title')}</h2>
        <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('habits.archive.subtitle')}</p>
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
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('habits.archive.totalCompletions')}</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>{totalCompletions}</p>
        </div>
        <div className="summary-card dashboard-card rounded-xl p-4 shadow-sm border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('habits.archive.activeHabits')}</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>{habits.filter((h) => h.state === 'Active').length}</p>
        </div>
        <div className="summary-card dashboard-card rounded-xl p-4 shadow-sm border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('habits.archive.bestStreak')}</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
            {Math.max(0, ...periodData.map((d) => d.streak))}
          </p>
        </div>
      </div>

      {/* Habit Breakdown */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('habits.archive.habitDetail')}</h3>
        {periodData.length === 0 ? (
          <div className="empty-state text-center py-8 rounded-xl border border-dashed" style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>{t('habits.archive.noHabits')}</p>
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
                    {t('habits.archive.completions', { count: completions })} · {t('habits.archive.currentStreak', { count: streak })} · {t('habits.archive.rate', { rate })}
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
                    {habit.state === 'Active' ? t('habits.archive.status.active') : habit.state === 'Paused' ? t('habits.archive.status.paused') : t('habits.archive.status.archived')}
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
                          title={new Date(completion.date).toLocaleDateString()}
                        />
                      )
                    })}
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('habits.archive.lastCompletions')}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
