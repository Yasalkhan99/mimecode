'use client';

import { useEffect, useState } from 'react';
import QuotaErrorBanner from './QuotaErrorBanner';
import QuotaStatus from './QuotaStatus';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showQuotaError, setShowQuotaError] = useState(false);

  useEffect(() => {
    // Listen for quota errors globally
    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      if (
        message.includes('RESOURCE_EXHAUSTED') || 
        message.includes('Quota exceeded') ||
        message.toLowerCase().includes('quota')
      ) {
        setShowQuotaError(true);
      }
    };

    // Listen for unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason);
      if (
        reason.includes('RESOURCE_EXHAUSTED') || 
        reason.includes('Quota exceeded') ||
        reason.toLowerCase().includes('quota')
      ) {
        setShowQuotaError(true);
      }
    };

    // Override console.error to catch quota errors (but not permission errors)
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      // Only catch quota errors, not permission errors
      if (
        (message.includes('RESOURCE_EXHAUSTED') || 
         message.includes('Quota exceeded') ||
         message.toLowerCase().includes('quota')) &&
        !message.includes('Permission') &&
        !message.includes('permission-denied')
      ) {
        setShowQuotaError(true);
      }
      originalError.apply(console, args);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      console.error = originalError;
    };
  }, []);

  return (
    <>
      <QuotaErrorBanner 
        show={showQuotaError} 
        onClose={() => setShowQuotaError(false)} 
      />
      <QuotaStatus />
      {children}
    </>
  );
}

