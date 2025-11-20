'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getActiveCoupons, Coupon } from '@/lib/services/couponService';
import { getCategories, Category } from '@/lib/services/categoryService';
import { getStores, Store } from '@/lib/services/storeService';
import { addNotification } from '@/lib/services/notificationsService';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Link from 'next/link';

function CouponsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const storeParam = searchParams.get('store');
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || '');
  const [selectedStore, setSelectedStore] = useState<string>(storeParam || '');
  const [revealedCoupons, setRevealedCoupons] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.title = 'All Coupons - AvailCoupon';
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [couponsData, categoriesData, storesData] = await Promise.all([
          getActiveCoupons(),
          getCategories(),
          getStores()
        ]);
        setCoupons(couponsData);
        setCategories(categoriesData);
        setStores(storesData);
      } catch (error) {
        console.error('Error fetching coupons data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...coupons];
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(coupon => coupon.categoryId === selectedCategory);
    }
    
    // Filter by store
    if (selectedStore) {
      filtered = filtered.filter(coupon => {
        // Check if coupon is associated with selected store via storeIds
        if (coupon.storeIds && coupon.storeIds.includes(selectedStore)) {
          return true;
        }
        // Also check by storeName for backward compatibility
        const store = stores.find(s => s.id === selectedStore);
        if (store && coupon.storeName === store.name) {
          return true;
        }
        return false;
      });
    }
    
    setFilteredCoupons(filtered);
  }, [selectedCategory, selectedStore, coupons, stores]);

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
    
    // Copy code to clipboard FIRST (before revealing)
    if (coupon.code) {
      const codeToCopy = coupon.code.trim();
      copyToClipboard(codeToCopy);
    }
    
    // Mark coupon as revealed
    if (coupon.id) {
      setRevealedCoupons(prev => new Set(prev).add(coupon.id!));
    }
    
    // Redirect to coupon URL if available
    if (coupon.url) {
      setTimeout(() => {
        window.open(coupon.url, '_blank', 'noopener,noreferrer');
      }, 200);
    }
  };

  const copyToClipboard = (text: string) => {
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
      textArea.style.left = '0';
      textArea.style.top = '0';
      textArea.style.width = '2px';
      textArea.style.height = '2px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.style.zIndex = '-1';
      
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

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedStore('');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4">
              All <span className="text-orange-600">Coupons</span>
            </h1>
            <p className="text-center text-gray-600 text-sm sm:text-base">
              Discover amazing deals and discounts from your favorite stores
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <label htmlFor="store" className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Store
                </label>
                <select
                  id="store"
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Stores</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {(selectedCategory || selectedStore) && (
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredCoupons.length}</span> of <span className="font-semibold text-gray-900">{coupons.length}</span> coupons
            </div>
          </div>

          {/* Coupons Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 h-64 animate-pulse">
                  <div className="h-12 w-12 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No coupons found.</p>
              {(selectedCategory || selectedStore) && (
                <button
                  onClick={clearFilters}
                  className="text-orange-600 hover:text-orange-700 font-semibold"
                >
                  Clear filters to see all coupons
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredCoupons.map((coupon) => {
                const isRevealed = coupon.id && revealedCoupons.has(coupon.id);
                const isExpired = coupon.expiryDate && coupon.expiryDate.toDate() < new Date();
                
                return (
                  <div
                    key={coupon.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
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
                                parent.innerHTML = `<span class="text-xs font-semibold text-gray-500">${coupon.code.charAt(0)}</span>`;
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-500">
                            {coupon.code.charAt(0)}
                          </span>
                        </div>
                      )}
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 flex-1">
                        {coupon.storeName || coupon.code}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed flex-grow">
                      {coupon.description || `${coupon.code} Coupon Code - Get ${coupon.discount}${coupon.discountType === 'percentage' ? '%' : ' AED'} off your order.`}
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

                    {/* Action Button */}
                    {isExpired ? (
                      <div className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-2 rounded text-center">
                        Expired
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleGetDeal(coupon, e)}
                        className="w-full bg-gradient-to-r from-pink-500 via-pink-400 to-orange-500 border-2 border-dashed border-white/60 rounded-lg px-3 py-2.5 flex items-center justify-between text-white font-semibold hover:from-pink-600 hover:via-pink-500 hover:to-orange-600 hover:border-white/80 transition-all duration-300 group relative overflow-hidden shadow-md hover:shadow-lg"
                        style={{ borderStyle: 'dashed', borderWidth: '2px' }}
                      >
                        <span className="flex-1 flex items-center justify-center">
                          {isRevealed ? (
                            <span className="text-xs sm:text-sm font-bold drop-shadow-sm">
                              {coupon.code}
                            </span>
                          ) : (
                            <span className="text-xs sm:text-sm drop-shadow-sm">
                              {getCodePreview(coupon)}
                            </span>
                          )}
                        </span>
                        {getLastTwoDigits(coupon) && !isRevealed && (
                          <div className="w-0 opacity-0 group-hover:w-20 group-hover:opacity-100 transition-all duration-300 ease-out flex items-center justify-center border-l-2 border-dashed border-white/70 ml-2 pl-2 whitespace-nowrap overflow-hidden bg-gradient-to-r from-transparent to-orange-600/20" style={{ borderStyle: 'dashed' }}>
                            <span className="text-white font-bold text-xs drop-shadow-md">...{getLastTwoDigits(coupon)}</span>
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Newsletter Subscription */}
      <NewsletterSubscription />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function CouponsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading coupons...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <CouponsContent />
    </Suspense>
  );
}
