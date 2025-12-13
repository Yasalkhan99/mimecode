'use client';

import { useLanguage, languages } from '@/lib/contexts/LanguageContext';

// Country code mapping for languages
const countryCodes: { [key: string]: string } = {
  en: 'GB',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  it: 'IT',
  pt: 'PT',
  nl: 'NL',
  ru: 'RU',
  zh: 'CN',
  ja: 'JP',
};

export default function LanguageSelector() {
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <div className="mt-6 md:mt-8 flex justify-center">
      <div className="bg-black rounded-full py-1.5 px-2 overflow-x-auto max-w-full">
        <div className="flex items-center gap-1.5 min-w-max">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => setLanguage(language.code)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                currentLanguage.code === language.code
                  ? 'bg-[#FFE019] text-black hover:bg-[#f5d600]'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              <span className="text-sm">{language.flag}</span>
              <span>{countryCodes[language.code] || 'GB'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

