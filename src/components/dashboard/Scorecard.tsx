'use client'

import { Card } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { DashboardMetrics } from '@/types/dashboard'

interface ScorecardProps {
  metrics: DashboardMetrics | null
}

export default function Scorecard({ metrics }: ScorecardProps) {
  const { t } = useAppTranslation()

  const cells = metrics
    ? [
        { value: metrics.overallStreak, valueClass: 'text-primary', label: t('dashboard.dayStreak') },
        { value: metrics.activeProjects, valueClass: 'text-success', label: t('dashboard.activeProjects') },
        { value: metrics.pendingTasks, valueClass: 'text-warning', label: t('dashboard.pendingTasks') },
        { value: `${metrics.weeklyCompliance}%`, valueClass: 'text-info', label: t('dashboard.complianceLabel') },
      ]
    : []

  return (
    <Card padding="lg" className="dashboard-card">
      <h4 className="card-title mb-4 font-semibold text-text-primary">{t('dashboard.scorecard')}</h4>
      {metrics ? (
        <div className="space-y-4">
          {[0, 2].map((row) => (
            <div key={row} className="flex items-center gap-4">
              {cells.slice(row, row + 2).map((cell) => (
                <div key={cell.label} className="flex-1 rounded-[8px] bg-bg-input p-3 text-center">
                  <p className={`text-2xl font-bold ${cell.valueClass}`}>{cell.value}</p>
                  <p className="mt-1 text-[10px] uppercase text-text-muted">{cell.label}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-text-muted">{t('dashboard.loadingMetrics')}</p>
      )}
    </Card>
  )
}
