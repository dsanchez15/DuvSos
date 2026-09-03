'use client'

import { useSyncExternalStore } from 'react'
import { getLanguage, getServerLanguage, setLanguage, subscribe } from '@/lib/i18n'

export function useTranslation() {
  const language = useSyncExternalStore(subscribe, getLanguage, getServerLanguage)
  return { language, setLanguage }
}