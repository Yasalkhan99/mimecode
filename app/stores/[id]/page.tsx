'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getStoreById, getStoreBySlug, Store } from '@/lib/services/storeService';
import { getCouponsByStoreId, getCouponsByStoreName, Coupon } from '@/lib/services/couponService';
import { addNotification } from '@/lib/services/notificationsService';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';
import CouponPopup from '@/app/components/CouponPopup';

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slugOrId = params.id as string;
  
  const [store, setStore] = useState<Store | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedCoupons, setRevealedCoupons] = useState<Set<string>>(new Set());
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Try to get store by slug first, then by ID (for backward compatibility)
        let storeData = await getStoreBySlug(slugOrId);
        if (!storeData) {
          // Fallback to ID for backward compatibility
          storeData = await getStoreById(slugOrId);
        }
        
        if (storeData) {
          setStore(storeData);
          document.title = `${storeData.name} - Coupons - AvailCoupon`;
          
          // Try to get coupons by store ID first, fallback to store name
          const storeId = storeData.id;
          if (storeId) {
            const couponsById = await getCouponsByStoreId(storeId);
            const couponsByName = await getCouponsByStoreName(storeData.name);
            
            // Combine and deduplicate
            const allCoupons = [...couponsById];
            couponsByName.forEach(coupon => {
              if (!allCoupons.find(c => c.id === coupon.id)) {
                allCoupons.push(coupon);
              }
            });
            
            setCoupons(allCoupons);
          }
        } else {
          document.title = 'Store Not Found - AvailCoupon';
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (slugOrId) {
      fetchData();
    }
  }, [slugOrId]);

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
      return 'Get Coupon';
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
    
    // Copy code to clipboard FIRST (before showing popup)
    if (coupon.code) {
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
    // Method 1: Try modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        addNotification({
          title: 'Code Copied!',
          message: `Coupon code "${text}" has been copied to clipboard.`,
          type: 'success'
        });
      }).catch((err) => {
        console.error('Clipboard API failed:', err);
        copyToClipboardFallback(text);
      });
    } else {
      copyToClipboardFallback(text);
    }
  };

  const copyToClipboardFallback = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '0';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        addNotification({
          title: 'Code Copied!',
          message: `Coupon code "${text}" has been copied to clipboard.`,
          type: 'success'
        });
      } else {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading store...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
            <p className="text-gray-600 mb-4">The store you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/stores')}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Back to Stores
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <Navbar />
      
      {/* Store Header */}
      <div className="w-full bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {store.logoUrl ? (
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-xl shadow-lg p-4 flex items-center justify-center">
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-xl shadow-lg flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-gray-400">
                  {store.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                {store.name}
              </h1>
              {store.description && (
                <p className="text-base sm:text-lg text-gray-600 mb-4">
                  {store.description}
                </p>
              )}
              {store.voucherText && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm sm:text-base">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                  </svg>
                  {store.voucherText}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Section */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Available <span className="text-orange-600">Coupons</span>
            </h2>
            <div className="text-sm sm:text-base text-gray-600">
              {coupons.length} {coupons.length === 1 ? 'Coupon' : 'Coupons'} Available
            </div>
          </div>

          {coupons.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 text-lg mb-2">No coupons available for this store yet.</p>
              <button
                onClick={() => router.push('/stores')}
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                Browse Other Stores
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {coupons.map((coupon, index) => (
                <div
                  key={coupon.id}
                  className="bg-white rounded-lg p-4 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-orange-400 transform hover:-translate-y-1"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                    overflow: 'visible'
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {coupon.logoUrl ? (
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                        <img
                          src={coupon.logoUrl}
                          alt={coupon.code}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-xs font-semibold text-gray-500">${coupon.code.charAt(0)}</span>`;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-500">
                          {coupon.code.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                        {coupon.storeName || coupon.code}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-orange-600">
                          {coupon.discount}{coupon.discountType === 'percentage' ? '%' : ' AED'} OFF
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                    {coupon.description || `${coupon.code} Coupon Code - Get ${coupon.discount}${coupon.discountType === 'percentage' ? '%' : ' AED'} off your order.`}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                    {coupon.expiryDate ? (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(coupon.expiryDate) || '31 Dec, 2025'}</span>
                      </div>
                    ) : (
                      <span>31 Dec, 2025</span>
                    )}
                    <div className="flex items-center gap-1 text-green-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[10px]">Verified</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => handleGetDeal(coupon, e)}
                    className="w-full bg-gradient-to-r from-pink-500 via-pink-400 to-orange-500 border-2 border-dashed border-white/60 rounded-lg px-4 py-3 flex items-center justify-between text-white font-semibold hover:from-pink-600 hover:via-pink-500 hover:to-orange-600 hover:border-white/80 transition-all duration-300 group relative overflow-hidden shadow-md hover:shadow-lg"
                    style={{ borderStyle: 'dashed', borderWidth: '2px' }}
                  >
                    <span className="flex-1 flex items-center justify-center">
                      {coupon.id && revealedCoupons.has(coupon.id) ? (
                        <span className="font-bold text-base drop-shadow-sm">
                          {coupon.code}
                        </span>
                      ) : (
                        <span className="drop-shadow-sm">{getCodePreview(coupon)}</span>
                      )}
                    </span>
                    {getLastTwoDigits(coupon) && !(coupon.id && revealedCoupons.has(coupon.id)) && (
                      <div className="w-0 opacity-0 group-hover:w-20 group-hover:opacity-100 transition-all duration-300 ease-out flex items-center justify-center border-l-2 border-dashed border-white/70 ml-2 pl-2 whitespace-nowrap overflow-hidden bg-gradient-to-r from-transparent to-orange-600/20" style={{ borderStyle: 'dashed' }}>
                        <span className="text-white font-bold text-xs drop-shadow-md">...{getLastTwoDigits(coupon)}</span>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Newsletter Subscription Section */}
      <NewsletterSubscription />
      
      {/* Footer */}
      <Footer />

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

