'use client'

import { Card } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { HabitTracker } from '@/types/dashboard'

interface HabitGridProps {
  habits: HabitTracker[]
  onMarkDone: (id: number) => void
}

export default function HabitGrid({ habits, onMarkDone }: HabitGridProps) {
  const { t } = useAppTranslation()

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
        {t('dashboard.habitTrackers')}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {habits.length === 0 && (
          <Card className="col-span-full p-8 text-center">
            <p className="text-sm text-text-muted">{t('dashboard.noHabits')}</p>
          </Card>
        )}
        {habits.slice(0, 5).map((habit) => (
          <div
            key={habit.id}
            className="dashboard-card rounded-[8px] border p-4 transition-all"
            style={
              habit.completedToday
                ? {
                    background: 'color-mix(in srgb, var(--color-success) 8%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--color-success) 30%, transparent)',
                  }
                : { background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }
            }
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: habit.color }} />
                <h4
                  className="truncate text-sm font-semibold"
                  style={{
                    color: habit.completedToday ? 'var(--color-success)' : 'var(--color-text-primary)',
                  }}
                >
                  {habit.title}
                </h4>
              </div>
              {habit.completedToday && (
                <span className="material-symbols-outlined text-lg text-success">check_circle</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">
                  {habit.streak > 0 ? t('dashboard.streakDays', { count: habit.streak }) : t('dashboard.startStreak')}
                </p>
                <p className="mt-0.5 text-[10px] text-text-muted">
                  {habit.goalType === 'Daily'
                    ? t('dashboard.dailyGoal')
                    : t('dashboard.goalFormat', { value: habit.goalValue, type: habit.goalType.toLowerCase() })}
                </p>
              </div>
              {!habit.completedToday && (
                <button
                  onClick={() => onMarkDone(habit.id)}
                  className="rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white transition-colors hover:brightness-110"
                >
                  {t('dashboard.markDone')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
