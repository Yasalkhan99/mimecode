'use client';

import { useEffect, useState } from 'react';
import { getPopularCoupons, getLatestCoupons, Coupon } from '@/lib/services/couponService';
import { addToFavorites, removeFromFavorites, isFavorite } from '@/lib/services/favoritesService';
import { addNotification } from '@/lib/services/notificationsService';
import Link from 'next/link';
import CouponPopup from './CouponPopup';

export default function PopularCoupons() {
  const [activeTab, setActiveTab] = useState<'latest' | 'popular'>('latest');
  const [coupons, setCoupons] = useState<(Coupon | null)[]>(Array(8).fill(null));
  const [loading, setLoading] = useState(true);
  const [revealedCoupons, setRevealedCoupons] = useState<Set<string>>(new Set());
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      setLoading(true);
      try {
        const data = activeTab === 'latest' 
          ? await getLatestCoupons()
          : await getPopularCoupons();
        setCoupons(data);
      } catch (error) {
        console.error('Error fetching coupons:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, [activeTab]);

  // Listen for favorites updates
  useEffect(() => {
    const handleFavoritesUpdate = () => setUpdateTrigger(prev => prev + 1);
    
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    
    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
    };
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  // Get last 2 digits of code for code type coupons
  const getCodePreview = (coupon: Coupon): string => {
    if ((coupon.couponType || 'deal') === 'code' && coupon.code) {
      return 'Get Code';
    }
    return 'Get Deal';
  };

  // Get last 2 digits for hover display
  const getLastTwoDigits = (coupon: Coupon): string | null => {
    if ((coupon.couponType || 'deal') === 'code' && coupon.code) {
      const code = coupon.code.trim();
      if (code.length >= 2) {
        return code.slice(-2);
      }
    }
    return null;
  };

  const handleGetDeal = (coupon: Coupon, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Copy code to clipboard FIRST (before showing popup) - only for code type
    if (coupon.couponType === 'code' && coupon.code) {
      const codeToCopy = coupon.code.trim();
      copyToClipboard(codeToCopy);
    }
    
    // Mark coupon as revealed
    if (coupon.id) {
      setRevealedCoupons(prev => new Set(prev).add(coupon.id!));
    }
    
    // Show popup
    setSelectedCoupon(coupon);
    setShowPopup(true);
    
    // Automatically open URL in new tab after a short delay (to ensure popup is visible first)
    if (coupon.url && coupon.url.trim()) {
      setTimeout(() => {
        window.open(coupon.url, '_blank', 'noopener,noreferrer');
      }, 500);
    }
  };

  const handlePopupContinue = () => {
    if (selectedCoupon?.url) {
      window.open(selectedCoupon.url, '_blank', 'noopener,noreferrer');
    }
    setShowPopup(false);
    setSelectedCoupon(null);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    setSelectedCoupon(null);
  };

  const copyToClipboard = (text: string) => {
    console.log('Attempting to copy:', text);
    
    // Method 1: Try modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        console.log('Clipboard API success');
        addNotification({
          title: 'Code Copied!',
          message: `Coupon code "${text}" has been copied to clipboard.`,
          type: 'success'
        });
      }).catch((err) => {
        console.error('Clipboard API failed:', err);
        // Fallback to execCommand
        copyToClipboardFallback(text);
      });
    } else {
      console.log('Using fallback method');
      // Use fallback for browsers without clipboard API or non-secure contexts
      copyToClipboardFallback(text);
    }
  };

  const copyToClipboardFallback = (text: string) => {
    try {
      console.log('Using fallback copy method');
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make it invisible but still selectable
      textArea.style.position = 'fixed';
      textArea.style.left = '0';
      textArea.style.top = '0';
      textArea.style.width = '2px';
      textArea.style.height = '2px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.style.zIndex = '-1';
      
      document.body.appendChild(textArea);
      
      // Select and copy
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999); // For mobile devices
      
      const successful = document.execCommand('copy');
      console.log('execCommand result:', successful);
      
      document.body.removeChild(textArea);
      
      if (successful) {
        addNotification({
          title: 'Code Copied!',
          message: `Coupon code "${text}" has been copied to clipboard.`,
          type: 'success'
        });
      } else {
        // If execCommand fails, show the code to user
        addNotification({
          title: 'Copy Manually',
          message: `Code: ${text} (Please copy manually)`,
          type: 'info'
        });
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      addNotification({
        title: 'Copy Manually',
        message: `Code: ${text} (Please copy manually)`,
        type: 'info'
      });
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, coupon: Coupon) => {
    e.stopPropagation();
    if (!coupon.id) return;
    
    if (isFavorite(coupon.id)) {
      removeFromFavorites(coupon.id);
      addNotification({
        title: 'Removed from Favorites',
        message: `${coupon.code} has been removed from your favorites.`,
        type: 'info'
      });
    } else {
      addToFavorites({
        couponId: coupon.id,
        code: coupon.code,
        storeName: coupon.storeName,
        discount: coupon.discount,
        discountType: coupon.discountType,
        description: coupon.description,
        logoUrl: coupon.logoUrl,
        url: coupon.url,
        addedAt: Date.now()
      });
      addNotification({
        title: 'Added to Favorites',
        message: `${coupon.code} has been added to your favorites!`,
        type: 'success'
      });
    }
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
  };


  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 lg:py-16 bg-white animate-fade-in-up">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold animate-slide-in-left">
            <span className="text-gray-900">Popular</span>{' '}
            <span className="text-orange-600">Coupons</span>
          </h2>
          <Link
            href="/coupons"
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap text-sm sm:text-base animate-slide-in-right"
          >
            See All Coupons
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-4 sm:mb-6 md:mb-8 overflow-x-auto pb-2 scrollbar-hide -mx-2 sm:-mx-4 px-2 sm:px-4">
          <button
            onClick={() => setActiveTab('latest')}
            className={`flex items-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all flex-shrink-0 text-sm sm:text-base ${
              activeTab === 'latest'
                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {activeTab === 'latest' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {activeTab === 'latest' && (
              <span className="bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded">LATEST</span>
            )}
            <span>Latest Coupons</span>
          </button>

          <button
            onClick={() => setActiveTab('popular')}
            className={`flex items-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all flex-shrink-0 text-sm sm:text-base ${
              activeTab === 'popular'
                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {activeTab === 'popular' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>Popular Coupons</span>
          </button>
        </div>

        {/* Coupons Grid - Always show 8 layout slots */}
        {loading ? (
          <>
            {/* Mobile: Horizontal Scrolling */}
            <div className="md:hidden overflow-x-auto pb-4 -mx-3 sm:-mx-4 px-3 sm:px-4 scrollbar-hide">
              <div className="flex gap-3 min-w-max">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 w-[280px] flex-shrink-0 h-56 animate-pulse border border-gray-200 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-gray-200 rounded"></div>
                      <div className="w-20 h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-2 mb-3 flex-grow">
                      <div className="w-full h-2 bg-gray-200 rounded"></div>
                      <div className="w-3/4 h-2 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-full h-7 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            {/* Desktop: Grid */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 h-64 animate-pulse border border-gray-200 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="space-y-2 mb-4 flex-grow">
                    <div className="w-full h-3 bg-gray-200 rounded"></div>
                    <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-full h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Mobile: Horizontal Scrolling Carousel */}
            <div className="md:hidden overflow-x-auto pb-4 -mx-3 sm:-mx-4 px-3 sm:px-4 scrollbar-hide">
              <div className="flex gap-3 min-w-max">
                {coupons.map((coupon, index) => (
                  coupon ? (
                    <div
                      key={coupon.id}
                      className={`bg-white rounded-lg p-3 w-[280px] flex-shrink-0 shadow-sm hover:shadow-md transition-shadow border border-gray-200 flex flex-col animate-scale-in ${index > 0 ? 'animate-delay-' + (index % 4 + 1) : ''}`}
                      style={{ overflow: 'visible' }}
                    >
                      {/* Logo and Brand Name */}
                      <div className="flex items-center gap-3 mb-3">
                        {coupon.logoUrl ? (
                          <div className="w-12 h-12 rounded flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                            <img
                              src={coupon.logoUrl}
                              alt={coupon.storeName || coupon.code}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const parent = target.parentElement;
                                if (parent) {
                                  const initial = coupon.code?.charAt(0) || coupon.storeName?.charAt(0) || '?';
                                  parent.innerHTML = `<span class="text-xs font-semibold text-gray-500">${initial}</span>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-gray-500">
                              {coupon.code?.charAt(0) || coupon.storeName?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        <h3 className="text-sm font-bold text-gray-900 flex-1">
                          {coupon.storeName || coupon.code}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                        {coupon.description || `${coupon.code} Coupon Code - Get ${coupon.discount}% off your order.`}
                      </p>

                      {/* Expiry Date and Verified Badge */}
                      <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                        {coupon.expiryDate ? (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(coupon.expiryDate) || '31 Dec, 2025'}</span>
                          </div>
                        ) : (
                          <span>31 Dec, 2025</span>
                        )}
                        <div className="flex items-center gap-1 text-green-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Verified</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={(e) => handleToggleFavorite(e, coupon)}
                          className={`p-2 rounded-lg transition-colors ${
                            coupon.id && isFavorite(coupon.id)
                              ? 'bg-pink-100 text-pink-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-600'
                          }`}
                          title={coupon.id && isFavorite(coupon.id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <svg className="w-4 h-4" fill={coupon.id && isFavorite(coupon.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>

                      {/* Get Deal Button */}
                      <button 
                        onClick={(e) => handleGetDeal(coupon, e)}
                        className="w-full bg-gradient-to-r from-pink-500 via-pink-400 to-orange-500 border-2 border-dashed border-white/60 rounded-lg px-4 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between text-white font-semibold hover:from-pink-600 hover:via-pink-500 hover:to-orange-600 hover:border-white/80 transition-all duration-300 group relative overflow-hidden shadow-md hover:shadow-lg whitespace-nowrap"
                        style={{ borderStyle: 'dashed', borderWidth: '2px' }}
                      >
                        <span className="flex-1 flex items-center justify-center">
                          {coupon.id && revealedCoupons.has(coupon.id) && coupon.couponType === 'code' && coupon.code ? (
                            <span className="font-bold text-sm sm:text-base drop-shadow-sm">
                              {coupon.code}
                            </span>
                          ) : (
                            <span className="drop-shadow-sm text-sm sm:text-base">
                              {getCodePreview(coupon)}
                            </span>
                          )}
                        </span>
                        {getLastTwoDigits(coupon) && !(coupon.id && revealedCoupons.has(coupon.id)) && (
                          <div className="w-0 opacity-0 group-hover:w-20 group-hover:opacity-100 transition-all duration-300 ease-out flex items-center justify-center border-l-2 border-dashed border-white/70 ml-2 pl-2 whitespace-nowrap overflow-hidden bg-gradient-to-r from-transparent to-orange-600/20" style={{ borderStyle: 'dashed' }}>
                            <span className="text-white font-bold text-xs drop-shadow-md">...{getLastTwoDigits(coupon)}</span>
                          </div>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div
                      key={`empty-${index}`}
                      className="bg-gray-50 rounded-lg p-3 w-[280px] flex-shrink-0 border-2 border-dashed flex flex-col items-center justify-center min-h-[220px] border-gray-200"
                    >
                      <div className="text-gray-400 text-center">
                        <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-xs font-medium">Layout {index + 1}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Empty Slot</p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {coupons.map((coupon, index) => (
              coupon ? (
                <div
                  key={coupon.id}
                  className="bg-white rounded-lg p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-200 flex flex-col"
                  style={{ overflow: 'visible' }}
                >
                  {/* Logo and Brand Name */}
                  <div className="flex items-center gap-3 mb-3">
                    {coupon.logoUrl ? (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                        <img
                          src={coupon.logoUrl}
                          alt={coupon.storeName || coupon.code}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent) {
                              const initial = coupon.code?.charAt(0) || coupon.storeName?.charAt(0) || '?';
                              parent.innerHTML = `<span class="text-xs font-semibold text-gray-500">${initial}</span>`;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-500">
                          {coupon.code?.charAt(0) || coupon.storeName?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 flex-1">
                      {coupon.storeName || coupon.code}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                    {coupon.description || `${coupon.code} Coupon Code - Get ${coupon.discount}% off your order.`}
                  </p>

                  {/* Expiry Date and Verified Badge */}
                  <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                    {coupon.expiryDate ? (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(coupon.expiryDate) || '31 Dec, 2025'}</span>
                      </div>
                    ) : (
                      <span>31 Dec, 2025</span>
                    )}
                    <div className="flex items-center gap-1 text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Verified</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={(e) => handleToggleFavorite(e, coupon)}
                      className={`p-2 rounded-lg transition-colors ${
                        coupon.id && isFavorite(coupon.id)
                          ? 'bg-pink-100 text-pink-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-600'
                      }`}
                      title={coupon.id && isFavorite(coupon.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg className="w-4 h-4" fill={coupon.id && isFavorite(coupon.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* Get Deal Button */}
                  <button 
                    onClick={(e) => handleGetDeal(coupon, e)}
                    className="w-full bg-gradient-to-r from-pink-500 via-pink-400 to-orange-500 border-2 border-dashed border-white/60 rounded-lg px-4 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between text-white font-semibold hover:from-pink-600 hover:via-pink-500 hover:to-orange-600 hover:border-white/80 transition-all duration-300 group relative overflow-hidden shadow-md hover:shadow-lg whitespace-nowrap"
                    style={{ borderStyle: 'dashed', borderWidth: '2px' }}
                  >
                    <span className="flex-1 flex items-center justify-center">
                      {coupon.id && revealedCoupons.has(coupon.id) && coupon.couponType === 'code' && coupon.code ? (
                        <span className="font-bold text-sm sm:text-base drop-shadow-sm">
                          {coupon.code}
                        </span>
                      ) : (
                        <span className="drop-shadow-sm text-sm sm:text-base">
                          {getCodePreview(coupon)}
                        </span>
                      )}
                    </span>
                    {getLastTwoDigits(coupon) && !(coupon.id && revealedCoupons.has(coupon.id)) && (
                      <div className="w-0 opacity-0 group-hover:w-20 group-hover:opacity-100 transition-all duration-300 ease-out flex items-center justify-center border-l-2 border-dashed border-white/70 ml-2 pl-2 whitespace-nowrap overflow-hidden bg-gradient-to-r from-transparent to-orange-600/20" style={{ borderStyle: 'dashed' }}>
                        <span className="text-white font-bold text-xs drop-shadow-md">...{getLastTwoDigits(coupon)}</span>
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <div
                  key={`empty-${index}`}
                  className="bg-gray-50 rounded-lg p-4 sm:p-5 border-2 border-dashed flex flex-col items-center justify-center min-h-[250px] border-gray-200"
                >
                  <div className="text-gray-400 text-center">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-xs font-medium">Layout {index + 1}</p>
                    <p className="text-xs text-gray-400 mt-1">Empty Slot</p>
                  </div>
                </div>
              )
            ))}
          </div>
          </>
        )}
      </div>

      {/* Coupon Popup */}
      <CouponPopup
        coupon={selectedCoupon}
        isOpen={showPopup}
        onClose={handlePopupClose}
        onContinue={handlePopupContinue}
      />
    </div>
  );
}

