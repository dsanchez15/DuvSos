'use client'

import { Badge } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { DailyProgress, Goal } from '@/types/goal'

interface ActivityListProps {
  entries: DailyProgress[]
  goals: Goal[]
}

export default function ActivityList({ entries, goals }: ActivityListProps) {
  const { t, language: lang } = useAppTranslation()

  if (entries.length === 0) return null

  return (
    <div className="mt-6 border-t border-border pt-6">
      <h4 className="mb-3 font-semibold text-text-primary">{t('progress.loggedActivities')}</h4>
      <div className="space-y-2">
        {entries.map((entry) => {
          const entryDate = typeof entry.date === 'string' ? new Date(entry.date) : entry.date
          const goal = goals.find((g) => g.id === entry.goalId)
          return (
            <div key={entry.id} className="flex items-center justify-between rounded-[8px] border border-border p-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-text-muted">
                  {entryDate.toLocaleDateString(lang === 'es' ? 'es' : 'en', { weekday: 'short', day: 'numeric' })}
                </span>
                {goal && <span className="text-sm font-medium text-text-primary">{goal.title}</span>}
              </div>
              <div className="flex items-center gap-2">
                {entry.workHours ? <Badge variant="primary">{entry.workHours.toFixed(1)}h</Badge> : null}
                {entry.studyHours ? <Badge variant="info">{entry.studyHours.toFixed(1)}h</Badge> : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
