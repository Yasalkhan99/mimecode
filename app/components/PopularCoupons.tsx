'use client';

import { useEffect, useState } from 'react';
import { getPopularCoupons, getLatestCoupons, Coupon } from '@/lib/services/couponService';
import Link from 'next/link';

export default function PopularCoupons() {
  const [activeTab, setActiveTab] = useState<'latest' | 'popular'>('latest');
  const [coupons, setCoupons] = useState<(Coupon | null)[]>(Array(8).fill(null));
  const [loading, setLoading] = useState(true);
  const [revealedCoupons, setRevealedCoupons] = useState<Set<string>>(new Set());

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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  const handleGetDeal = (coupon: Coupon) => {
    // Mark coupon as revealed
    if (coupon.id) {
      setRevealedCoupons(prev => new Set(prev).add(coupon.id!));
    }
    
    // Redirect to coupon URL if available
    if (coupon.url) {
      window.open(coupon.url, '_blank', 'noopener,noreferrer');
    }
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
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {coupon.logoUrl ? (
                          <div className="w-10 h-10 rounded flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0 relative">
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
                          <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-gray-500">
                              {coupon.code.charAt(0)}
                            </span>
                          </div>
                        )}
                        <h3 className="text-sm font-bold text-gray-900 flex-1 line-clamp-1">
                          {coupon.storeName || coupon.code}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed flex-grow">
                        {coupon.description || `${coupon.code} Coupon Code - Get ${coupon.discount}${coupon.discountType === 'percentage' ? '%' : ' AED'} off your order.`}
                      </p>
                      <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
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
                        onClick={() => handleGetDeal(coupon)}
                        className="w-full bg-white border-2 border-dashed border-gray-300 rounded-lg px-3 py-2 flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-orange-500 transition-colors group mt-auto text-xs"
                      >
                        {coupon.id && revealedCoupons.has(coupon.id) ? (
                          <span className="font-bold text-orange-600">
                            {coupon.code}
                          </span>
                        ) : (
                          <span className="font-semibold text-gray-900">
                            Get Deal
                          </span>
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
                >
                  {/* Logo and Brand Name - Side by Side */}
                  <div className="flex items-center gap-3 mb-3">
                    {coupon.logoUrl ? (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0 relative">
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

                  {/* Get Deal Button */}
                  <button 
                    onClick={() => handleGetDeal(coupon)}
                    className="w-full bg-white border-2 border-dashed border-gray-300 rounded-lg px-3 py-2.5 flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-orange-500 transition-colors group mt-auto"
                  >
                    {coupon.id && revealedCoupons.has(coupon.id) ? (
                      <span className="text-xs sm:text-sm font-bold text-orange-600">
                        {coupon.code}
                      </span>
                    ) : (
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        Get Deal
                      </span>
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
    </div>
  );
}

