'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getEvents, Event } from '@/lib/services/eventService';
import { getPageSettings } from '@/lib/services/pageSettingsService';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { motion } from 'framer-motion';
// @ts-ignore - date-fns types issue
import { format, isPast, differenceInDays } from 'date-fns';

export default function EventsPageContent() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGif, setShowGif] = useState(true);
  const [pageTitle, setPageTitle] = useState('Events');

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

    if (date.toMillis && typeof date.toMillis === 'function') {
      return date.toMillis();
    }

    if (date.seconds) {
      return date.seconds * 1000 + Math.floor((date.nanoseconds || 0) / 1000000);
    }

    return 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eventsData, pageSettings] = await Promise.all([
          getEvents(),
          getPageSettings()
        ]);

        // Sort by start date (newest first)
        const sorted = eventsData.sort((a, b) => {
          const timeA = getDateTimestamp(a.startDate);
          const timeB = getDateTimestamp(b.startDate);
          return timeB - timeA; // Newest first
        });

        setEvents(sorted);
        
        // Set dynamic page title from settings
        if (pageSettings && pageSettings.eventsNavLabel) {
          setPageTitle(pageSettings.eventsNavLabel);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDateFull = (date: Date | string | any): string => {
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

      return format(d, 'MMMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

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

      return format(d, 'MMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const isEventUpcoming = (event: Event): boolean => {
    try {
      let startDate: Date;
      if (event.startDate instanceof Date) {
        startDate = event.startDate;
      } else if (typeof event.startDate === 'string') {
        startDate = new Date(event.startDate);
      } else if ((event.startDate as any).toDate && typeof (event.startDate as any).toDate === 'function') {
        startDate = (event.startDate as any).toDate();
      } else if ((event.startDate as any).seconds) {
        startDate = new Date((event.startDate as any).seconds * 1000);
      } else if (typeof event.startDate === 'object' && event.startDate !== null) {
        // Handle Timestamp or other object types
        const ts = event.startDate as any;
        if (ts.seconds) {
          startDate = new Date(ts.seconds * 1000);
        } else {
          startDate = new Date();
        }
      } else {
        startDate = new Date();
      }

      return !isPast(startDate);
    } catch {
      return false;
    }
  };

  const getDaysUntilEvent = (event: Event): number | null => {
    try {
      let startDate: Date;

      if (event.startDate instanceof Date) {
        startDate = event.startDate;
      } else if (typeof event.startDate === 'string') {
        startDate = new Date(event.startDate);
      } else if ((event.startDate as any).toDate && typeof (event.startDate as any).toDate === 'function') {
        startDate = (event.startDate as any).toDate();
      } else if ((event.startDate as any).seconds) {
        startDate = new Date((event.startDate as any).seconds * 1000);
      } else if (typeof event.startDate === 'object' && event.startDate !== null) {
        // Handle Timestamp or other object types
        const ts = event.startDate as any;
        if (ts.seconds) {
          startDate = new Date(ts.seconds * 1000);
        } else {
          return null;
        }
      } else {
        return null;
      }

      if (isNaN(startDate.getTime())) return null;

      return differenceInDays(startDate, new Date());
    } catch {
      return null;
    }
  };

  const latestEvent = events.length > 0 ? events[0] : null;
  const otherEvents = events.length > 1 ? events.slice(1) : [];

  return (
    <div className="min-h-screen bg-white">
      {loading ? (
        <div className="w-full px-4 sm:px-6 md:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gray-100 rounded-3xl h-[600px] animate-pulse"></div>
          </div>
        </div>
      ) : latestEvent ? (
        <>
          <section className="relative w-full overflow-hidden ">
            <div className='relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mt-10'>
              {showGif && (
                <motion.div
                  className="absolute bottom-0 right-0 flex justify-center z-20"
                  initial={{ x: '300%' }}
                  animate={{ x: '-990%' }}
                  transition={{
                    duration: 6,
                    ease: 'linear',
                  }}
                  onAnimationComplete={() => setShowGif(false)}
                >
                  <img
                    src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGY1OXc2NWMyMjQwd3Q0enJkZTg1YThtYjd1eTJ2eWhraTg1bzlxdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Ws99b3pPODCxCe5Iga/giphy.gif"
                    alt="Festive animation"
                    className="w-32 h-32 sm:w-40 sm:h-40"
                  />
                </motion.div>
              )}
              <div className='relative h-[180px] sm:h-[220px] md:h-[260px] lg:h-[450px] w-full rounded-xl overflow-hidden'>
                {
                  latestEvent.bannerUrl && (
                    <Image
                      src={latestEvent.bannerUrl}
                      alt={latestEvent.title}
                      fill
                      className="w-full h-full object-cover"
                      priority
                      sizes="100vw"
                      quality={90}
                    />
                  )
                }
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 md:gap-10 text-gray-800">
                  <div className="flex items-center gap-3 group">
                    <div className="p-3 bg-gradient-to-br from-[#ffe019] to-[#ffe019] rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                      <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{t('startDate')}</p>
                      <p className="text-[14px] font-bold text-gray-900">{formatDateFull(latestEvent.startDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 group">
                    <div className="p-3 bg-gradient-to-br from-[#ffe019] to-[#ffe019] rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                      <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{t('endDate')}</p>
                      <p className="text-[14px] font-bold text-gray-900">{formatDateFull(latestEvent.endDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Content */}
            <div className="mt-4 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 text-center z-10">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-5xl mx-auto"
              >
                {isEventUpcoming(latestEvent) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#ffe019] text-black rounded-full text-sm font-bold shadow-xl backdrop-blur-sm border border-white/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('upcomingEvent')}
                  </motion.div>
                )}

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-4xl pt-3 font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 mb-6 leading-tight"
                >
                  {latestEvent.title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-base sm:text-lg md:text-xl text-gray-700 mb-8 leading-relaxed max-w-3xl mx-auto px-4"
                >
                  {latestEvent.description}
                </motion.p>

                {latestEvent.moreDetails && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="prose prose-lg max-w-4xl mx-auto text-gray-600 mb-10"
                    dangerouslySetInnerHTML={{ __html: latestEvent.moreDetails }}
                  />
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="flex flex-wrap gap-4 justify-center items-center"
                >
                  <Link href="/coupons">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-[#FFE019] hover:bg-[#FFD700] text-gray-900 font-bold px-10 py-4 rounded-2xl text-lg transition-all shadow-xl hover:shadow-2xl whitespace-nowrap"
                    >
                      {t('exploreDeals')}
                    </motion.button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Other Events */}
          {otherEvents.length > 0 && (
            <section className="py-16 px-4 sm:px-6 md:px-8 bg-white">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
                  {t('otherEvents')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {otherEvents.map((event, index) => {
                    const daysUntil = getDaysUntilEvent(event);
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1, duration: 0.6 }}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                      >
                        {event.bannerUrl && (
                          <div className="relative h-48 overflow-hidden">
                            <Image
                              src={event.bannerUrl}
                              alt={event.title}
                              fill
                              className="object-cover transition-transform duration-300 hover:scale-110"
                            />
                            {daysUntil !== null && daysUntil > 0 && (
                              <div className="absolute top-4 right-4 bg-[#ffe019] text-black px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                {daysUntil} days
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-6">
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            {event.title}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-3">
                            {event.description}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(event.startDate)}
                            </span>
                            <span>-</span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(event.endDate)}
                            </span>
                          </div>
                          <Link href="/coupons">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full bg-[#FFE019] hover:bg-[#FFD700] text-gray-900 font-semibold py-3 rounded-xl hover:shadow-lg transition-all"
                            >
                              {t('viewAll')}
                            </motion.button>
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center">
            <div className="mb-8">
              <Image
                src="/eventstxt.png"
                alt="No Events"
                width={200}
                height={100}
                className="mx-auto opacity-50"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('noEventsAvailable')}</h2>
            <p className="text-gray-600 text-lg">
              {t('checkBackSoonEvents')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
