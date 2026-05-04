'use client'

import { useSyncExternalStore, useCallback } from 'react'
import { setLanguage as setI18nLanguage, getLanguage, subscribe, type Language } from '@/lib/i18n'

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, getLanguage)
  const isLoaded = true

  const setLanguage = useCallback((lang: Language) => {
    setI18nLanguage(lang)
  }, [])

  return { language, setLanguage, isLoaded }
}