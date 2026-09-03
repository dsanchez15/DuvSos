'use client'

import SettingCard from '@/components/SettingCard'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { StudySettings } from '@/types/study'

interface StudySectionCardProps {
  settings: StudySettings
  onChange: (settings: StudySettings, persist: boolean) => void
}

export default function StudySectionCard({ settings, onChange }: StudySectionCardProps) {
  const { t } = useAppTranslation()

  return (
    <SettingCard>
      <div className="mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">school</span>
        <h2 className="text-lg font-semibold">{t('settings.studySection')}</h2>
      </div>
      <div className="space-y-6">
        <div className="settings-row-hover flex items-center justify-between rounded-[8px] p-3 transition-colors">
          <div>
            <h3 className="font-medium">{t('settings.maxQuestionsPerReview')}</h3>
            <p className="text-xs text-text-muted">{t('settings.maxQuestionsPerReviewDesc')}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-8 text-center text-sm font-bold text-primary">
              {settings.maxQuestionsPerReview}
            </span>
            <input
              type="range"
              min={20}
              max={50}
              step={1}
              value={settings.maxQuestionsPerReview}
              onChange={(e) =>
                onChange({ ...settings, maxQuestionsPerReview: parseInt(e.target.value) }, false)
              }
              aria-label={t('settings.maxQuestionsPerReview')}
              className="w-32 accent-primary"
            />
          </div>
        </div>
      </div>
    </SettingCard>
  )
}
