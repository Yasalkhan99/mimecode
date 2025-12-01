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

export default function ContactUsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  // const [banners, setBanners] = useState<Banner[]>([]);
  // const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  // const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  // Helper function to get timestamp in milliseconds
  const getTimestamp = (timestamp: any): number => {
    if (!timestamp) return 0;
    if (typeof timestamp === 'number') return timestamp;
    if (timestamp.toMillis && typeof timestamp.toMillis === 'function') {
      return timestamp.toMillis();
    }
    if (timestamp.seconds) {
      return timestamp.seconds * 1000 + Math.floor((timestamp.nanoseconds || 0) / 1000000);
    }
    if (timestamp instanceof Date) {
      return timestamp.getTime();
    }
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? 0 : date.getTime();
    }
    return 0;
  };

  useEffect(() => {
    document.title = 'Contact Us - MimeCode';
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const articlesData = await getNews();
        // const [articlesData, bannersData] = await Promise.all([
        //   getNews(),
        //   getBannersWithLayout()
        // ]);
        const sorted = articlesData.sort((a, b) => {
          const timeA = getTimestamp(a.createdAt);
          const timeB = getTimestamp(b.createdAt);
          return timeB - timeA;
        });
        setArticles(sorted);
        setFilteredArticles(sorted);
        // const bannersList = bannersData.filter(Boolean) as Banner[];
        // setBanners(bannersList.slice(0, 4));
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
  //   const interval = setInterval(() => {
  //     setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  //     setDirection(1);
  //   }, 5000);
  //   return () => clearInterval(interval);
  // }, [banners.length]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in all required fields.'
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setSubmitStatus({
        type: 'error',
        message: 'Please enter a valid email address.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you for contacting us! We will get back to you soon.'
        });
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Failed to send message. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus({
        type: 'error',
        message: 'An error occurred. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Banner Section - COMMENTED OUT (only on home page) */}
      {/* {banners.length > 0 && (
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
      )} */}

      {/* Fallback if no banners - COMMENTED OUT (only on home page) */}
      {/* {banners.length === 0 && !loading && (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#ABC443]/10 via-white to-[#9BB03A]/10 py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900">Contact Us</h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">Get in touch with us</p>
          </div>
        </section>
      )} */}
      
      {/* Blog Articles Section */}
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
      <div className="w-full px-4 sm:px-6 md:px-8 py-12 sm:py-16">
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery ? 'No articles found' : 'No articles yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try searching with different keywords' 
                  : 'Check back soon for new articles and updates'}
              </p>
            </motion.div>
          ) : (
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
                {filteredArticles.map((article) => (
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
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ABC443]/20 to-[#41361A]/20">
                          <svg className="w-16 h-16 text-[#ABC443]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      
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
                    </motion.div>

                    <div className="p-6 flex flex-col flex-grow">
                      <motion.h3 
                        whileHover={{ color: '#ABC443' }}
                        className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 transition-colors"
                      >
                        {article.title || 'Untitled Article'}
                      </motion.h3>

                      <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-grow">
                        {article.description || 'No description available'}
                      </p>

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
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="w-full bg-gradient-to-r from-[#ABC443]/10 via-[#ABC443]/5 to-[#41361A]/10 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              Contact <span className="text-[#ABC443]">Us</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Have a question or need help? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                    Get in Touch
                  </h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    We're here to help! Whether you have a question about our coupons, need assistance with your account, or want to provide feedback, we're ready to assist you.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#ABC443] to-[#41361A] rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Email Us</h4>
                        <p className="text-gray-600 mb-2">Send us an email anytime</p>
                        <a href="mailto:contact@mimecode.com" className="text-[#ABC443] hover:text-[#41361A] font-medium">
                          contact@mimecode.com
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#ABC443] to-[#41361A] rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Response Time</h4>
                        <p className="text-gray-600 mb-2">We typically respond within</p>
                        <p className="text-[#ABC443] font-medium">24-48 hours</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Support Hours</h4>
                        <p className="text-gray-600 mb-2">Monday - Friday</p>
                        <p className="text-[#ABC443] font-medium">9:00 AM - 6:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#ABC443]/10 to-[#41361A]/10 rounded-xl p-6 border border-[#ABC443]/20">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Why Contact Us?</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-[#ABC443] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Questions about coupon codes or deals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-[#ABC443] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Technical support or account issues</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-[#ABC443] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Partnership or business inquiries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-[#ABC443] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Feedback and suggestions</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 sm:p-8">
                <div className="mb-6">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Send us a Message
                  </h3>
                  <p className="text-gray-600">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label 
                      htmlFor="name" 
                      className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ABC443] focus:border-transparent text-gray-900 placeholder-gray-400 transition-all bg-gray-50 focus:bg-white"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="email" 
                      className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ABC443] focus:border-transparent text-gray-900 placeholder-gray-400 transition-all bg-gray-50 focus:bg-white"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="subject" 
                      className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ABC443] focus:border-transparent text-gray-900 placeholder-gray-400 transition-all bg-gray-50 focus:bg-white"
                      placeholder="What is this regarding?"
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="message" 
                      className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ABC443] focus:border-transparent text-gray-900 placeholder-gray-400 resize-none transition-all bg-gray-50 focus:bg-white"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  {submitStatus.message && (
                    <div
                      className={`p-4 rounded-xl flex items-start gap-3 ${
                        submitStatus.type === 'success'
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}
                    >
                      <div>
                        {submitStatus.type === 'success' ? (
                          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm">{submitStatus.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-[#ABC443] to-[#41361A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:from-[#41361A] hover:to-[#ABC443]"
                  >
                    {isSubmitting ? (
                      <>
                        <svg 
                          className="h-5 w-5 text-white animate-spin" 
                          fill="none" 
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg 
                          className="w-5 h-5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Subscription */}
      <NewsletterSubscription />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
