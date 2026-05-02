'use client'

import { DailyProgress } from '@/types/goal'

interface WeekCalendarProps {
  entries: DailyProgress[]
  weekStart: Date
}

export default function WeekCalendar({ entries, weekStart }: WeekCalendarProps) {
  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    days.push(date)
  }

  const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const getEntryForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return entries.find(e => {
      const entryDate = typeof e.date === 'string' ? new Date(e.date) : e.date
      return entryDate.toISOString().split('T')[0] === dateStr
    })
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((date, i) => {
        const entry = getEntryForDate(date)
        const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]

        return (
          <div
            key={i}
            className={`p-2 rounded-lg border text-center ${
              isToday ? 'ring-2 ring-primary/30' : ''
            }`}
            style={{
              background: entry ? 'var(--color-bg-surface)' : 'transparent',
              borderColor: entry ? 'var(--color-border)' : 'transparent',
            }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {dayLabels[i]}
            </p>
            <p className="text-sm font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
              {date.getDate()}
            </p>
            <div className="mt-2 space-y-1">
              {entry?.gymCompleted && (
                <div className="w-full h-1.5 rounded-full bg-emerald-500" title="Gym" />
              )}
              {entry?.sleepHours && (
                <div className="w-full h-1.5 rounded-full bg-blue-500" title={`Sueño: ${entry.sleepHours}h`} />
              )}
              {(entry?.studyHours || 0) + (entry?.workHours || 0) > 0 && (
                <div
                  className="w-full h-1.5 rounded-full bg-amber-500"
                  title={`Trabajo: ${(entry?.studyHours || 0) + (entry?.workHours || 0)}h`}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
