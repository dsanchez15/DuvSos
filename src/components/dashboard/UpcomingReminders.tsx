'use client'

import { Badge, Card } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { UpcomingReminder } from '@/types/dashboard'

interface UpcomingRemindersProps {
  reminders: UpcomingReminder[]
  onMarkDone: (id: number) => void
}

export default function UpcomingReminders({ reminders, onMarkDone }: UpcomingRemindersProps) {
  const { t } = useAppTranslation()

  const badgeVariant = (daysUntil: number) =>
    daysUntil <= 1 ? 'danger' : daysUntil <= 3 ? 'warning' : 'neutral'

  return (
    <Card padding="lg" className="dashboard-card">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="card-title font-semibold text-text-primary">{t('dashboard.upcomingReminders')}</h4>
        <span className="text-xs text-text-muted">{t('dashboard.next14Days')}</span>
      </div>
      <div className="max-h-[360px] space-y-3 overflow-y-auto">
        {reminders.length === 0 && (
          <p className="py-4 text-center text-sm text-text-muted">{t('dashboard.noUpcomingReminders')}</p>
        )}
        {reminders.map((r) => (
          <div key={String(r.id)} className="flex items-center gap-3 rounded-[8px] border border-border p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info/15 text-info">
              <span className="material-symbols-outlined text-sm">schedule</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">{r.title}</p>
              <p className="text-xs text-text-muted">{r.dueDate}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={badgeVariant(r.daysUntil)}>
                {r.daysUntil === 0 ? t('dashboard.todayReminder') : t('dashboard.daysUntil', { count: r.daysUntil })}
              </Badge>
              <button
                onClick={() => {
                  const numericId = typeof r.id === 'string' ? parseInt(r.id.split('-')[0], 10) : r.id
                  onMarkDone(numericId)
                }}
                className="whitespace-nowrap rounded bg-info/10 px-2 py-0.5 text-[10px] text-info hover:bg-info/20"
              >
                {t('common.done')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
