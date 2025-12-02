'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Cookie preferences state
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already accepted/rejected cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    localStorage.setItem('cookieConsent', JSON.stringify(allPreferences));
    localStorage.setItem('cookieConsentTimestamp', new Date().toISOString());
    setShowBanner(false);
    setShowSettings(false);
    
    // Here you would typically initialize analytics/marketing scripts
    initializeScripts(allPreferences);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    localStorage.setItem('cookieConsentTimestamp', new Date().toISOString());
    setShowBanner(false);
    setShowSettings(false);
    
    // Initialize only selected scripts
    initializeScripts(preferences);
  };

  const handleRejectAll = () => {
    const minimalPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    localStorage.setItem('cookieConsent', JSON.stringify(minimalPreferences));
    localStorage.setItem('cookieConsentTimestamp', new Date().toISOString());
    setShowBanner(false);
    setShowSettings(false);
  };

  const initializeScripts = (prefs: typeof preferences) => {
    // Add your analytics/marketing script initialization here
    if (prefs.analytics) {
      // Initialize Google Analytics, etc.
      console.log('Analytics cookies enabled');
    }
    if (prefs.marketing) {
      // Initialize marketing pixels, etc.
      console.log('Marketing cookies enabled');
    }
    if (prefs.functional) {
      // Initialize functional cookies
      console.log('Functional cookies enabled');
    }
  };

  const togglePreference = (key: keyof typeof preferences) => {
    if (key === 'necessary') return; // Can't toggle necessary cookies
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            onClick={() => !showSettings && setShowBanner(false)}
          />

          {/* Cookie Banner */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-6 md:right-auto md:max-w-md lg:max-w-lg z-[9999] p-4 md:p-0"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {!showSettings ? (
                // Simple Banner View
                <div className="p-6 md:p-8">
                  {/* Cookie Icon */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#ABC443] rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        We Value Your Privacy
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                        By clicking "Accept All", you consent to our use of cookies.
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 bg-[#ABC443] hover:bg-[#9BB03A] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Accept All
                    </button>
                    <button
                      onClick={handleRejectAll}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                    >
                      Reject All
                    </button>
                  </div>

                  <button
                    onClick={() => setShowSettings(true)}
                    className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Customize Settings
                  </button>

                  {/* Links */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
                      <Link href="/privacy-policy" className="hover:text-gray-700 underline transition-colors">
                        Privacy Policy
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link href="/terms-and-conditions" className="hover:text-gray-700 underline transition-colors">
                        Terms of Service
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                // Detailed Settings View
                <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Cookie Preferences</h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    We use different types of cookies to optimize your experience on our website. 
                    Click on the different category headings to learn more and change our default settings.
                  </p>

                  {/* Cookie Categories */}
                  <div className="space-y-4">
                    {/* Necessary Cookies */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Strictly Necessary Cookies</h4>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-2">Always Active</span>
                          <div className="w-12 h-6 bg-[#ABC443] rounded-full flex items-center px-1">
                            <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        These cookies are essential for the website to function properly. 
                        They enable basic functions like page navigation and access to secure areas.
                      </p>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Analytics Cookies</h4>
                        <button
                          onClick={() => togglePreference('analytics')}
                          className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors duration-200 ${
                            preferences.analytics ? 'bg-[#ABC443]' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                            preferences.analytics ? 'translate-x-6' : 'translate-x-0'
                          }`}></div>
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        These cookies help us understand how visitors interact with our website by collecting 
                        and reporting information anonymously.
                      </p>
                    </div>

                    {/* Marketing Cookies */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Marketing Cookies</h4>
                        <button
                          onClick={() => togglePreference('marketing')}
                          className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors duration-200 ${
                            preferences.marketing ? 'bg-[#ABC443]' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                            preferences.marketing ? 'translate-x-6' : 'translate-x-0'
                          }`}></div>
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        These cookies are used to track visitors across websites to display relevant 
                        advertisements and track campaign performance.
                      </p>
                    </div>

                    {/* Functional Cookies */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Functional Cookies</h4>
                        <button
                          onClick={() => togglePreference('functional')}
                          className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors duration-200 ${
                            preferences.functional ? 'bg-[#ABC443]' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                            preferences.functional ? 'translate-x-6' : 'translate-x-0'
                          }`}></div>
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        These cookies enable enhanced functionality and personalization, such as 
                        remembering your preferences and settings.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleAcceptSelected}
                      className="flex-1 bg-[#ABC443] hover:bg-[#9BB03A] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Save Preferences
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                    >
                      Accept All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

