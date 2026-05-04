'use client'

import { createContext, useContext } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { t } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'

interface TranslationContextType {
  t: typeof t
  language: Language
  setLanguage: (lang: Language) => void
}

const TranslationContext = createContext<TranslationContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useTranslation()
  return (
    <TranslationContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useAppTranslation() {
  const ctx = useContext(TranslationContext)
  if (!ctx) throw new Error('useAppTranslation must be used within LanguageProvider')
  return ctx
}