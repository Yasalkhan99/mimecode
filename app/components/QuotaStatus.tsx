'use client';

import { useEffect, useState } from 'react';

export default function QuotaStatus() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check for quota errors in console
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('quota exceeded') || message.includes('RESOURCE_EXHAUSTED')) {
        setQuotaExceeded(true);
        setShowBanner(true);
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  if (!showBanner || !quotaExceeded) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg shadow-2xl p-4 border-2 border-yellow-300">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-1">⚠️ Firebase Quota Exceeded</h3>
            <p className="text-xs text-white/90 mb-2">
              Some data may not load. Quota resets automatically in ~24 hours.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBanner(false)}
                className="px-3 py-1 bg-white/20 text-white rounded text-xs font-semibold hover:bg-white/30 transition"
              >
                Got it
              </button>
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-white text-orange-600 rounded text-xs font-semibold hover:bg-gray-100 transition"
              >
                Upgrade
              </a>
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="flex-shrink-0 text-white/80 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

