'use client'

import SettingCard from '@/components/SettingCard'
import { Toggle } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { FeatureFlag, FeatureFlags } from '@/hooks/useFeatureFlags'

const FEATURE_ORDER: FeatureFlag[] = [
  'habits',
  'goals',
  'checklists',
  'reminders',
  'progress',
  'checkin',
  'study',
]

interface FeatureFlagsCardProps {
  flags: FeatureFlags
  onChange: (key: FeatureFlag, value: boolean) => void
}

export default function FeatureFlagsCard({ flags, onChange }: FeatureFlagsCardProps) {
  const { t } = useAppTranslation()

  return (
    <SettingCard>
      <div className="mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">tune</span>
        <h2 className="text-lg font-semibold">{t('settings.featureFlags')}</h2>
      </div>
      <div className="space-y-2">
        {FEATURE_ORDER.map((key) => (
          <div
            key={key}
            className="settings-row-hover flex items-center justify-between rounded-[8px] p-3 transition-colors"
          >
            <div>
              <h3 className="font-medium">{t(`settings.features.${key}.title`)}</h3>
              <p className="text-xs text-text-muted">{t(`settings.features.${key}.description`)}</p>
            </div>
            <Toggle
              checked={flags[key]}
              onChange={(checked) => onChange(key, checked)}
              ariaLabel={t(`settings.features.${key}.title`)}
            />
          </div>
        ))}
      </div>
    </SettingCard>
  )
}
