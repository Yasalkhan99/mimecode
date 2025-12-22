'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCategoryById, Category } from '@/lib/services/categoryService';
import { getStoresByCategoryId, Store } from '@/lib/services/storeService';
import { getCouponsByCategoryId, Coupon } from '@/lib/services/couponService';
import { addNotification } from '@/lib/services/notificationsService';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import CouponPopup from '@/app/components/CouponPopup';
import Link from 'next/link';

export default function CategoryDetailPage() {
  const params = useParams();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedCoupons, setRevealedCoupons] = useState<Set<string>>(new Set());
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [categoryData, storesData, couponsData] = await Promise.all([
          getCategoryById(categoryId),
          getStoresByCategoryId(categoryId),
          getCouponsByCategoryId(categoryId),
        ]);
        
        setCategory(categoryData);
        setStores(storesData);
        setCoupons(couponsData);
      } catch (error) {
        console.error('Error fetching category data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchData();
    }
  }, [categoryId]);

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
    // Use custom button text if provided
    if (coupon.buttonText && coupon.buttonText.trim() !== '') {
      return coupon.buttonText;
    }
    // Default to type-based text
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

  // Get store for this coupon
  const getStoreForCoupon = (coupon: Coupon): Store | null => {
    if (!coupon.storeIds || coupon.storeIds.length === 0) return null;
    
    for (const storeId of coupon.storeIds) {
      const match = stores.find(s => s.id === storeId);
      if (match) return match;
    }
    
    return null;
  };

  // Get URL with priority: coupon.url (primary), then store.trackingLink, then store.trackingUrl
  const getUrlToOpen = (coupon: Coupon): string | null => {
    // Check coupon.url FIRST - if it exists and is not empty, use it
    const couponUrl = coupon.url;
    if (couponUrl && typeof couponUrl === 'string' && couponUrl.trim() !== '') {
      return couponUrl.trim();
    }
    
    const store = getStoreForCoupon(coupon);
    if (store?.trackingLink && store.trackingLink.trim()) {
      return store.trackingLink.trim();
    }
    if (store?.trackingUrl && store.trackingUrl.trim()) {
      return store.trackingUrl.trim();
    }
    
    return coupon.affiliateLink || null;
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
    
    // Get URL with priority: coupon.url (primary), then store.trackingLink, then store.trackingUrl
    const urlToOpen = getUrlToOpen(coupon);
    
    // Automatically open URL in new tab after a short delay (to ensure popup is visible first)
    if (urlToOpen) {
      setTimeout(() => {
        window.open(urlToOpen, '_blank', 'noopener,noreferrer');
      }, 500);
    }
  };

  const handlePopupContinue = () => {
    if (selectedCoupon) {
      const urlToOpen = getUrlToOpen(selectedCoupon);
      if (urlToOpen) {
        window.open(urlToOpen, '_blank', 'noopener,noreferrer');
      }
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
          <div className="text-xl font-semibold text-gray-600">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Category Not Found</h1>
            <Link href="/categories" className="text-[#FFE019] hover:underline">
              Back to Categories
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Category Header */}
      <div className="w-full bg-gradient-to-r from-[#ABC443]/10 to-[#41361A]/10 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-md flex-shrink-0 relative overflow-hidden"
              style={{ backgroundColor: category.backgroundColor }}
            >
              {category.logoUrl ? (
                <>
                  <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-black/90 flex items-center justify-center relative z-10 shadow-sm">
                    <img
                      src={category.logoUrl}
                      alt={category.name}
                      className={`${category.logoUrl.includes('data:image/svg+xml') ? 'w-full h-full' : 'w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12'} object-contain`}
                      onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      // Show fallback letter when image fails
                      const parent = target.parentElement;
                      if (parent) {
                        const existingFallback = parent.querySelector('.category-fallback-letter');
                        if (!existingFallback) {
                          const fallback = document.createElement('div');
                          fallback.className = 'category-fallback-letter absolute inset-0 w-full h-full rounded-full flex items-center justify-center z-20';
                          fallback.innerHTML = `
                            <div class="w-3/4 h-3/4 rounded-full bg-gray-200 flex items-center justify-center">
                              <span class="text-lg sm:text-2xl md:text-3xl font-bold text-gray-700">${category.name.charAt(0).toUpperCase()}</span>
                            </div>
                          `;
                          parent.appendChild(fallback);
                        } else {
                          (existingFallback as HTMLElement).style.display = 'flex';
                        }
                      }
                    }}
                    />
                  </div>
                  {/* Fallback letter (hidden by default, shown if image fails) */}
                  <div className="category-fallback-letter absolute inset-0 w-full h-full rounded-full flex items-center justify-center z-20" style={{ display: 'none' }}>
                    <div className="w-3/4 h-3/4 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-700">
                        {category.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: category.backgroundColor }}>
                  <div className="w-3/4 h-3/4 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-700">
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 capitalize truncate">
                {category.name}
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-0.5 sm:mt-1">
                {stores.length} {stores.length === 1 ? 'Store' : 'Stores'} • {coupons.length} {coupons.length === 1 ? 'Coupon' : 'Coupons'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-12">
        {/* Stores Section */}
        {stores.length > 0 && (
          <div className="mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6">Stores</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/stores/${store.slug || store.id}`}
                  className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 md:p-4 lg:p-6 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex flex-col items-center text-center">
                    {store.logoUrl ? (
                      <img
                        src={store.logoUrl}
                        alt={store.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-contain mb-2 sm:mb-3 md:mb-4 group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-gray-200 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                        <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600">
                          {store.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 group-hover:text-[#FFE019] transition-colors line-clamp-2">
                      {store.name}
                    </h3>
                    {store.voucherText && (
                      <p className="text-xs sm:text-sm text-[#FFE019] font-medium line-clamp-1">{store.voucherText}</p>
                    )}
                    {store.description && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2 hidden sm:block">{store.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Coupons Section */}
        {coupons.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6">Coupons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {coupons.map((coupon) => {
                const isRevealed = coupon.id && revealedCoupons.has(coupon.id);
                // Handle expiryDate - can be string, Date, or Firestore Timestamp
                const getExpiryDate = (expiryDate: any): Date | null => {
                  if (!expiryDate) return null;
                  if (expiryDate instanceof Date) return expiryDate;
                  if (expiryDate && typeof expiryDate.toDate === 'function') {
                    return expiryDate.toDate();
                  }
                  if (typeof expiryDate === 'string') {
                    const parsed = new Date(expiryDate);
                    return isNaN(parsed.getTime()) ? null : parsed;
                  }
                  if (typeof expiryDate === 'number') {
                    return new Date(expiryDate);
                  }
                  return null;
                };
                const expiryDateObj = getExpiryDate(coupon.expiryDate);
                const isExpired = expiryDateObj ? expiryDateObj < new Date() : false;
                
                return (
                  <div
                    key={coupon.id}
                    className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow"
                    style={{ overflow: 'visible' }}
                  >
                    <div className="flex flex-col">
                      {coupon.logoUrl && (
                        <img
                          src={coupon.logoUrl}
                          alt={coupon.storeName || coupon.code}
                          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain mb-2 sm:mb-3 md:mb-4 mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 text-center line-clamp-2">
                        {(() => {
                          // Helper to strip HTML tags
                          const stripHtml = (html: string) => {
                            if (!html) return '';
                            const tmp = document.createElement('DIV');
                            tmp.innerHTML = html;
                            return tmp.textContent || tmp.innerText || '';
                          };
                          
                          // Get coupon title - prefer title, then description, then generate from discount
                          if (coupon.title) return stripHtml(coupon.title);
                          if (coupon.description) return stripHtml(coupon.description);
                          if (coupon.discount && coupon.discount > 0) {
                            return coupon.discountType === 'percentage' 
                              ? `${coupon.discount}% Off`
                              : `$${coupon.discount} Off`;
                          }
                          return coupon.code || coupon.storeName || 'Coupon';
                        })()}
                      </h3>
                      {coupon.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 md:mb-4 text-center line-clamp-2 hidden sm:block">
                          {coupon.description}
                        </p>
                      )}
                      {isExpired && (
                        <div className="bg-red-100 text-red-700 text-xs font-semibold px-2 sm:px-3 py-1 rounded mb-2 sm:mb-3 md:mb-4 text-center">
                          Expired
                        </div>
                      )}
                      {!isExpired && (
                        <button
                          onClick={(e) => handleGetDeal(coupon, e)}
                          className="w-full bg-[#FFE019] hover:bg-black hover:text-white text-white font-semibold rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between transition-all duration-300 shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base group relative overflow-hidden"
                        >
                          <span className="flex-1 flex items-center justify-center">
                            {isRevealed ? (
                              coupon.url ? 'Visit Store' : (coupon.code || getCodePreview(coupon))
                            ) : (
                              <span>{getCodePreview(coupon)}</span>
                            )}
                          </span>
                          {getLastTwoDigits(coupon) && !isRevealed && (
                            <div className="w-0 opacity-0 group-hover:w-16 group-hover:opacity-100 transition-all duration-300 ease-out flex items-center justify-center border-l-2 border-white/70 ml-2 pl-2 whitespace-nowrap overflow-hidden bg-white/10">
                              <span className="text-white font-bold text-xs">...{getLastTwoDigits(coupon)}</span>
                            </div>
                          )}
                        </button>
                      )}
                      {isRevealed && coupon.code && (
                        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-100 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Coupon Code:</p>
                          <p className="text-sm sm:text-base md:text-lg font-mono font-bold text-gray-800 text-center break-all">
                            {coupon.code}
                          </p>
                        </div>
                      )}
                      {coupon.expiryDate && (
                        <p className="text-xs text-gray-500 mt-2 sm:mt-3 text-center">
                          Expires: {formatDate(coupon.expiryDate)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stores.length === 0 && coupons.length === 0 && (
          <div className="text-center py-6 sm:py-8 md:py-12">
            <p className="text-gray-600 text-sm sm:text-base md:text-lg">No stores or coupons found for this category.</p>
            <Link href="/categories" className="text-pink-600 hover:underline mt-2 sm:mt-4 inline-block text-sm sm:text-base">
              Browse All Categories
            </Link>
          </div>
        )}
      </div>

      {/* Newsletter Subscription */}
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

