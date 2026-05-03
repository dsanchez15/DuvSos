'use client';

import { useState, useEffect, useCallback } from 'react';
import { setLanguage as setI18nLanguage, getLanguage } from '@/lib/i18n';

export function useLanguage() {
  const [language, setLanguageState] = useState<'en' | 'es'>(getLanguage());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Try to load from user profile
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user?.language) {
          const lang = data.user.language as 'en' | 'es';
          setI18nLanguage(lang);
          setLanguageState(lang);
        }
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, []);

  const setLanguage = useCallback((lang: 'en' | 'es') => {
    setI18nLanguage(lang);
    setLanguageState(lang);
  }, []);

  return { language, setLanguage, isLoaded };
}
