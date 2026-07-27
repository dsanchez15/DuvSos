'use client'

import { Card } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { PerformanceStats } from '@/types/dashboard'

interface PerformanceSectionProps {
  stats: PerformanceStats | null
}

function StatIcon({ icon, iconClass }: { icon: string; iconClass: string }) {
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClass}`}>
      <span className="material-symbols-outlined text-sm">{icon}</span>
    </div>
  )
}

export default function PerformanceSection({ stats }: PerformanceSectionProps) {
  const { t, language } = useAppTranslation()

  const cards = [
    { icon: 'local_fire_department', iconClass: 'bg-warning/15 text-warning', value: stats?.gymStreak ?? 0, suffix: '', label: t('dashboard.gymStreak') },
    { icon: 'schedule', iconClass: 'bg-info/15 text-info', value: stats?.hoursThisWeek ?? 0, suffix: 'h', label: t('dashboard.thisWeek') },
    { icon: 'track_changes', iconClass: 'bg-success/15 text-success', value: stats?.totalGoals ?? 0, suffix: '', label: t('dashboard.activeGoals') },
  ]

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          {t('dashboard.performancePlan')}
        </h3>
        <a href="/goals" className="rounded-lg px-2 py-1 text-xs text-text-muted hover:bg-primary/10">
          {t('dashboard.viewAll')}
        </a>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.icon} className="dashboard-card">
            <div className="flex items-center gap-3">
              <StatIcon icon={card.icon} iconClass={card.iconClass} />
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {card.value}
                  {card.suffix}
                </p>
                <p className="text-xs text-text-muted">{card.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {stats?.nextMilestones && stats.nextMilestones.length > 0 && (
        <Card className="dashboard-card mt-4">
          <h4 className="mb-3 text-sm font-semibold text-text-primary">{t('dashboard.upcomingMilestones')}</h4>
          <div className="space-y-2">
            {stats.nextMilestones.slice(0, 3).map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg bg-bg-input p-2">
                <span className="material-symbols-outlined text-sm text-text-muted">flag</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{m.title}</p>
                  <p className="truncate text-xs text-text-muted">{m.goal.title}</p>
                </div>
                <span className="text-xs text-text-muted">
                  {m.targetDate
                    ? new Date(m.targetDate).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </section>
  )
}
