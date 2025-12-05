'use client';

import { useEffect, useState } from 'react';
import QuotaErrorBanner from './QuotaErrorBanner';
import QuotaStatus from './QuotaStatus';
import CookieConsent from './CookieConsent';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showQuotaError, setShowQuotaError] = useState(false);

  useEffect(() => {
    // Intercept and suppress favicon network errors before they're logged
    const suppressFaviconErrors = () => {
      // Override Image constructor to add error handlers automatically
      const OriginalImage = window.Image;
      window.Image = function(...args: any[]) {
        const img = new OriginalImage(...args);
        const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')?.set;
        if (originalSrcSetter) {
          Object.defineProperty(img, 'src', {
            set: function(value: string) {
              // ALWAYS allow the request to go through - just add error handler to suppress console errors
              if (value && (
                value.includes('gstatic.com/faviconV2') ||
                value.includes('google.com/s2/favicons') ||
                (value.includes('favicon') && (value.includes('gstatic.com') || value.includes('google.com')))
              )) {
                // Add error handler to suppress console errors (but allow request to complete)
              img.onerror = function(e) {
                // Suppress error but don't prevent the request
                if (typeof e !== 'string' && e && typeof e === 'object') {
                  if ('preventDefault' in e && typeof e.preventDefault === 'function') {
                    e.preventDefault();
                  }
                  if ('stopPropagation' in e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }
                return false;
              };
              }
              // ALWAYS set the src - never block the request
              originalSrcSetter.call(this, value);
            },
            get: function() {
              return (this as any)._src || '';
            },
            configurable: true
          });
        }
        return img;
      } as any;
      
      // Also intercept existing images via MutationObserver - optimized
      let observerTimeout: NodeJS.Timeout | null = null;
      const pendingImages = new Set<HTMLImageElement>();
      
      const processPendingImages = () => {
        pendingImages.forEach((img) => {
          // Only add error handlers for Google favicon services - don't block anything
          if (img.src && (
            img.src.includes('gstatic.com/faviconV2') ||
            img.src.includes('google.com/s2/favicons') ||
            (img.src.includes('favicon') && (img.src.includes('gstatic.com') || img.src.includes('google.com')))
          )) {
            // Add error handler to suppress console errors (request already made)
            img.onerror = function(e) {
              if (typeof e !== 'string' && e && typeof e === 'object') {
                if ('preventDefault' in e && typeof e.preventDefault === 'function') {
                  e.preventDefault();
                }
                if ('stopPropagation' in e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }
              return false;
            };
          }
        });
        pendingImages.clear();
      };
      
      const observer = new MutationObserver((mutations) => {
        // Batch processing to reduce overhead
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const element = node as HTMLElement;
              // Check if it's an img or contains imgs
              const imgs = element.tagName === 'IMG' 
                ? [element as HTMLImageElement]
                : element.querySelectorAll('img');
              
              imgs.forEach((img) => {
                pendingImages.add(img);
              });
            }
          });
        });
        
        // Debounce processing
        if (observerTimeout) {
          clearTimeout(observerTimeout);
        }
        observerTimeout = setTimeout(processPendingImages, 50);
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      return () => {
        window.Image = OriginalImage;
        observer.disconnect();
      };
    };
    
    const cleanupImageOverride = suppressFaviconErrors();
    
    // Listen for quota errors globally
    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      const source = (event.target as any)?.src || (event.target as any)?.href || '';
      const filename = event.filename || '';
      
      // Suppress favicon-related errors
      if (
        source.includes('gstatic.com/faviconV2') ||
        source.includes('google.com/s2/favicons') ||
        filename.includes('gstatic.com/faviconV2') ||
        filename.includes('faviconV2') ||
        message.includes('favicon') ||
        (event.target && (event.target as HTMLElement).tagName === 'IMG' && source.includes('favicon'))
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      
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

    // Override console methods to suppress favicon errors and catch quota errors
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    
    const isFaviconError = (args: any[]): boolean => {
      const message = args.join(' ').toLowerCase();
      const hasFaviconUrl = args.some(arg => {
        if (typeof arg === 'string') {
          return arg.includes('gstatic.com/faviconV2') || 
                 arg.includes('faviconV2') || 
                 arg.includes('faviconv2') ||
                 arg.includes('google.com/s2/favicons') ||
                 (arg.includes('favicon') && arg.includes('gstatic.com'));
        }
        // Check if it's an Error object with favicon in message
        if (arg && typeof arg === 'object' && 'message' in arg) {
          const errorMsg = String(arg.message || '').toLowerCase();
          return errorMsg.includes('favicon') || errorMsg.includes('gstatic.com/faviconv2');
        }
        return false;
      });
      
      return (
        message.includes('gstatic.com/faviconv2') ||
        message.includes('gstatic.com/favicon') ||
        message.includes('faviconv2') ||
        message.includes('t2.gstatic.com') ||
        message.includes('t3.gstatic.com') ||
        message.includes('t4.gstatic.com') ||
        message.includes('t5.gstatic.com') ||
        (message.includes('favicon') && (message.includes('failed to load') || message.includes('404') || message.includes('not found') || message.includes('error'))) ||
        (message.includes('get') && message.includes('gstatic.com') && (message.includes('404') || message.includes('failed'))) ||
        (message.includes('404') && message.includes('gstatic.com')) ||
        (message.includes('404') && message.includes('favicon')) ||
        hasFaviconUrl
      );
    };
    
    // Check for browser compatibility/performance/security warnings to suppress
    const isBrowserWarning = (args: any[]): boolean => {
      const message = args.join(' ').toLowerCase();
      
      // Suppress CSS compatibility warnings
      if (
        message.includes('webkit-text-size-adjust') ||
        message.includes('backdrop-filter') ||
        message.includes('mask-image') ||
        message.includes('user-select') ||
        message.includes('scrollbar-width') ||
        message.includes('text-wrap') ||
        message.includes('not supported by')
      ) {
        return true;
      }
      
      // Suppress content-type header warnings
      if (
        message.includes('content-type') &&
        (message.includes('charset') || message.includes('media type'))
      ) {
        return true;
      }
      
      // Suppress fetchpriority warnings
      if (
        message.includes('fetchpriority') ||
        message.includes('img[fetchpriority]') ||
        message.includes('link[fetchpriority]')
      ) {
        return true;
      }
      
      // Suppress cache-control warnings
      if (
        message.includes('cache-control') &&
        (message.includes('must-revalidate') || message.includes('no-store') || message.includes('not recommended'))
      ) {
        return true;
      }
      
      // Suppress security header warnings
      if (
        message.includes('x-content-type-options') ||
        message.includes('x-frame-options') ||
        message.includes('pragma') ||
        message.includes('content-security-policy') && message.includes('unneeded') ||
        message.includes('x-xss-protection')
      ) {
        return true;
      }
      
      // Suppress response header warnings
      if (
        message.includes('response should not include') ||
        message.includes('response should include') ||
        message.includes('header should not be used')
      ) {
        return true;
      }
      
      return false;
    };
    
    console.error = (...args: any[]) => {
      // Suppress favicon-related errors
      if (isFaviconError(args)) {
        return; // Silently ignore favicon errors
      }
      
      // Suppress browser compatibility/performance/security warnings
      if (isBrowserWarning(args)) {
        return; // Silently ignore browser warnings
      }
      
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
    
    // Also suppress favicon warnings and browser warnings
    console.warn = (...args: any[]) => {
      if (isFaviconError(args)) {
        return; // Silently ignore favicon warnings
      }
      
      // Suppress browser compatibility/performance/security warnings
      if (isBrowserWarning(args)) {
        return; // Silently ignore browser warnings
      }
      
      originalWarn.apply(console, args);
    };
    
    // Also suppress favicon logs and browser warnings (React dev mode uses console.log for some network errors)
    console.log = (...args: any[]) => {
      if (isFaviconError(args)) {
        return; // Silently ignore favicon logs
      }
      
      // Suppress browser compatibility/performance/security warnings
      if (isBrowserWarning(args)) {
        return; // Silently ignore browser warnings
      }
      
      originalLog.apply(console, args);
    };

    // Suppress image load errors for favicons (but allow ALL requests to go through)
    const handleImageError = (event: Event) => {
      const target = event.target as HTMLImageElement;
      if (target && target.src) {
        // Only suppress console errors for Google favicon services when they fail
        // ALLOW all requests to complete - just suppress error logging
        if (
          target.src.includes('gstatic.com/faviconV2') ||
          target.src.includes('google.com/s2/favicons') ||
          (target.src.includes('favicon') && (target.src.includes('gstatic.com') || target.src.includes('google.com')))
        ) {
          // Suppress error propagation to console, but request already completed/failed
          event.stopPropagation();
          event.preventDefault();
          return false;
        }
      }
    };
    
    // Intercept network errors in the console (but don't block requests)
    // This catches 404 errors from network requests
    const originalConsoleGroup = console.group;
    const originalConsoleGroupEnd = console.groupEnd;
    
    // Suppress network error groups for favicon requests
    console.group = function(...args: any[]) {
      const message = args.join(' ').toLowerCase();
      if (message.includes('favicon') || message.includes('gstatic.com/faviconv2')) {
        return; // Don't show group for favicon errors
      }
      return originalConsoleGroup.apply(console, args);
    };
    
    console.groupEnd = function(...args: any[]) {
      // Allow groupEnd to proceed normally
      return originalConsoleGroupEnd.apply(console, args);
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleRejection);
    document.addEventListener('error', handleImageError, true);

    return () => {
      cleanupImageOverride?.();
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleRejection);
      document.removeEventListener('error', handleImageError, true);
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
      console.group = originalConsoleGroup;
      console.groupEnd = originalConsoleGroupEnd;
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
      <CookieConsent />
    </>
  );
}

