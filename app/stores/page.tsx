'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getBannerByLayoutPosition, getBannersWithLayout, Banner } from '@/lib/services/bannerService';
import { getStores, Store } from '@/lib/services/storeService';
import { getCategories, Category } from '@/lib/services/categoryService';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function StoresPage() {
  const [banner10, setBanner10] = useState<Banner | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showFilter, setShowFilter] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const storesPerPage = 20;

  useEffect(() => {
    // Set page title
    document.title = 'Stores - MimeCode';
    
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bannerData, bannersData, storesData, categoriesData] = await Promise.all([
          getBannerByLayoutPosition(10),
          getBannersWithLayout(),
          getStores(),
          getCategories()
        ]);
        setBanner10(bannerData);
        const bannersList = bannersData.filter(Boolean) as Banner[];
        setBanners(bannersList.slice(0, 4)); // Get first 4 banners
        setStores(storesData);
        setFilteredStores(storesData);
        setCategories(categoriesData);
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
    
    // Helper function to get timestamp in milliseconds
    const getTimestamp = (createdAt: any): number => {
      if (!createdAt) return 0;
      // If it's a Firestore Timestamp object
      if (createdAt.toMillis && typeof createdAt.toMillis === 'function') {
        return createdAt.toMillis();
      }
      // If it's already a number (milliseconds)
      if (typeof createdAt === 'number') {
        return createdAt;
      }
      // If it's a Date object
      if (createdAt instanceof Date) {
        return createdAt.getTime();
      }
      // If it's a string, try to parse it
      if (typeof createdAt === 'string') {
        const parsed = Date.parse(createdAt);
        return isNaN(parsed) ? 0 : parsed;
      }
      // If it's an object with seconds (Firestore Timestamp-like)
      if (createdAt.seconds && typeof createdAt.seconds === 'number') {
        return createdAt.seconds * 1000 + (createdAt.nanoseconds || 0) / 1000000;
      }
      return 0;
    };
    
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => {
          const dateA = getTimestamp(a.createdAt);
          const dateB = getTimestamp(b.createdAt);
          return dateB - dateA;
        });
        break;
      case 'oldest':
        sorted.sort((a, b) => {
          const dateA = getTimestamp(a.createdAt);
          const dateB = getTimestamp(b.createdAt);
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

  // Reset to page 1 when filtered stores change (e.g., after sorting)
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredStores.length, sortBy]);

  // Auto-scroll slider with smooth continuous loop (desktop only)
  useEffect(() => {
    if (!sliderRef.current || filteredStores.length === 0 || isMobile) return;

    const slider = sliderRef.current;
    let animationFrameId: number;
    let scrollPosition = 0;
    const scrollSpeed = 1; // pixels per frame (increased for better visibility)
    let isPaused = false;
    let lastTime = performance.now();
    
    // Pause on hover
    const handleMouseEnter = () => { isPaused = true; };
    const handleMouseLeave = () => { isPaused = false; };
    
    slider.addEventListener('mouseenter', handleMouseEnter);
    slider.addEventListener('mouseleave', handleMouseLeave);
    
    const scroll = (currentTime: number) => {
      if (slider && !isPaused) {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        // Frame-rate independent scrolling
        scrollPosition += scrollSpeed * (deltaTime / 16.67); // Normalize to 60fps
        
        // Calculate the width of first set of items (for seamless loop)
        // We have 3 sets of stores, so divide by 3
        const firstSetWidth = slider.scrollWidth / 3;
        
        if (scrollPosition >= firstSetWidth) {
          // Reset to start seamlessly
          scrollPosition = scrollPosition - firstSetWidth;
        }
        
        slider.scrollLeft = scrollPosition;
      }
      
      animationFrameId = requestAnimationFrame(scroll);
    };

    // Start scrolling
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      slider.removeEventListener('mouseenter', handleMouseEnter);
      slider.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [filteredStores, isMobile]);

  // Auto-slide banners
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      setDirection(1);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  // Swipe handlers
  const handlePrev = () => {
    setDirection(-1);
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

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
      
      {/* Hero Banner Section - Retail Store Style */}
      {banners.length > 0 && (
        <section className="relative w-full bg-white py-4 sm:py-6 md:py-8">
          {/* Container with padding and max-width */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {/* Hero Slider with rounded corners */}
            <div className="relative h-[300px] md:h-[350px] lg:h-[400px] w-full rounded-xl overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {banners.map((banner, index) => {
                if (index !== currentBannerIndex) return null;
                
                return (
                  <motion.div
                    key={banner.id || `banner-${index}`}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.4 }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = swipePower(offset.x, velocity.x);
                      if (swipe < -swipeConfidenceThreshold) {
                        handleNext();
                      } else if (swipe > swipeConfidenceThreshold) {
                        handlePrev();
                      }
                    }}
                    className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing rounded-xl"
                  >
                    <Link href="#" className="block w-full h-full rounded-xl overflow-hidden bg-gray-50">
                      {banner.imageUrl.includes('res.cloudinary.com') || banner.imageUrl.includes('storage.googleapis.com') ? (
                        <Image
                          src={banner.imageUrl}
                          alt={`Banner ${index + 1}`}
                          fill
                          className="object-contain rounded-xl"
                          priority={index === 0}
                          sizes="100vw"
                        />
                      ) : (
                        <img
                          src={banner.imageUrl}
                          alt={`Banner ${index + 1}`}
                          className="w-full h-full object-contain rounded-xl"
                          style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Minimal Navigation - Bottom Right */}
            {banners.length > 1 && (
              <>
                {/* Arrow Navigation */}
                <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
                  <motion.button
                    onClick={handlePrev}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group"
                    aria-label="Previous banner"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </motion.button>
                  <motion.button
                    onClick={handleNext}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group"
                    aria-label="Next banner"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </div>

                {/* Dots Indicator - Bottom Center */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={`banner-dot-${index}`}
                      onClick={() => {
                        setDirection(index > currentBannerIndex ? 1 : -1);
                        setCurrentBannerIndex(index);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentBannerIndex
                          ? 'bg-white w-8'
                          : 'bg-white/50 hover:bg-white/80 w-1.5'
                      }`}
                      aria-label={`Go to banner ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
            </div>
          </div>
        </section>
      )}

      {/* Fallback if no banners */}
      {banners.length === 0 && !loading && (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#ABC443]/10 via-white to-[#9BB03A]/10 py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900">Welcome to MimeCode</h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">Discover the best deals and savings</p>
          </div>
        </section>
      )}

      {/* Stores Grid Section */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12 lg:py-16 bg-white overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 sm:mb-6 md:mb-8">
            All <span className="text-[#ABC443]">Stores</span>
          </h2>

          {/* Main Content with Sidebar Layout */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Main Content Area */}
            <div className="flex-1 w-full md:w-auto min-w-0">

          {/* Filter and Sort Bar */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8 pb-3 sm:pb-4 border-b border-gray-200">
            <div className="text-xs sm:text-sm md:text-base text-gray-600 text-center sm:text-left">
              Showing <span className="font-semibold text-gray-900">{filteredStores.length}</span> of <span className="font-semibold text-gray-900">{stores.length}</span> Results
            </div>
            
            {/* Pagination Info */}
            {(() => {
              // Skip first 6 featured stores for pagination
              const storesForPagination = filteredStores.slice(6);
              const totalPages = Math.ceil(storesForPagination.length / storesPerPage);
              const startIndex = (currentPage - 1) * storesPerPage;
              const endIndex = startIndex + storesPerPage;
              const showingCount = storesForPagination.length > 0 ? Math.min(endIndex, storesForPagination.length) : 0;
              const showingStart = storesForPagination.length > 0 ? startIndex + 1 : 0;
              
              return totalPages > 1 ? (
                <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                  Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                  {storesForPagination.length > 0 && (
                    <span className="ml-2">
                      (Showing {showingStart}-{showingCount} of {storesForPagination.length} stores)
                    </span>
                  )}
                </div>
              ) : null;
            })()}
            
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
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
                    Featured <span className="text-[#ABC443]">Stores</span>
                  </h3>
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#ABC443]/10 via-[#ABC443]/5 to-[#41361A]/10 p-2 sm:p-3 md:p-4 lg:p-6">
                    <div 
                      ref={sliderRef}
                      className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 overflow-x-hidden scrollbar-hide pb-2 pt-2"
                      style={{ scrollBehavior: 'auto' }}
                    >
                      {/* Mobile: Show only first 6 stores, Desktop: Show duplicated for seamless loop */}
                      {[...filteredStores.slice(0, 6), ...filteredStores.slice(0, 6), ...filteredStores.slice(0, 6)].map((store, index) => (
                        <Link
                          key={`${store.id}-${index}`}
                          href={`/stores/${store.slug || store.id}`}
                          className="group flex flex-col flex-shrink-0 w-[140px] xs:w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] bg-white rounded-xl sm:rounded-2xl border border-gray-200 hover:border-[#ABC443] active:border-[#41361A] transition-all duration-300 shadow-md hover:shadow-xl active:shadow-lg overflow-hidden cursor-pointer transform active:scale-95 sm:hover:-translate-y-1 sm:hover:scale-[1.02] relative snap-start"
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
                              <div className="text-gray-400 text-sm text-center font-semibold group-hover:text-[#ABC443] transition-colors">
                                {store.name}
                              </div>
                            )}
                          </div>
                          
                          {/* Content Section - Footer */}
                          <div className="px-2 py-1.5 sm:px-3 md:px-4 sm:py-2 border-t border-gray-100 bg-white relative z-20 mt-auto">
                            <h3 className="font-bold text-xs sm:text-sm md:text-base text-gray-900 text-center break-words group-hover:text-[#ABC443] transition-colors duration-300 mb-1 line-clamp-2">
                              {store.name}
                            </h3>
                            {store.voucherText && (
                              <div className="flex justify-center mt-1">
                                <span className="inline-block bg-gradient-to-r from-[#ABC443] to-[#41361A] text-white text-[10px] xs:text-xs font-bold px-2 xs:px-3 py-1 xs:py-1.5 rounded-full shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300 line-clamp-1">
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
              {(() => {
                // Skip first 6 featured stores for pagination
                const storesForPagination = filteredStores.slice(6);
                const totalPages = Math.ceil(storesForPagination.length / storesPerPage);
                const startIndex = (currentPage - 1) * storesPerPage;
                const endIndex = startIndex + storesPerPage;
                const paginatedStores = storesForPagination.slice(startIndex, endIndex);
                
                return storesForPagination.length > 0 ? (
                <div className="mb-4 sm:mb-0">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 px-2 sm:px-0">
                  All <span className="text-[#ABC443]">Stores</span>
                </h3>
                
                {/* Mobile: Horizontal Scroll */}
                <div className="block sm:hidden">
                  <div className="relative -mx-3 sm:-mx-4">
                    {/* Scroll indicator gradient */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
                    <div className="overflow-x-auto scrollbar-hide pb-4 px-3 sm:px-4 snap-x snap-mandatory w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
                      <div className="flex gap-3 sm:gap-4" style={{ width: 'max-content' }}>
                      {paginatedStores.map((store, index) => (
                        <Link
                          key={store.id}
                          href={`/stores/${store.slug || store.id}`}
                          className="group flex flex-col bg-white rounded-xl sm:rounded-2xl border border-gray-200 hover:border-[#ABC443] active:border-[#41361A] transition-all duration-300 shadow-md hover:shadow-xl active:shadow-lg overflow-hidden cursor-pointer transform active:scale-95 relative flex-shrink-0 w-[140px] xs:w-[160px] snap-start"
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
                <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6 max-w-full">
                  {paginatedStores.map((store, index) => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.slug || store.id}`}
                      className="group flex flex-col bg-white rounded-2xl border border-gray-200 hover:border-[#ABC443] transition-all duration-500 shadow-md hover:shadow-2xl overflow-hidden cursor-pointer transform hover:-translate-y-2 hover:scale-105 relative"
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
                        <div className="text-gray-400 text-sm text-center font-semibold group-hover:text-[#ABC443] transition-colors">
                          {store.name}
                        </div>
                      )}
                    </div>
                    
                    {/* Content Section - Footer */}
                    <div className="px-3 py-1.5 sm:px-4 sm:py-2 border-t border-gray-100 bg-white relative z-20 mt-auto">
                      <h3 className="font-bold text-sm sm:text-base text-gray-900 text-center break-words group-hover:text-[#ABC443] transition-colors duration-300 mb-1">
                        {store.name}
                      </h3>
                      {store.voucherText && (
                        <div className="flex justify-center mt-1">
                          <span className="inline-block bg-gradient-to-r from-[#ABC443] to-[#41361A] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300">
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
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-2 sm:px-0">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#ABC443] text-white hover:bg-[#9BB03A] hover:shadow-lg active:scale-95'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Previous</span>
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = 
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1) ||
                        (currentPage === 1 && page <= 3) ||
                        (currentPage === totalPages && page >= totalPages - 2);
                      
                      if (!showPage) {
                        // Show ellipsis
                        const prevPage = page - 1;
                        const nextPage = page + 1;
                        if (
                          (prevPage === 1 || (prevPage >= currentPage - 1 && prevPage <= currentPage + 1)) &&
                          nextPage !== totalPages &&
                          !(nextPage >= currentPage - 1 && nextPage <= currentPage + 1)
                        ) {
                          return (
                            <span key={page} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`min-w-[40px] h-10 px-3 rounded-lg font-semibold transition-all duration-300 ${
                            currentPage === page
                              ? 'bg-[#ABC443] text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 active:scale-95'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#ABC443] text-white hover:bg-[#9BB03A] hover:shadow-lg active:scale-95'
                    }`}
                  >
                    <span>Next</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
              </div>
              ) : null;
              })()}
            </div>
          )}
            </div>

            {/* Sidebar - Desktop Only */}
            <aside className="hidden md:block w-full md:w-72 lg:w-80 flex-shrink-0">
              <div className="sticky top-6 space-y-6">
                {/* Why Trust Us Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Why Trust Us?</h3>
                  <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                    <p>
                      At MimeCode, we are committed to providing you with the best deals and savings opportunities. Our dedicated team works tirelessly to ensure that every coupon and deal we feature is verified, up-to-date, and reliable.
                    </p>
                    <p>
                      We understand the importance of saving money, and that's why we make it our mission to help you find the best discounts from your favorite stores. Whether you're shopping for fashion, electronics, home goods, or anything else, MimeCode is here to help you save.
                    </p>
                    <p>
                      All our coupons and deals are verified and updated regularly. We test each offer to ensure it works, so you can shop with confidence knowing you're getting the best possible savings.
                    </p>
                    <p className="text-xs text-gray-500 mt-4">
                      Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <Link
                    href="/about-us"
                    className="mt-4 inline-block text-sm font-semibold text-[#16a34a] hover:text-[#15803d] transition-colors"
                  >
                    Learn More About Us →
                  </Link>
                </div>

                {/* Related Stores Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Related Stores</h3>
                  {stores.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                      {stores.slice(0, 8).map((store) => (
                        <Link
                          key={store.id}
                          href={`/stores/${store.slug || store.id}`}
                          className="group flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          title={store.name}
                        >
                          {store.logoUrl ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                              <img
                                src={store.logoUrl}
                                alt={store.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<span class="text-xs font-semibold text-gray-500">${store.name.charAt(0)}</span>`;
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                              <span className="text-xs font-semibold text-gray-600">
                                {store.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-gray-700 text-center line-clamp-2 group-hover:text-[#16a34a] transition-colors">
                            {store.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No stores available</p>
                  )}
                  <Link
                    href="/stores"
                    className="mt-4 inline-block text-sm font-semibold text-[#16a34a] hover:text-[#15803d] transition-colors"
                  >
                    View All Stores →
                  </Link>
                </div>

                {/* Popular Categories Section */}
                {categories.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Popular Categories</h3>
                    <div className="space-y-2">
                      {categories.slice(0, 6).map((category) => (
                        <Link
                          key={category.id}
                          href={`/categories/${category.id}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          {category.logoUrl && (
                            <img
                              src={category.logoUrl}
                              alt={category.name}
                              className="w-8 h-8 object-contain flex-shrink-0"
                            />
                          )}
                          <span className="text-sm text-gray-700 group-hover:text-[#16a34a] transition-colors flex-1">
                            {category.name}
                          </span>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-[#16a34a] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/categories"
                      className="mt-4 inline-block text-sm font-semibold text-[#16a34a] hover:text-[#15803d] transition-colors"
                    >
                      View All Categories →
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
      
      {/* Newsletter Subscription Section */}
      <NewsletterSubscription />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

