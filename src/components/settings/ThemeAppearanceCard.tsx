'use client'

import SettingCard from '@/components/SettingCard'
import { useAppTranslation } from '@/components/LanguageProvider'

type ThemeMode = 'light' | 'dark' | 'system'
type LangCode = 'en' | 'es'

interface ThemeAppearanceCardProps {
  theme: ThemeMode
  selectedLang: LangCode
  onThemeChange: (theme: ThemeMode) => void
  onLanguageChange: (lang: LangCode) => void
}

const LANGUAGES: { code: LangCode; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

const THEME_MODES: { mode: ThemeMode; icon: string }[] = [
  { mode: 'light', icon: 'light_mode' },
  { mode: 'dark', icon: 'dark_mode' },
  { mode: 'system', icon: 'settings_brightness' },
]

export default function ThemeAppearanceCard({
  theme,
  selectedLang,
  onThemeChange,
  onLanguageChange,
}: ThemeAppearanceCardProps) {
  const { t } = useAppTranslation()

  const selectedClasses = 'border-primary bg-primary/5'
  const idleClasses = 'border-primary/10 hover:border-primary/30'

  return (
    <SettingCard>
      <div className="mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">palette</span>
        <h2 className="text-lg font-semibold">{t('settings.themeAppearance')}</h2>
      </div>
      <div className="space-y-6">
        <div>
          <label className="mb-3 block text-sm font-medium text-text-secondary">{t('settings.language')}</label>
          <div className="grid grid-cols-2 gap-4">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => onLanguageChange(l.code)}
                className={`flex items-center gap-3 rounded-[8px] border-2 p-4 transition-all ${
                  selectedLang === l.code ? selectedClasses : idleClasses
                }`}
              >
                <span className="text-2xl">{l.flag}</span>
                <span className="text-sm font-medium">{l.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-3 block text-sm font-medium text-text-secondary">{t('settings.displayMode')}</label>
          <div className="grid grid-cols-3 gap-4">
            {THEME_MODES.map(({ mode, icon }) => (
              <button
                key={mode}
                onClick={() => onThemeChange(mode)}
                className={`flex flex-col items-center gap-2 rounded-[8px] border-2 p-4 transition-all ${
                  theme === mode ? selectedClasses : idleClasses
                }`}
              >
                <span
                  className={`material-symbols-outlined ${theme === mode ? 'text-primary' : ''}`}
                  style={theme !== mode ? { color: 'var(--color-text-muted)' } : undefined}
                >
                  {icon}
                </span>
                <span className="text-sm font-medium capitalize">{mode}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </SettingCard>
  )
}
