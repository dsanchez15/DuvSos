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

  const formatTime = (time: string) => {
    const [h, m] = time.split(':')
    return `${h}:${m}`
  }

  return (
    <div className="space-y-3">
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

      {(entries.some(e => e.plannedTime || e.actualTime)) && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <h4 className="text-xs font-medium mb-3" style={{ color: 'var(--color-text-muted)' }}>
            HORA PLANEADA vs REAL
          </h4>
          <div className="space-y-2">
            {entries.filter(e => e.plannedTime || e.actualTime).map(entry => {
              const entryDate = typeof entry.date === 'string' ? new Date(entry.date) : entry.date
              const planned = entry.plannedTime?.split(':').map(Number) || []
              const actual = entry.actualTime?.split(':').map(Number) || []
              const plannedMins = planned[0] * 60 + (planned[1] || 0)
              const actualMins = actual[0] * 60 + (actual[1] || 0)
              const diff = actualMins - plannedMins
              const isLate = diff > 0

              return (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {entryDate.toLocaleDateString('es', { weekday: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-2">
                    {entry.plannedTime && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                        {formatTime(entry.plannedTime)}
                      </span>
                    )}
                    {entry.actualTime && (
                      <>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>→</span>
                        <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                          isLate ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {formatTime(entry.actualTime)}
                        </span>
                      </>
                    )}
                    {entry.plannedTime && entry.actualTime && (
                      <span className={`text-xs font-medium ${isLate ? 'text-red-500' : 'text-emerald-500'}`}>
                        {isLate ? '+' : ''}{diff}min
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}