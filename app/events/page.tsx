'use client';

import { useEffect, useState } from 'react';
import { getEvents, Event } from '@/lib/services/eventService';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import { motion } from 'framer-motion';

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get date in milliseconds for sorting
  const getDateTimestamp = (date: Date | string | any): number => {
    if (!date) return 0;
    
    if (date instanceof Date) {
      return date.getTime();
    }
    
    if (typeof date === 'string') {
      const d = new Date(date);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    
    // If it's a Firestore Timestamp object
    if (date.toMillis && typeof date.toMillis === 'function') {
      return date.toMillis();
    }
    
    if (date.seconds) {
      return date.seconds * 1000 + Math.floor((date.nanoseconds || 0) / 1000000);
    }
    
    return 0;
  };

  useEffect(() => {
    document.title = 'Events - MimeCode';
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const eventsData = await getEvents();
        
        // Sort by start date (newest first)
        const sorted = eventsData.sort((a, b) => {
          const timeA = getDateTimestamp(a.startDate);
          const timeB = getDateTimestamp(b.startDate);
          return timeB - timeA; // Newest first
        });
        
        setEvents(sorted);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const formatDate = (date: Date | string | any): string => {
    if (!date) return 'N/A';
    try {
      let d: Date;
      if (date instanceof Date) {
        d = date;
      } else if (typeof date === 'string') {
        d = new Date(date);
      } else if (date.toDate && typeof date.toDate === 'function') {
        d = date.toDate();
      } else if (date.seconds) {
        d = new Date(date.seconds * 1000);
      } else {
        d = new Date(date);
      }
      
      if (isNaN(d.getTime())) return 'N/A';
      
      return d.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDateTime = (date: Date | string | any): string => {
    if (!date) return 'N/A';
    try {
      let d: Date;
      if (date instanceof Date) {
        d = date;
      } else if (typeof date === 'string') {
        d = new Date(date);
      } else if (date.toDate && typeof date.toDate === 'function') {
        d = date.toDate();
      } else if (date.seconds) {
        d = new Date(date.seconds * 1000);
      } else {
        d = new Date(date);
      }
      
      if (isNaN(d.getTime())) return 'N/A';
      
      return d.toLocaleDateString('en-US', { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  // Get latest event (first in sorted array)
  const latestEvent = events.length > 0 ? events[0] : null;
  // Get other events (rest of the array)
  const otherEvents = events.length > 1 ? events.slice(1) : [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full bg-gradient-to-r from-[#ABC443]/10 via-[#41361A]/5 to-[#ABC443]/10 py-20 sm:py-16 md:py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4"
            >
              <span className="text-gray-900">Upcoming</span>{' '}
              <span className="text-[#ABC443]">Events</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Stay updated with the latest events, promotions, and special occasions
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Latest Event Banner Section */}
      {loading ? (
        <div className="w-full px-4 sm:px-6 md:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gray-200 rounded-xl h-[400px] animate-pulse"></div>
          </div>
        </div>
      ) : latestEvent ? (
        <section className="w-full px-4 sm:px-6 md:px-8 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
            >
              {/* Banner Image */}
              {latestEvent.bannerUrl && (
                <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <img
                    src={latestEvent.bannerUrl}
                    alt={latestEvent.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>
              )}
              
              {/* Event Content */}
              <div className="p-6 md:p-8 lg:p-12">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                      {latestEvent.title}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm md:text-base text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#ABC443]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold">Starts:</span> {formatDateTime(latestEvent.startDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#ABC443]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold">Ends:</span> {formatDateTime(latestEvent.endDate)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="prose max-w-none mb-6">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {latestEvent.description}
                  </p>
                </div>
                
                {latestEvent.moreDetails && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Event Details</h3>
                    <div className="text-gray-700 whitespace-pre-line">
                      {latestEvent.moreDetails}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      ) : null}

      {/* Other Events Section */}
      {otherEvents.length > 0 && (
        <section className="w-full px-4 sm:px-6 md:px-8 py-12 md:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-8"
            >
              Other <span className="text-[#ABC443]">Events</span>
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {otherEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 hover:border-[#ABC443]/30 flex flex-col"
                >
                  {/* Event Image */}
                  {event.bannerUrl && (
                    <div className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                      <img
                        src={event.bannerUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                    </div>
                  )}
                  
                  {/* Event Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#ABC443]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold">Start:</span> {formatDate(event.startDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#ABC443]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold">End:</span> {formatDate(event.endDate)}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-grow">
                      {event.description}
                    </p>
                    
                    {event.moreDetails && (
                      <div className="mt-auto pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {event.moreDetails}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* No Events Message */}
      {!loading && events.length === 0 && (
        <section className="w-full px-4 sm:px-6 md:px-8 py-20">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <svg 
                className="w-24 h-24 mx-auto text-gray-300 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No events available
              </h3>
              <p className="text-gray-600">
                Check back soon for upcoming events and promotions
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* Newsletter Subscription */}
      <NewsletterSubscription />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
