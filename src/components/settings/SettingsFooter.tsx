'use client'

import { Button } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'

interface SettingsFooterProps {
  isDirty: boolean
  onSave: () => void
  onDiscard: () => void
}

export default function SettingsFooter({ isDirty, onSave, onDiscard }: SettingsFooterProps) {
  const { t } = useAppTranslation()

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t border-primary/10 p-4 backdrop-blur-md lg:left-64 lg:px-10"
      style={{ background: 'color-mix(in srgb, var(--color-bg-surface) 80%, transparent)' }}
    >
      <p className={`text-sm italic text-text-muted ${isDirty ? 'opacity-100' : 'opacity-0'}`}>
        {t('settings.unsavedChanges')}
      </p>
      <div className="ml-auto flex gap-3">
        <Button variant="secondary" onClick={onDiscard} className="border border-border px-6">
          {t('settings.discard')}
        </Button>
        <Button onClick={onSave} className="px-8 font-semibold shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-sm">save</span>
          {t('settings.saveChanges')}
        </Button>
      </div>
    </footer>
  )
}
