'use client'

import { useState, useEffect } from 'react'
import { Habit, HabitWithMetrics } from '@/types/habit'
import { calculateStreak, calculateCompletionRate, getPeriodLabel, getPeriodRangeText, getTodayDateString, isCompletedOnDate, getLevelName } from '@/lib/habit-utils'
import UserProgressionBadge from './UserProgressionBadge'
import EnergySelector from './EnergySelector'

interface ActionViewProps {
  habits: Habit[]
  onToggleCompletion: (id: number, date: string, completed: boolean) => Promise<any>
  loading?: boolean
}

interface XPPopup {
  id: number
  xp: number
  newLevel: number
  leveledUp: boolean
  milestone: string | null
}

export default function ActionView({ habits, onToggleCompletion, loading }: ActionViewProps) {
  const [completingId, setCompletingId] = useState<number | null>(null)
  const [xpPopups, setXpPopups] = useState<XPPopup[]>([])
  const today = getTodayDateString()

  // Filter only active habits that are within their cycle
  const activeHabits = habits.filter((h) => {
    if (h.state !== 'Active') return false
    if (!h.isPermanent && h.endDate) {
      const end = new Date(h.endDate)
      end.setHours(23, 59, 59, 999)
      if (new Date() > end) return false
    }
    if (!h.isPermanent && h.startDate) {
      const start = new Date(h.startDate)
      start.setHours(0, 0, 0, 0)
      if (new Date() < start) return false
    }
    return true
  })

  const habitsWithMetrics: HabitWithMetrics[] = activeHabits.map((h) => ({
    ...h,
    metrics: {
      currentStreak: calculateStreak(h.completions, h.goalType, h.goalValue),
      completionRate: calculateCompletionRate(h.completions, h.goalType, h.goalValue),
      completionsThisPeriod: h.completions.filter((c) => {
        const cDate = new Date(c.date).toISOString().split('T')[0]
        return cDate === today
      }).length,
      periodTotal: h.goalValue,
    },
  }))

  const completedCount = habitsWithMetrics.filter((h) =>
    isCompletedOnDate(h.completions, today)
  ).length

  const handleToggle = async (id: number, completed: boolean) => {
    setCompletingId(id)
    try {
      const result = await onToggleCompletion(id, today, !completed)
      if (result?.xp) {
        const popup: XPPopup = {
          id: Date.now(),
          xp: result.xp.newXP,
          newLevel: result.xp.newLevel,
          leveledUp: result.xp.leveledUp,
          milestone: result.xp.milestone,
        }
        setXpPopups((prev) => [...prev, popup])
        setTimeout(() => {
          setXpPopups((prev) => prev.filter((p) => p.id !== popup.id))
        }, 4000)
      }
    } finally {
      setCompletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* XP Popups */}
      {xpPopups.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {xpPopups.map((popup) => (
            <div
              key={popup.id}
              className="xp-popup rounded-xl shadow-lg border p-4"
              style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
            >
              {popup.leveledUp && (
                <div className="text-center mb-2">
                  <span className="text-2xl">🎉</span>
                  <p className="level-up-text text-lg font-bold text-primary">¡Subiste de nivel!</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Nivel {popup.newLevel} - {getLevelName(popup.newLevel)}</p>
                </div>
              )}
              {popup.milestone && (
                <p className="milestone-text text-sm font-medium text-center" style={{ color: 'var(--color-warning)' }}>
                  🏆 {popup.milestone}
                </p>
              )}
              {!popup.leveledUp && !popup.milestone && (
                <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  +{popup.xp} XP
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Acción Diaria</h2>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {completedCount}/{habitsWithMetrics.length} completados hoy
          </p>
        </div>
        <UserProgressionBadge />
      </div>

      {/* Summary */}
      {habitsWithMetrics.length > 0 && (
        <div className="dashboard-card rounded-xl p-4 shadow-sm border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="habit-progress-track h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-input)' }}>
                <div
                  className="habit-progress-fill h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: 'var(--color-success)',
                    width: `${habitsWithMetrics.length > 0 ? (completedCount / habitsWithMetrics.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {Math.round((completedCount / Math.max(1, habitsWithMetrics.length)) * 100)}%
            </span>
          </div>
        </div>
      )}

      {habitsWithMetrics.length === 0 ? (
        <div className="empty-state text-center py-16 rounded-xl border border-dashed" style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)' }}>
          <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>No hay hábitos activos para hoy</p>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>Crea hábitos en la vista de planificación</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {habitsWithMetrics.map((habit) => {
            const isCompleted = isCompletedOnDate(habit.completions, today)
            const progress = Math.min(100, (habit.metrics.completionsThisPeriod / Math.max(1, habit.goalValue)) * 100)
            const periodLabel = getPeriodLabel(habit.goalType)
            const periodRange = getPeriodRangeText(habit.goalType)

            return (
              <div
                key={habit.id}
                className={`action-row rounded-xl p-4 shadow-sm border-l-4 transition-all hover:shadow-md ${
                  isCompleted ? 'action-row-completed opacity-75' : ''
                }`}
                style={{ background: 'var(--color-bg-surface)', borderLeftColor: habit.color }}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggle(habit.id, isCompleted)}
                    disabled={completingId === habit.id}
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'toggle-btn-completed'
                        : 'toggle-btn-pending action-toggle-btn-pending'
                    }`}
                    style={isCompleted
                      ? { background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }
                      : { background: 'var(--color-bg-input)', color: 'var(--color-text-muted)' }
                    }
                  >
                    {completingId === habit.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                    ) : isCompleted ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${isCompleted ? 'line-through' : ''}`} style={{ color: isCompleted ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                      {habit.title}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {habit.metrics.completionsThisPeriod} de {habit.goalValue} {periodLabel}
                      {periodRange && ` (${periodRange})`}
                    </p>
                    <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-input)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: habit.color,
                        }}
                      />
                    </div>
                  </div>

                  {habit.metrics.currentStreak > 0 && (
                    <div className="flex items-center gap-1 text-orange-500 flex-shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879.586.585.88 1.2.879 1.879 0 1.5-1.12 2.99-2.76 2.99-1.339 0-2.4-.78-2.87-1.75M7 17v2h6v-2H7z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-semibold">{habit.metrics.currentStreak}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* End of day summary */}
      {habitsWithMetrics.length > 0 && (
        <div className="day-summary dashboard-card rounded-xl p-4 border" style={{ background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', borderColor: 'var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {completedCount === habitsWithMetrics.length
              ? '🎉 Excelente! Completaste todos tus hábitos hoy.'
              : completedCount === 0
              ? '💪 Empieza con un hábito y construye momentum.'
              : `🌟 Vas bien! ${completedCount}/${habitsWithMetrics.length} hábitos completados.`}
          </p>
        </div>
      )}

      {/* Energy Selector */}
      <EnergySelector />
    </div>
  )
}
