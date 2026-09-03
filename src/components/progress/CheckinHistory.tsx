'use client'

import { Badge, Card } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import { fatigueLabel, fatigueBadgeVariant } from './fatigue'
import type { WeeklyCheckIn } from '@/types/goal'

interface CheckinHistoryProps {
  checkins: WeeklyCheckIn[]
}

export default function CheckinHistory({ checkins }: CheckinHistoryProps) {
  const { t, language: lang } = useAppTranslation()

  return (
    <Card padding="lg" className="dashboard-card">
      <h3 className="mb-4 font-semibold text-text-primary">{t('progress.history')}</h3>

      {checkins.length === 0 ? (
        <p className="py-4 text-center text-sm text-text-muted">{t('progress.noCheckins')}</p>
      ) : (
        <div className="space-y-4">
          {checkins.slice(0, 8).map((checkin) => (
            <div key={checkin.id} className="rounded-[8px] border border-border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  {t('progress.weekOf')}{' '}
                  {new Date(checkin.weekStartDate).toLocaleDateString(lang === 'es' ? 'es' : 'en')}
                </span>
                <Badge variant={fatigueBadgeVariant(checkin.fatigueLevel)}>
                  {fatigueLabel(checkin.fatigueLevel, t)}
                </Badge>
              </div>
              {checkin.deviations && (
                <p className="mb-1 text-xs text-text-secondary">
                  <span className="font-medium">{t('progress.deviations')}:</span> {checkin.deviations}
                </p>
              )}
              {checkin.adjustmentNotes && (
                <p className="text-xs text-text-secondary">
                  <span className="font-medium">{t('progress.adjustments')}:</span> {checkin.adjustmentNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
