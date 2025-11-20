'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getBannerByLayoutPosition, Banner } from '@/lib/services/bannerService';
import { getStores, Store } from '@/lib/services/storeService';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';
import Image from 'next/image';

export default function StoresPage() {
  const [banner10, setBanner10] = useState<Banner | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showFilter, setShowFilter] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set page title
    document.title = 'Stores - AvailCoupon';
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bannerData, storesData] = await Promise.all([
          getBannerByLayoutPosition(10),
          getStores()
        ]);
        setBanner10(bannerData);
        setStores(storesData);
        setFilteredStores(storesData);
      } catch (error) {
        console.error('Error fetching stores page data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Sort stores based on selected option
    let sorted = [...stores];
    
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => {
          const dateA = a.createdAt?.toMillis() || 0;
          const dateB = b.createdAt?.toMillis() || 0;
          return dateB - dateA;
        });
        break;
      case 'oldest':
        sorted.sort((a, b) => {
          const dateA = a.createdAt?.toMillis() || 0;
          const dateB = b.createdAt?.toMillis() || 0;
          return dateA - dateB;
        });
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }
    
    setFilteredStores(sorted);
  }, [sortBy, stores]);

  // Auto-scroll slider with smooth continuous loop
  useEffect(() => {
    if (!sliderRef.current || filteredStores.length === 0) return;

    const slider = sliderRef.current;
    let animationFrameId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame (slower for smoother effect)
    let isPaused = false;
    
    // Pause on hover
    const handleMouseEnter = () => { isPaused = true; };
    const handleMouseLeave = () => { isPaused = false; };
    
    slider.addEventListener('mouseenter', handleMouseEnter);
    slider.addEventListener('mouseleave', handleMouseLeave);
    
    const scroll = () => {
      if (slider && !isPaused) {
        scrollPosition += scrollSpeed;
        
        // Calculate the width of first set of items (for seamless loop)
        const firstSetWidth = (slider.scrollWidth / 3);
        
        if (scrollPosition >= firstSetWidth) {
          // Reset to start seamlessly
          scrollPosition = scrollPosition - firstSetWidth;
          slider.scrollLeft = scrollPosition;
        } else {
          slider.scrollLeft = scrollPosition;
        }
      }
      
      animationFrameId = requestAnimationFrame(scroll);
    };

    // Start scrolling
    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      slider.removeEventListener('mouseenter', handleMouseEnter);
      slider.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [filteredStores]);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
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
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Smooth scrolling for mobile horizontal scroll */
        @media (max-width: 640px) {
          .overflow-x-auto {
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }
          /* Snap scrolling for better UX */
          .snap-x {
            scroll-snap-type: x mandatory;
          }
          .snap-start {
            scroll-snap-align: start;
          }
        }
      `}</style>
      <Navbar />
      
      {/* Banner Section with Layout 10 - 1728x547 */}
      <div className="w-full">
        {loading ? (
          <div className="w-full bg-gray-100 aspect-[1728/547] min-h-[200px] sm:min-h-[250px] animate-pulse"></div>
        ) : banner10 ? (
          <div className="relative w-full">
            <div className="w-full aspect-[1728/547] min-h-[200px] sm:min-h-[250px]">
              <img
                src={banner10.imageUrl}
                alt={banner10.title || 'Stores'}
                className="w-full h-full object-contain sm:object-cover"
                onError={(e) => {
                  console.error('Stores banner 10 image failed to load:', banner10.imageUrl);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>
        ) : (
          <div className="w-full aspect-[1728/547] min-h-[200px] sm:min-h-[250px] bg-gradient-to-r from-pink-100 to-orange-100"></div>
        )}
      </div>

      {/* Stores Grid Section */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 bg-white overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-6 sm:mb-8">
            All <span className="text-orange-600">Stores</span>
          </h2>

          {/* Filter and Sort Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-gray-200">
            <div className="text-sm sm:text-base text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredStores.length}</span> of <span className="font-semibold text-gray-900">{stores.length}</span> Results
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-2 px-4 py-2 border border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm sm:text-base font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base text-gray-600">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg aspect-square animate-pulse"></div>
              ))}
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No stores available yet.</p>
            </div>
          ) : (
            <div>
              {/* Featured Stores Slider (First 6 stores) */}
              {filteredStores.length > 0 && (
                <div className="mb-6 sm:mb-12">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 px-4 sm:px-0">
                    Featured <span className="text-orange-600">Stores</span>
                  </h3>
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 p-3 sm:p-4 md:p-6">
                    <div 
                      ref={sliderRef}
                      className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto sm:overflow-x-hidden scrollbar-hide pb-2"
                      style={{ scrollBehavior: 'auto' }}
                    >
                      {/* Duplicate items for seamless loop - show more copies for smoother loop */}
                      {[...filteredStores.slice(0, 6), ...filteredStores.slice(0, 6), ...filteredStores.slice(0, 6)].map((store, index) => (
                        <Link
                          key={`${store.id}-${index}`}
                          href={`/stores/${store.id}`}
                          className="flex-shrink-0 w-[240px] sm:w-[280px] md:w-[320px] bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 block"
                          style={{
                            animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                          }}
                        >
                          <div className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
                            <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                              {store.logoUrl ? (
                                <img
                                  src={store.logoUrl}
                                  alt={store.name}
                                  className="w-full h-full object-contain p-2"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="text-gray-500 text-xs font-bold">
                                  {store.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-base sm:text-lg text-gray-900 mb-1 truncate">
                                {store.name}
                              </h4>
                              {store.description && (
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                  {store.description}
                                </p>
                              )}
                              {store.voucherText && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                                    </svg>
                                    {store.voucherText}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* All Stores - Horizontal Scroll on Mobile, Grid on Desktop */}
              {filteredStores.length > 0 && (
                <div className="mb-4 sm:mb-0">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 px-4 sm:px-0">
                  All <span className="text-orange-600">Stores</span>
                </h3>
                
                {/* Mobile: Horizontal Scroll */}
                <div className="block sm:hidden">
                  <div className="relative">
                    {/* Scroll indicator gradient */}
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
                    <div className="overflow-x-auto scrollbar-hide pb-4 px-4 -mx-4 snap-x snap-mandatory w-full">
                      <div className="flex gap-4" style={{ width: 'max-content' }}>
                      {filteredStores.map((store, index) => (
                        <Link
                          key={store.id}
                          href={`/stores/${store.id}`}
                          className="group bg-white rounded-2xl border border-gray-200 hover:border-orange-400 transition-all duration-500 shadow-lg hover:shadow-2xl overflow-hidden cursor-pointer transform active:scale-95 relative block flex-shrink-0 w-[160px] snap-start"
                          style={{
                            animation: `fadeInUp 0.6s ease-out ${(index % 12) * 0.05}s both`
                          }}
                        >
                          {/* Gradient Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-pink-500/0 group-hover:from-orange-500/5 group-hover:to-pink-500/5 transition-all duration-500 pointer-events-none z-10"></div>
                          
                          {/* Logo Section */}
                          <div className="aspect-square p-4 flex flex-col items-center justify-center relative bg-gradient-to-br from-gray-50 via-white to-gray-50 group-hover:from-orange-50 group-hover:via-pink-50 group-hover:to-purple-50 transition-all duration-500">
                            {store.logoUrl ? (
                              <div className="w-full h-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                                <img
                                  src={store.logoUrl}
                                  alt={store.name}
                                  className="max-w-full max-h-full object-contain drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-500"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div class="text-gray-400 text-xs text-center font-semibold">${store.name}</div>`;
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs text-center font-semibold group-hover:text-orange-600 transition-colors">
                                {store.name}
                              </div>
                            )}
                            
                            {/* Voucher Badge */}
                            {store.voucherText && (
                              <div className="absolute bottom-1 left-1 right-1 transform translate-y-0 group-hover:translate-y-0 opacity-100 group-hover:opacity-100 transition-all duration-300">
                                <span className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300">
                                  {store.voucherText}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Content Section */}
                          <div className="p-3 border-t border-gray-100 bg-white relative z-20">
                            <h3 className="font-bold text-xs text-gray-900 text-center truncate group-hover:text-orange-600 transition-colors duration-300 mb-1">
                              {store.name}
                            </h3>
                            {store.description && (
                              <p className="text-[10px] text-gray-500 text-center mt-1 line-clamp-2 group-hover:text-gray-600 transition-colors">
                                {store.description}
                              </p>
                            )}
                          </div>

                          {/* Shine Effect */}
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-30"></div>
                        </Link>
                      ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop: Grid Layout */}
                <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {filteredStores.map((store, index) => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.id}`}
                      className="group bg-white rounded-2xl border border-gray-200 hover:border-orange-400 transition-all duration-500 shadow-md hover:shadow-2xl overflow-hidden cursor-pointer transform hover:-translate-y-2 hover:scale-105 relative block"
                      style={{
                        animation: `fadeInUp 0.6s ease-out ${(index % 12) * 0.05}s both`
                      }}
                    >
                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-pink-500/0 group-hover:from-orange-500/5 group-hover:to-pink-500/5 transition-all duration-500 pointer-events-none z-10"></div>
                    
                    {/* Logo Section */}
                    <div className="aspect-square p-4 sm:p-6 flex flex-col items-center justify-center relative bg-gradient-to-br from-gray-50 via-white to-gray-50 group-hover:from-orange-50 group-hover:via-pink-50 group-hover:to-purple-50 transition-all duration-500">
                      {store.logoUrl ? (
                        <div className="w-full h-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                          <img
                            src={store.logoUrl}
                            alt={store.name}
                            className="max-w-full max-h-full object-contain drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-500"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="text-gray-400 text-xs text-center font-semibold">${store.name}</div>`;
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm text-center font-semibold group-hover:text-orange-600 transition-colors">
                          {store.name}
                        </div>
                      )}
                      
                      {/* Voucher Badge */}
                      {store.voucherText && (
                        <div className="absolute bottom-2 left-2 right-2 transform translate-y-0 group-hover:translate-y-0 opacity-100 group-hover:opacity-100 transition-all duration-300">
                          <span className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300">
                            {store.voucherText}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-3 sm:p-4 border-t border-gray-100 bg-white relative z-20">
                      <h3 className="font-bold text-sm sm:text-base text-gray-900 text-center truncate group-hover:text-orange-600 transition-colors duration-300 mb-1">
                        {store.name}
                      </h3>
                      {store.description && (
                        <p className="text-xs text-gray-500 text-center mt-1 line-clamp-2 group-hover:text-gray-600 transition-colors">
                          {store.description}
                        </p>
                      )}
                    </div>

                    {/* Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-30"></div>
                  </Link>
                ))}
              </div>
              </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Newsletter Subscription Section */}
      <NewsletterSubscription />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

