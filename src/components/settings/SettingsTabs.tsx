'use client'

import { useAppTranslation } from '@/components/LanguageProvider'

export type SettingsTabKey = 'general' | 'vistas' | 'admin'

interface SettingsTabsProps {
  activeTab: SettingsTabKey
  onTabChange: (tab: SettingsTabKey) => void
}

const TAB_ICONS: Record<SettingsTabKey, string> = {
  general: 'tune',
  vistas: 'visibility',
  admin: 'admin_panel_settings',
}

export default function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  const { t } = useAppTranslation()

  const tabs: { key: SettingsTabKey; label: string }[] = [
    { key: 'general', label: t('settings.tabs.general') },
    { key: 'vistas', label: t('settings.tabs.vistas') },
    { key: 'admin', label: t('settings.tabs.admin') },
  ]

  return (
    <div className="flex gap-2 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`-mb-[1px] flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
            activeTab === tab.key
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <span className="material-symbols-outlined text-lg">{TAB_ICONS[tab.key]}</span>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
