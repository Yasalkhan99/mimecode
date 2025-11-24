'use client';

import { useEffect, useState } from 'react';
import { getNews, NewsArticle } from '@/lib/services/newsService';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function BlogsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    document.title = 'Blogs & Articles - AvailCoupon';
    
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const data = await getNews();
        // Sort by date (newest first) or createdAt
        const sorted = data.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          }
          return 0;
        });
        setArticles(sorted);
        setFilteredArticles(sorted);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticles();
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 py-12 sm:py-16 md:py-20"
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
              <span className="text-orange-600">News & Articles</span>
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
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900"
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
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
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
                      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group border border-gray-100 hover:border-orange-200 flex flex-col"
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
                                  <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-pink-100">
                                    <svg class="w-16 h-16 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                `;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-pink-100">
                            <svg className="w-16 h-16 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
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
                          whileHover={{ color: '#ea580c' }}
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
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg w-full justify-center"
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

