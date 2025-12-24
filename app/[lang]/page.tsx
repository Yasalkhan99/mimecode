'use client';

// This route handles language-prefixed home pages (e.g., /de, /es, /fr)
// It also handles event slugs without language prefix (e.g., /christmas)
// It checks if the lang parameter is a language code or an event slug

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPageSettings } from '@/lib/services/pageSettingsService';
import Home from '../page';
import EventsPage from '../events/page';

const languageSlugs = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ru', 'zh', 'ja'];

// Valid country codes (2-letter ISO codes)
const countryCodes = [
  'US', 'GB', 'UK', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'PT', 'BE', 'CH', 'AT', 
  'SE', 'NO', 'DK', 'FI', 'IE', 'PL', 'IN', 'TH', 'SA', 'AE', 'NZ', 'HK', 'TW', 'KR', 
  'CO', 'PE', 'CL', 'EG', 'GR', 'RU', 'IL', 'BR', 'MX', 'JP', 'CN', 'SG', 'MY', 'ID', 
  'PH', 'VN', 'TR', 'ZA', 'AR'
].map(code => code.toLowerCase());

export default function LangHomePage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as string;
  const [pageType, setPageType] = useState<'home' | 'events' | 'loading' | null>(null);

  useEffect(() => {
    const checkPageType = async () => {
      // Check if it's a language code
      if (languageSlugs.includes(lang)) {
        setPageType('home');
        return;
      }

      // Check if it's a country code (2-letter, uppercase)
      const langUpper = lang.toUpperCase();
      const langLower = lang.toLowerCase();
      if (countryCodes.includes(langLower) || countryCodes.includes(langUpper.toLowerCase())) {
        setPageType('home');
        return;
      }

      // If not a language code, check if it's an event slug
      try {
        const settings = await getPageSettings();
        
        if (settings) {
          if (lang === settings.eventsSlug) {
            setPageType('events');
            document.title = `${settings.eventsNavLabel || 'Events'} - MimeCode`;
            return;
          } else if (lang === settings.blogsSlug) {
            router.push('/blogs');
            return;
          } else if (lang === 'events') {
            setPageType('events');
            document.title = 'Events - MimeCode';
            return;
          } else if (lang === 'blogs') {
            router.push('/blogs');
            return;
          }
        } else {
          if (lang === 'events') {
            setPageType('events');
            return;
          } else if (lang === 'blogs') {
            router.push('/blogs');
            return;
          }
        }
        
        // If it doesn't match anything, redirect to home
        router.push('/');
      } catch (error) {
        console.error('Error checking page type:', error);
        router.push('/');
      }
    };

    checkPageType();
  }, [lang, router]);

  if (pageType === 'loading' || pageType === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ABC443] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (pageType === 'events') {
    return <EventsPage />;
  }

  // Default to home page for language codes
  return <Home />;
}

