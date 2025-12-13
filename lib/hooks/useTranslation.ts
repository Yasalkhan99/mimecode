'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getTranslation, TranslationKey } from '@/lib/translations';

export function useTranslation() {
  const { currentLanguage } = useLanguage();
  
  const t = (key: TranslationKey): string => {
    return getTranslation(currentLanguage.code, key);
  };
  
  return { t };
}

