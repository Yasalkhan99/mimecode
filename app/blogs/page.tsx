'use client';

import { useEffect, useState } from 'react';
import { getNews, NewsArticle } from '@/lib/services/newsService';
// import { getBannersWithLayout, Banner } from '@/lib/services/bannerService';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function BlogsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  // const [banners, setBanners] = useState<Banner[]>([]);
  // const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  // const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);

  // Helper function to get timestamp in milliseconds
  const getTimestamp = (timestamp: any): number => {
    if (!timestamp) return 0;
    
    // If it's already a number (milliseconds)
    if (typeof timestamp === 'number') {
      return timestamp;
    }
    
    // If it's a Firestore Timestamp object with toMillis method
    if (timestamp.toMillis && typeof timestamp.toMillis === 'function') {
      return timestamp.toMillis();
    }
    
    // If it's a Firestore Timestamp object with seconds/nanoseconds
    if (timestamp.seconds) {
      return timestamp.seconds * 1000 + Math.floor((timestamp.nanoseconds || 0) / 1000000);
    }
    
    // If it's a Date object
    if (timestamp instanceof Date) {
      return timestamp.getTime();
    }
    
    // If it's an ISO string
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? 0 : date.getTime();
    }
    
    return 0;
  };

  useEffect(() => {
    document.title = 'Blogs & Articles - MimeCode';
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const articlesData = await getNews();
        // const [articlesData, bannersData] = await Promise.all([
        //   getNews(),
        //   getBannersWithLayout()
        // ]);
        // Sort by date (newest first) or createdAt
        const sorted = articlesData.sort((a, b) => {
          const timeA = getTimestamp(a.createdAt);
          const timeB = getTimestamp(b.createdAt);
          return timeB - timeA; // Newest first
        });
        setArticles(sorted);
        setFilteredArticles(sorted);
        // const bannersList = bannersData.filter(Boolean) as Banner[];
        // setBanners(bannersList.slice(0, 4)); // Get first 4 banners
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredArticles(articles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = articles.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query)
      );
      setFilteredArticles(filtered);
    }
  }, [searchQuery, articles]);

  const formatDate = (dateString?: string, timestamp?: any) => {
    if (dateString) return dateString;
    if (timestamp) {
      try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch {
        return null;
      }
    }
    return null;
  };

  // // Auto-slide banners - COMMENTED OUT (only on home page)
  // useEffect(() => {
  //   if (banners.length <= 1) return;
  //   
  //   const interval = setInterval(() => {
  //     setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  //     setDirection(1);
  //   }, 5000); // Change banner every 5 seconds

  //   return () => clearInterval(interval);
  // }, [banners.length]);

  // // Swipe handlers
  // const handlePrev = () => {
  //   setDirection(-1);
  //   setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  // };

  // const handleNext = () => {
  //   setDirection(1);
  //   setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  // };

  // const slideVariants = {
  //   enter: (direction: number) => ({
  //     x: direction > 0 ? '100%' : '-100%',
  //     opacity: 0,
  //     scale: 0.9
  //   }),
  //   center: {
  //     zIndex: 1,
  //     x: 0,
  //     opacity: 1,
  //     scale: 1
  //   },
  //   exit: (direction: number) => ({
  //     zIndex: 0,
  //     x: direction < 0 ? '100%' : '-100%',
  //     opacity: 0,
  //     scale: 0.9
  //   })
  // };

  // const swipeConfidenceThreshold = 10000;
  // const swipePower = (offset: number, velocity: number) => {
  //   return Math.abs(offset) * velocity;
  // };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Banner Section - COMMENTED OUT (only on home page) */}
      {/* 
      {banners.length > 0 && (
        <section className="relative w-full bg-white py-4 sm:py-6 md:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
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

            {banners.length > 1 && (
              <>
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
      */}

      {/* Fallback if no banners - COMMENTED OUT (only on home page) */}
      {/* 
      {banners.length === 0 && !loading && (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#ABC443]/10 via-white to-[#9BB03A]/10 py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900">Welcome to MimeCode</h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">Discover the best deals and savings</p>
          </div>
        </section>
      )}
      */}
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full bg-gradient-to-r from-[#ABC443]/10 via-[#41361A]/5 to-[#ABC443]/10 py-12 sm:py-16 md:py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4"
            >
              <span className="text-gray-900">Recent</span>{' '}
              <span className="text-[#ABC443]">News & Articles</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Stay updated with the latest trends, tips, and insights about coupons, deals, and savings
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full px-4 sm:px-6 md:px-8 py-8 bg-white border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mx-auto">
            <motion.div 
              whileFocus={{ scale: 1.02 }}
              className="relative"
            >
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABC443] focus:border-[#ABC443] transition-all text-gray-900"
              />
              <svg 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Articles Section */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-16"
            >
              <motion.svg 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="w-24 h-24 mx-auto text-gray-300 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </motion.svg>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery ? 'No articles found' : 'No articles yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try searching with different keywords' 
                  : 'Check back soon for new articles and updates'}
              </p>
              {searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchQuery('')}
                  className="bg-gradient-to-r from-[#ABC443] to-[#41361A] hover:from-[#41361A] hover:to-[#ABC443] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
                >
                  Clear Search
                </motion.button>
              )}
            </motion.div>
          ) : (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="mb-6 sm:mb-8"
              >
                <p className="text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredArticles.length}</span> of <span className="font-semibold text-gray-900">{articles.length}</span> articles
                </p>
              </motion.div>
              
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
              >
                <AnimatePresence mode="popLayout">
                  {filteredArticles.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      transition={{ 
                        duration: 0.4,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group border border-gray-100 hover:border-[#ABC443]/30 flex flex-col"
                    >
                      {/* Image */}
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200"
                      >
                        {article.imageUrl ? (
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ABC443]/20 to-[#41361A]/20">
                                    <svg class="w-16 h-16 text-[#ABC443]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                `;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ABC443]/20 to-[#41361A]/20">
                            <svg className="w-16 h-16 text-[#ABC443]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Date Badge */}
                        {formatDate(article.date, article.createdAt) && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="absolute top-4 right-4 bg-gradient-to-r from-[#ABC443] to-[#41361A] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                          >
                            {formatDate(article.date, article.createdAt)}
                          </motion.div>
                        )}
                        
                        {/* Gradient Overlay on Hover */}
                        <motion.div 
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                        ></motion.div>
                      </motion.div>

                      {/* Content - Flex column with flex-grow for spacing */}
                      <div className="p-6 flex flex-col flex-grow">
                        {/* Title */}
                        <motion.h3 
                          whileHover={{ color: '#ABC443' }}
                          className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 transition-colors"
                        >
                          {article.title || 'Untitled Article'}
                        </motion.h3>

                        {/* Description - Flex grow to push button down */}
                        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-grow">
                          {article.description || 'No description available'}
                        </p>

                        {/* Read More Button - Fixed at bottom */}
                        <div className="mt-auto">
                          {article.id ? (
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Link
                                href={`/blogs/${article.id}`}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ABC443] to-[#41361A] hover:from-[#41361A] hover:to-[#ABC443] text-white font-semibold px-5 py-2.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg w-full justify-center"
                              >
                                Read More
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            </motion.div>
                          ) : (
                            <div className="inline-flex items-center gap-2 bg-gray-200 text-gray-500 font-semibold px-5 py-2.5 rounded-lg cursor-not-allowed w-full justify-center">
                              Read More
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
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

