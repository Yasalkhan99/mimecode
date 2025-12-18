'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', slug: 'en', countryCode: 'US' }, // English - show USA stores
  { code: 'es', name: 'Español', flag: '🇪🇸', slug: 'es', countryCode: 'ES' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', slug: 'fr', countryCode: 'FR' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', slug: 'de', countryCode: 'DE' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', slug: 'it', countryCode: 'IT' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', slug: 'pt', countryCode: 'PT' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', slug: 'nl', countryCode: 'NL' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', slug: 'ru', countryCode: 'RU' },
  { code: 'zh', name: '中文', flag: '🇨🇳', slug: 'zh', countryCode: 'CN' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', slug: 'ja', countryCode: 'JP' },
];

// Helper function to get country code from language code or slug
export function getCountryCodeFromLanguage(langCodeOrSlug: string): string | null {
  // Normalize 'de' to 'du' for German (both are valid)
  const normalized = langCodeOrSlug === 'de' ? 'du' : langCodeOrSlug;
  const language = languages.find(lang => lang.code === normalized || lang.slug === normalized || lang.code === langCodeOrSlug || lang.slug === langCodeOrSlug);
  return language?.countryCode || null;
}

export interface LanguageContextType {
  currentLanguage: typeof languages[0];
  setLanguage: (languageCode: string) => void;
  getLocalizedPath: (path: string) => string;
  removeLanguageFromPath: (path: string) => string;
  getCountryCode: () => string | null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentLanguage, setCurrentLanguage] = useState(languages[0]);

  // Extract language from pathname on mount and route changes
  useEffect(() => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];
    
    // Normalize 'de' to 'du' for German (both are valid)
    const normalizedSegment = firstSegment === 'de' ? 'du' : firstSegment;
    
    // Check if first segment is a language code
    const language = languages.find(lang => lang.slug === normalizedSegment);
    if (language) {
      setCurrentLanguage(language);
    } else {
      // Default to English if no language in path
      setCurrentLanguage(languages[0]);
    }
  }, [pathname]);

  const setLanguage = (languageCode: string) => {
    const language = languages.find(lang => lang.code === languageCode || lang.slug === languageCode);
    if (!language) return;

    setCurrentLanguage(language);
    
    // Get current path without language prefix
    const pathWithoutLang = removeLanguageFromPath(pathname);
    
    // Build new path with language prefix
    const newPath = language.slug === 'en' 
      ? pathWithoutLang || '/'
      : `/${language.slug}${pathWithoutLang === '/' ? '' : pathWithoutLang}`;
    
    // Navigate to new path
    router.push(newPath);
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', language.code);
    }
  };

  const removeLanguageFromPath = (path: string): string => {
    const pathSegments = path.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];
    
    // Normalize 'de' to 'du' for German (both are valid)
    const normalizedSegment = firstSegment === 'de' ? 'du' : firstSegment;
    
    // Check if first segment is a language code
    const isLanguage = languages.some(lang => lang.slug === normalizedSegment || lang.slug === firstSegment);
    
    if (isLanguage) {
      // Remove language prefix
      const pathWithoutLang = '/' + pathSegments.slice(1).join('/');
      return pathWithoutLang === '/' ? '/' : pathWithoutLang;
    }
    
    return path;
  };

  const getLocalizedPath = (path: string): string => {
    // Remove any existing language prefix
    const cleanPath = removeLanguageFromPath(path);
    
    // Add current language prefix (skip for English)
    if (currentLanguage.slug === 'en') {
      return cleanPath;
    }
    
    return `/${currentLanguage.slug}${cleanPath === '/' ? '' : cleanPath}`;
  };

  const getCountryCode = (): string | null => {
    return currentLanguage.countryCode || null;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, getLocalizedPath, removeLanguageFromPath, getCountryCode }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

