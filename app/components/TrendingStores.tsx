'use client';

import { useEffect, useState } from 'react';
import { getTrendingStores, Store } from '@/lib/services/storeService';
import Link from 'next/link';

export default function TrendingStores() {
  const [stores, setStores] = useState<(Store | null)[]>(Array(8).fill(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await getTrendingStores();
        setStores(data);
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  return (
    <div className="w-full flex justify-center px-2 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 lg:py-16">
      <div className="max-w-[95%] w-full rounded-xl px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12 lg:py-16 animate-fade-in-up" style={{ backgroundColor: 'rgba(244, 117, 79, 0.15)' }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold animate-slide-in-left">
              <span className="text-gray-900">Trending</span>{' '}
              <span className="text-orange-600">Stores</span>
            </h2>
            <Link
              href="/stores"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap text-sm sm:text-base animate-slide-in-right"
            >
              All Stores
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

        {/* Stores Grid - Always show 8 layout slots */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 md:grid">
            <div className="md:hidden overflow-x-auto pb-4 -mx-3 sm:-mx-4 px-3 sm:px-4 scrollbar-hide">
              <div className="flex gap-3 min-w-max">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 w-[280px] flex-shrink-0 h-44 animate-pulse border flex flex-col" style={{ borderColor: 'rgba(244, 117, 79, 0.3)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded"></div>
                      <div className="w-20 h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-2 mb-3 flex-grow">
                      <div className="w-full h-2 bg-gray-200 rounded"></div>
                      <div className="w-3/4 h-2 bg-gray-200 rounded"></div>
                      <div className="w-5/6 h-2 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-full h-7 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 h-48 animate-pulse border flex flex-col" style={{ borderColor: 'rgba(244, 117, 79, 0.3)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="space-y-2 mb-4 flex-grow">
                    <div className="w-full h-3 bg-gray-200 rounded"></div>
                    <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
                    <div className="w-5/6 h-3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-full h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: Horizontal Scrolling Carousel with Continuous Animation */}
            <div className="md:hidden overflow-hidden pb-4 -mx-3 sm:-mx-4 px-3 sm:px-4">
              <div className="relative overflow-hidden w-full">
                <div 
                  className="flex gap-3"
                  style={{
                    animation: 'slideLeftSmooth 30s linear infinite',
                    width: 'fit-content',
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'translateZ(0)'
                  }}
                >
                  {[...Array(3)].map((_, loopIndex) => (
                    stores.map((store, index) => (
                      store ? (
                        <Link
                          key={`${store.id}-${loopIndex}`}
                          href={`/stores/${store.slug || store.id}`}
                          className="bg-white rounded-lg p-3 w-[280px] flex-shrink-0 shadow-sm hover:shadow-md transition-shadow border flex flex-col"
                          style={{ borderColor: 'rgba(244, 117, 79, 0.3)' }}
                        >
                      <div className="flex items-center gap-2 mb-2">
                        {store.logoUrl ? (
                          <div className="w-10 h-10 rounded flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0 relative">
                            <img
                              src={store.logoUrl}
                              alt={store.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-xs font-semibold text-gray-500">${store.name.charAt(0)}</span>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-gray-500">
                              {store.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <h3 className="text-sm font-bold text-gray-900 flex-1 line-clamp-1">
                          {store.name}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed flex-grow">
                        {store.description || `${store.name} Promo Code - Time limited promotion Enjoy a 10% off your order.`}
                      </p>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/stores/${store.slug || store.id}`;
                        }}
                        className="w-full bg-gradient-to-r from-pink-500 via-pink-400 to-orange-500 border-2 border-dashed border-white/60 rounded-lg px-3 py-2 flex items-center justify-between text-white font-semibold hover:from-pink-600 hover:via-pink-500 hover:to-orange-600 hover:border-white/80 transition-all duration-300 group mt-auto text-xs relative overflow-hidden shadow-md hover:shadow-lg"
                        style={{ borderStyle: 'dashed', borderWidth: '2px' }}
                      >
                        <span className="flex-1 flex items-center justify-center truncate">
                          <span className="drop-shadow-sm truncate">
                            {store.voucherText || 'Upto 58% Voucher'}
                          </span>
                        </span>
                        <div className="w-20 flex items-center justify-center border-l-2 border-dashed border-white/70 ml-2 pl-2 whitespace-nowrap overflow-hidden bg-gradient-to-r from-transparent to-orange-600/20" style={{ borderStyle: 'dashed' }}>
                          <span className="text-white font-bold text-xs drop-shadow-md">Visit Store</span>
                        </div>
                      </button>
                    </Link>
                  ) : (
                    <div
                      key={`empty-${index}-${loopIndex}`}
                      className="bg-gray-50 rounded-lg p-3 w-[280px] flex-shrink-0 border-2 border-dashed flex flex-col items-center justify-center min-h-[180px]"
                      style={{ borderColor: 'rgba(244, 117, 79, 0.2)' }}
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
                    ))
                  ))}
              </div>
            </div>
            </div>
            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stores.map((store, index) => (
              store ? (
                <Link
                  key={store.id}
                  href={`/stores/${store.slug || store.id}`}
                  className="bg-white rounded-lg p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow border flex flex-col"
                  style={{ borderColor: 'rgba(244, 117, 79, 0.3)' }}
                >
                  {/* Logo and Store Name - Side by Side */}
                  <div className="flex items-center gap-3 mb-3">
                    {store.logoUrl ? (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0 relative">
                        <img
                          src={store.logoUrl}
                          alt={store.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback to initial letter if image fails to load
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-xs font-semibold text-gray-500">${store.name.charAt(0)}</span>`;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-500">
                          {store.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 flex-1">
                      {store.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-grow">
                    {store.description || `${store.name} Promo Code - Time limited promotion Enjoy a 10% off your order.`}
                  </p>

                  {/* Voucher Button with Visit Store always visible */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/stores/${store.slug || store.id}`;
                    }}
                    className="w-full bg-gradient-to-r from-pink-500 via-pink-400 to-orange-500 border-2 border-dashed border-white/60 rounded-lg px-3 py-2.5 flex items-center justify-between text-white font-semibold hover:from-pink-600 hover:via-pink-500 hover:to-orange-600 hover:border-white/80 transition-all duration-300 group mt-auto relative overflow-hidden shadow-md hover:shadow-lg"
                    style={{ borderStyle: 'dashed', borderWidth: '2px' }}
                  >
                    <span className="flex-1 flex items-center justify-center">
                      <span className="text-xs sm:text-sm drop-shadow-sm">
                        {store.voucherText || 'Upto 58% Voucher'}
                      </span>
                    </span>
                    <div className="w-24 flex items-center justify-center border-l-2 border-dashed border-white/70 ml-2 pl-2 whitespace-nowrap overflow-hidden bg-gradient-to-r from-transparent to-orange-600/20" style={{ borderStyle: 'dashed' }}>
                      <span className="text-white font-bold text-xs sm:text-sm drop-shadow-md">Visit Store</span>
                    </div>
                  </button>
                </Link>
              ) : (
                <div
                  key={`empty-${index}`}
                  className="bg-gray-50 rounded-lg p-4 sm:p-5 border-2 border-dashed flex flex-col items-center justify-center min-h-[200px]"
                  style={{ borderColor: 'rgba(244, 117, 79, 0.2)' }}
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
    </div>
  );
}

