'use client'

import { useState } from 'react'
import SettingCard from '@/components/SettingCard'
import { Toggle } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'

export default function NotificationsCard() {
  const { t } = useAppTranslation()
  const prefs = [
    { title: t('settings.dailyReminders'), desc: t('settings.dailyRemindersDesc') },
    { title: t('settings.weeklySummary'), desc: t('settings.weeklySummaryDesc') },
    { title: t('settings.soundEffects'), desc: t('settings.soundEffectsDesc') },
  ]
  // Not yet persisted — visual preference state only
  const [enabled, setEnabled] = useState<boolean[]>([true, true, false])

  return (
    <SettingCard>
      <div className="mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">notifications</span>
        <h2 className="text-lg font-semibold">{t('settings.notifications')}</h2>
      </div>
      <div className="space-y-4">
        {prefs.map((pref, i) => (
          <div key={pref.title} className="settings-row-hover flex items-center justify-between rounded-[8px] p-3 transition-colors">
            <div>
              <h3 className="font-medium">{pref.title}</h3>
              <p className="text-xs text-text-muted">{pref.desc}</p>
            </div>
            <Toggle
              checked={enabled[i]}
              onChange={(checked) => setEnabled((prev) => prev.map((v, idx) => (idx === i ? checked : v)))}
              ariaLabel={pref.title}
            />
          </div>
        ))}
      </div>
    </SettingCard>
  )
}
