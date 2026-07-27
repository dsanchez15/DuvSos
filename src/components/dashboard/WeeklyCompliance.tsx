'use client'

import { Card } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { DashboardMetrics } from '@/types/dashboard'

interface WeeklyComplianceProps {
  metrics: DashboardMetrics | null
}

export default function WeeklyCompliance({ metrics }: WeeklyComplianceProps) {
  const { t } = useAppTranslation()

  return (
    <Card className="dashboard-card mt-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="card-title text-sm font-semibold text-text-primary">{t('dashboard.weeklyCompliance')}</h4>
        {metrics && <span className="text-sm font-bold text-success">{metrics.weeklyCompliance}%</span>}
      </div>
      {metrics ? (
        <div className="space-y-2">
          <div className="h-2.5 w-full rounded-full bg-bg-input">
            <div className="h-2.5 rounded-full bg-success transition-all" style={{ width: `${metrics.weeklyCompliance}%` }} />
          </div>
          <p className="text-xs text-text-muted">
            {metrics.weeklyCompliance >= 80
              ? t('dashboard.compliance.high')
              : metrics.weeklyCompliance >= 50
                ? t('dashboard.compliance.medium')
                : t('dashboard.compliance.low')}
          </p>
        </div>
      ) : (
        <p className="py-2 text-center text-sm text-text-muted">{t('common.loading')}</p>
      )}
    </Card>
  )
}
