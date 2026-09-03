'use client'

import SettingCard from '@/components/SettingCard'
import NumberSelector from './NumberSelector'
import { useAppTranslation } from '@/components/LanguageProvider'

interface DashboardConfigCardProps {
  cardLimit: number
  checklistAlertDays: number
  onCardLimitChange: (value: number) => void
  onAlertDaysChange: (value: number) => void
}

export default function DashboardConfigCard({
  cardLimit,
  checklistAlertDays,
  onCardLimitChange,
  onAlertDaysChange,
}: DashboardConfigCardProps) {
  const { t } = useAppTranslation()

  const rows = [
    {
      title: t('settings.cardsToDisplay'),
      desc: t('settings.cardsToDisplayDesc'),
      options: [2, 4, 6, 8],
      value: cardLimit,
      onChange: onCardLimitChange,
    },
    {
      title: t('settings.checklistAlert'),
      desc: t('settings.checklistAlertDesc'),
      options: [0, 1, 2, 3, 4, 5],
      value: checklistAlertDays,
      onChange: onAlertDaysChange,
    },
  ]

  return (
    <SettingCard>
      <div className="mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">dashboard_customize</span>
        <h2 className="text-lg font-semibold">{t('settings.dashboardConfig')}</h2>
      </div>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.title} className="settings-row-hover flex items-center justify-between rounded-[8px] p-3 transition-colors">
            <div>
              <h3 className="font-medium">{row.title}</h3>
              <p className="text-xs text-text-muted">{row.desc}</p>
            </div>
            <NumberSelector options={row.options} value={row.value} onChange={row.onChange} ariaLabel={row.title} />
          </div>
        ))}
      </div>
    </SettingCard>
  )
}
