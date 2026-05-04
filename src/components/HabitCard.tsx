'use client'

import { useState } from 'react'
import { Habit, HabitFormData, HabitState } from '@/types/habit'
import { calculateStreak, getTodayDateString, getLast7Days, isCompletedOnDate } from '@/lib/habit-utils'
import { useAppTranslation } from '@/components/LanguageProvider'

interface HabitCardProps {
  habit: Habit
  onUpdate: (id: number, data: HabitFormData) => void
  onDelete: (id: number) => void
  onToggleCompletion?: (id: number, date: string, completed: boolean) => void
  onStateChange?: (id: number, state: HabitState) => Promise<void>
  onEdit?: () => void
  mode?: 'planning' | 'action'
}

export default function HabitCard({
  habit,
  onUpdate,
  onDelete,
  onToggleCompletion,
  onStateChange,
  onEdit,
  mode = 'planning',
}: HabitCardProps) {
  const { t } = useAppTranslation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [stateLoading, setStateLoading] = useState(false)

  const today = getTodayDateString()
  const isCompletedToday = isCompletedOnDate(habit.completions, today)
  const last7Days = getLast7Days()
  const streak = calculateStreak(habit.completions, habit.goalType, habit.goalValue)

  const handleStateChange = async (newState: HabitState) => {
    if (!onStateChange) return
    setStateLoading(true)
    try {
      await onStateChange(habit.id, newState)
    } finally {
      setStateLoading(false)
    }
  }

  const stateActions: { label: string; state: HabitState; colorToken: string; hoverClass: string }[] = []
  if (habit.state === 'Active') {
    stateActions.push(
      { label: t('habits.card.pause'), state: 'Paused', colorToken: 'var(--color-warning)', hoverClass: 'habit-state-btn-warning' },
      { label: t('habits.card.archive'), state: 'Archived', colorToken: 'var(--color-text-secondary)', hoverClass: 'habit-state-btn-muted' }
    )
  } else if (habit.state === 'Paused') {
    stateActions.push(
      { label: t('habits.card.activate'), state: 'Active', colorToken: 'var(--color-success)', hoverClass: 'habit-state-btn-success' },
      { label: t('habits.card.archive'), state: 'Archived', colorToken: 'var(--color-text-secondary)', hoverClass: 'habit-state-btn-muted' }
    )
  } else if (habit.state === 'Archived') {
    stateActions.push(
      { label: t('habits.card.reactivate'), state: 'Active', colorToken: 'var(--color-success)', hoverClass: 'habit-state-btn-success' }
    )
  }

  const goalTypeLabel = habit.goalType === 'Daily' ? t('habits.goalTypes.daily') : habit.goalType === 'Weekly' ? t('habits.goalTypes.weekly') : habit.goalType === 'Monthly' ? t('habits.goalTypes.monthly') : t('habits.goalTypes.ratio')

  return (
    <div className="dashboard-card rounded-xl p-6 border-l-4 transition-all" style={{ background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-md)', borderLeftColor: habit.color }}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{habit.title}</h3>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                habit.state === 'Active' ? 'badge-active' : habit.state === 'Paused' ? 'badge-paused' : 'badge-archived'
              }`}
              style={
                habit.state === 'Active'
                  ? { background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }
                  : habit.state === 'Paused'
                  ? { background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }
                  : { background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-muted)' }
              }
            >
              {habit.state === 'Active' ? t('habits.card.statusActive') : habit.state === 'Paused' ? t('habits.card.statusPaused') : t('habits.card.statusArchived')}
            </span>
            {habit.category && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-muted)' }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: habit.category.color }} />
                {habit.category.name}
              </span>
            )}
          </div>
          {habit.description && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{habit.description}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span>{t('habits.card.goalLabel', { type: goalTypeLabel, value: habit.goalValue, unit: habit.goalType === 'Ratio' ? '%' : 'x' })}</span>
            {habit.isPermanent ? (
              <span>{t('habits.card.permanent')}</span>
            ) : (
              <span>{habit.startDate ? new Date(habit.startDate).toLocaleDateString() : ''} – {habit.endDate ? new Date(habit.endDate).toLocaleDateString() : ''}</span>
            )}
            {habit.objective && (
              <span>{t('habits.card.objectiveLabel', { name: habit.objective.name })}</span>
            )}
          </div>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              title={t('habits.card.edit')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 habit-delete-btn rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            title={t('habits.card.deleteTitle')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-4">
        {onToggleCompletion && mode === 'planning' && (
          <button
            onClick={() => onToggleCompletion(habit.id, today, !isCompletedToday)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isCompletedToday
                ? 'habit-completion-done'
                : 'habit-completion-pending'
              }`}
            style={isCompletedToday
              ? { background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }
              : { background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-secondary)' }
            }
          >
            {isCompletedToday ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('habits.card.completedToday')}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t('habits.card.markDone')}</span>
              </>
            )}
          </button>
        )}

        {streak > 0 && (
          <div className="flex items-center gap-1 text-orange-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879.586.585.88 1.2.879 1.879 0 1.5-1.12 2.99-2.76 2.99-1.339 0-2.4-.78-2.87-1.75M7 17v2h6v-2H7z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{t('habits.card.streakDays', { count: streak })}</span>
          </div>
        )}

        {/* State transition buttons */}
        {mode === 'planning' && onStateChange && stateActions.map((action) => (
          <button
            key={action.state}
            onClick={() => handleStateChange(action.state)}
            disabled={stateLoading}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${action.hoverClass}`}
            style={{ color: action.colorToken }}
          >
            {stateLoading ? '...' : action.label}
          </button>
        ))}
      </div>

      {/* Last 7 days */}
      <div className="flex items-center gap-1">
        <span className="text-xs mr-2" style={{ color: 'var(--color-text-muted)' }}>{t('habits.card.last7Days')}</span>
        {last7Days.map((date) => {
          const isCompleted = isCompletedOnDate(habit.completions, date)
          const dayName = new Date(date).toLocaleDateString(undefined, { weekday: 'narrow' })
          return (
            <div
              key={date}
              className={`day-cell w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${isCompleted
                  ? 'day-cell-completed'
                  : ''
                }`}
              style={isCompleted
                ? { background: 'var(--color-success)', color: 'var(--color-text-inverse)' }
                : { background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-muted)' }
              }
              title={new Date(date).toLocaleDateString()}
            >
              {dayName}
            </div>
          )
        })}
      </div>

      {/* Blockers */}
      {habit.blockers && habit.blockers.length > 0 && (
        <div className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span className="font-medium">{t('habits.card.blockersLabel')}</span>{' '}
          {habit.blockers.map((b) => b.blockerHabit?.title).join(', ')}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="delete-modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="delete-modal rounded-xl p-6 max-w-sm w-full" style={{ background: 'var(--color-bg-surface)' }}>
            <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('habits.card.deleteConfirmTitle')}</h4>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              {t('habits.card.deleteConfirmMessage', { title: habit.title })}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-outline flex-1 px-4 py-2 rounded-lg habit-cancel-btn transition-colors font-medium"
                style={{ background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-secondary)' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  onDelete(habit.id)
                  setShowDeleteConfirm(false)
                }}
                className="btn-danger flex-1 px-4 py-2 rounded-lg transition-colors font-medium"
                style={{ background: 'var(--color-danger)', color: 'var(--color-text-inverse)' }}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
