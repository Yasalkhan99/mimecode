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
  const [isMobile, setIsMobile] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set page title
    document.title = 'Stores - AvailCoupon';
    
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
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
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
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

  // Auto-scroll slider with smooth continuous loop (desktop only)
  useEffect(() => {
    if (!sliderRef.current || filteredStores.length === 0 || isMobile) return;

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
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12 lg:py-16 bg-white overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 sm:mb-6 md:mb-8">
            All <span className="text-orange-600">Stores</span>
          </h2>

          {/* Filter and Sort Bar */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8 pb-3 sm:pb-4 border-b border-gray-200">
            <div className="text-xs sm:text-sm md:text-base text-gray-600 text-center sm:text-left">
              Showing <span className="font-semibold text-gray-900">{filteredStores.length}</span> of <span className="font-semibold text-gray-900">{stores.length}</span> Results
            </div>
            
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 xs:gap-3 sm:gap-4 w-full">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors text-xs sm:text-sm md:text-base font-medium w-full xs:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </button>
              
              <div className="flex items-center gap-2 w-full xs:w-auto">
                <span className="text-xs sm:text-sm md:text-base text-gray-600 whitespace-nowrap">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 xs:flex-none px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm md:text-base bg-white cursor-pointer"
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
                <div className="mb-4 sm:mb-6 md:mb-12">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 px-2 sm:px-0">
                    Featured <span className="text-orange-600">Stores</span>
                  </h3>
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 p-2 sm:p-3 md:p-4 lg:p-6">
                    <div 
                      ref={sliderRef}
                      className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 overflow-x-auto scrollbar-hide pb-2 pt-2 snap-x snap-mandatory"
                      style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
                    >
                      {/* Mobile: Show only first 6 stores, Desktop: Show duplicated for seamless loop */}
                      {[...filteredStores.slice(0, 6), ...filteredStores.slice(0, 6), ...filteredStores.slice(0, 6)].map((store, index) => (
                        <Link
                          key={`${store.id}-${index}`}
                          href={`/stores/${store.slug || store.id}`}
                          className="group flex flex-col flex-shrink-0 w-[140px] xs:w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] bg-white rounded-xl sm:rounded-2xl border border-gray-200 hover:border-orange-400 active:border-orange-500 transition-all duration-300 shadow-md hover:shadow-xl active:shadow-lg overflow-hidden cursor-pointer transform active:scale-95 sm:hover:-translate-y-1 sm:hover:scale-[1.02] relative snap-start"
                          style={{
                            animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                          }}
                        >
                          {/* Logo Section */}
                          <div className="aspect-[4/3] px-4 pt-3 pb-1.5 sm:px-5 sm:pt-4 sm:pb-2 flex flex-col items-center justify-center relative bg-gradient-to-br from-gray-50 via-white to-gray-50 transition-all duration-500 flex-shrink-0">
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
                          </div>
                          
                          {/* Content Section - Footer */}
                          <div className="px-2 py-1.5 sm:px-3 md:px-4 sm:py-2 border-t border-gray-100 bg-white relative z-20 mt-auto">
                            <h3 className="font-bold text-xs sm:text-sm md:text-base text-gray-900 text-center break-words group-hover:text-orange-600 transition-colors duration-300 mb-1 line-clamp-2">
                              {store.name}
                            </h3>
                            {store.voucherText && (
                              <div className="flex justify-center mt-1">
                                <span className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] xs:text-xs font-bold px-2 xs:px-3 py-1 xs:py-1.5 rounded-full shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300 line-clamp-1">
                                  {store.voucherText}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Shine Effect */}
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-30"></div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* All Stores - Horizontal Scroll on Mobile, Grid on Desktop */}
              {filteredStores.length > 0 && (
                <div className="mb-4 sm:mb-0">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 px-2 sm:px-0">
                  All <span className="text-orange-600">Stores</span>
                </h3>
                
                {/* Mobile: Horizontal Scroll */}
                <div className="block sm:hidden">
                  <div className="relative -mx-3 sm:-mx-4">
                    {/* Scroll indicator gradient */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
                    <div className="overflow-x-auto scrollbar-hide pb-4 px-3 sm:px-4 snap-x snap-mandatory w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
                      <div className="flex gap-3 sm:gap-4" style={{ width: 'max-content' }}>
                      {filteredStores.map((store, index) => (
                        <Link
                          key={store.id}
                          href={`/stores/${store.slug || store.id}`}
                          className="group flex flex-col bg-white rounded-xl sm:rounded-2xl border border-gray-200 hover:border-orange-400 active:border-orange-500 transition-all duration-300 shadow-md hover:shadow-xl active:shadow-lg overflow-hidden cursor-pointer transform active:scale-95 relative flex-shrink-0 w-[140px] xs:w-[160px] snap-start"
                        >
                          {/* Logo Section */}
                          <div className="aspect-[4/3] px-4 pt-3 pb-1.5 flex flex-col items-center justify-center relative bg-gradient-to-br from-gray-50 via-white to-gray-50 transition-all duration-500 flex-shrink-0">
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
                          </div>
                          
                          {/* Content Section - Footer */}
                          <div className="px-2 py-1.5 sm:px-3 border-t border-gray-100 bg-white relative z-20 mt-auto">
                            <h3 className="font-bold text-[11px] xs:text-xs text-gray-900 text-center break-words group-hover:text-orange-600 transition-colors duration-300 mb-1 line-clamp-2">
                              {store.name}
                            </h3>
                            {store.voucherText && (
                              <div className="flex justify-center mt-1">
                                <span className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[9px] xs:text-[10px] font-bold px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300 line-clamp-1">
                                  {store.voucherText}
                                </span>
                              </div>
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
                <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                  {filteredStores.map((store, index) => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.slug || store.id}`}
                      className="group flex flex-col bg-white rounded-2xl border border-gray-200 hover:border-orange-400 transition-all duration-500 shadow-md hover:shadow-2xl overflow-hidden cursor-pointer transform hover:-translate-y-2 hover:scale-105 relative"
                      style={{
                        animation: `fadeInUp 0.6s ease-out ${(index % 12) * 0.05}s both`
                      }}
                    >
                    {/* Logo Section */}
                    <div className="aspect-[4/3] px-4 pt-3 pb-1.5 sm:px-5 sm:pt-4 sm:pb-2 flex flex-col items-center justify-center relative bg-gradient-to-br from-gray-50 via-white to-gray-50 transition-all duration-500 flex-shrink-0">
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
                    </div>
                    
                    {/* Content Section - Footer */}
                    <div className="px-3 py-1.5 sm:px-4 sm:py-2 border-t border-gray-100 bg-white relative z-20 mt-auto">
                      <h3 className="font-bold text-sm sm:text-base text-gray-900 text-center break-words group-hover:text-orange-600 transition-colors duration-300 mb-1">
                        {store.name}
                      </h3>
                      {store.voucherText && (
                        <div className="flex justify-center mt-1">
                          <span className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300">
                            {store.voucherText}
                          </span>
                        </div>
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

