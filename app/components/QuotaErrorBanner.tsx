'use client';

import { useState, useEffect } from 'react';

interface QuotaErrorBannerProps {
  show?: boolean;
  onClose?: () => void;
}

export default function QuotaErrorBanner({ show = false, onClose }: QuotaErrorBannerProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
  }, [show]);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full mx-4 animate-slide-down">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white hover:text-gray-200 transition"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg className="w-12 h-12 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 pr-8">
            <h3 className="text-xl font-bold mb-2">
              ⚠️ Firebase Quota Exceeded
            </h3>
            <p className="text-white/90 mb-4">
              Your Firebase project has reached its daily quota limit. This usually happens due to:
            </p>
            <ul className="space-y-2 mb-4 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="text-yellow-300">•</span>
                <span>Too many database reads/writes in a short time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300">•</span>
                <span>Large bulk imports (like uploading 8345 stores)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300">•</span>
                <span>Using the free Spark plan with limited quota</span>
              </li>
            </ul>

            {/* Solutions */}
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Solutions:
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center font-bold">1</span>
                  <div>
                    <p className="font-semibold">Wait 24 Hours</p>
                    <p className="text-white/70">Quota resets daily at midnight PST</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center font-bold">2</span>
                  <div>
                    <p className="font-semibold">Upgrade to Blaze Plan</p>
                    <p className="text-white/70">Get unlimited quota (pay-as-you-go)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center font-bold">3</span>
                  <div>
                    <p className="font-semibold">Use Batch Import</p>
                    <p className="text-white/70">Import data in smaller batches with delays</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-gray-100 transition font-semibold text-sm"
              >
                Open Firebase Console
              </a>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-semibold text-sm"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Global hook to detect and show quota errors
export function useQuotaErrorDetection() {
  const [showQuotaError, setShowQuotaError] = useState(false);

  useEffect(() => {
    // Listen for quota errors in console
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (
        message.includes('RESOURCE_EXHAUSTED') || 
        message.includes('Quota exceeded') ||
        message.includes('quota')
      ) {
        setShowQuotaError(true);
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return { showQuotaError, setShowQuotaError };
}

