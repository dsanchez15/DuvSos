'use client'

import SettingCard from '@/components/SettingCard'
import { useAppTranslation } from '@/components/LanguageProvider'

export default function DangerZoneCard() {
  const { t } = useAppTranslation()

  return (
    <SettingCard>
      <div className="mb-4 flex items-center gap-2 text-danger">
        <span className="material-symbols-outlined">report_problem</span>
        <h2 className="text-lg font-semibold">{t('settings.dangerZone')}</h2>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-medium text-text-primary">{t('settings.resetAllData')}</h3>
          <p className="text-xs text-text-muted">{t('settings.resetAllDataDesc')}</p>
        </div>
        <button className="rounded-[8px] border border-danger px-4 py-2 font-medium text-danger transition-all hover:bg-danger hover:text-white">
          {t('settings.resetAccount')}
        </button>
      </div>
    </SettingCard>
  )
}
