'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getEvents, Event } from '@/lib/services/eventService';
import { useTranslation } from '@/lib/hooks/useTranslation';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import { motion } from 'framer-motion';
import { format, isPast, differenceInDays } from 'date-fns';

export default function Events() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGif, setShowGif] = useState(true);

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

  // Play a sound when the user reaches the Events page
  // useEffect(() => {
  //   const audio = new Audio('/festive-christmas-bells-439607.mp3'); // Place event-enter.mp3 in the public folder
  //   audio.volume = 1.0;
  //   audio.play().catch((err) => {
  //     // Autoplay may be blocked by the browser; fail silently
  //     console.warn('Event page sound playback blocked or failed:', err);
  //   });
  // }, []);

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

      return format(d, 'EEEE, MMMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const getDaysUntil = (date: Date | string | any): number | null => {
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
        return null;
      }

      if (isNaN(d.getTime())) return null;

      const days = differenceInDays(d, new Date());
      return days;
    } catch {
      return null;
    }
  };

  const isEventUpcoming = (event: Event) => {
    try {
      let startDate: Date;
      if (event.startDate instanceof Date) {
        startDate = event.startDate;
      } else if (typeof event.startDate === 'string') {
        startDate = new Date(event.startDate);
      } else if (event.startDate?.toDate) {
        startDate = event.startDate.toDate();
      } else if (event.startDate?.seconds) {
        startDate = new Date(event.startDate.seconds * 1000);
      } else {
        return false;
      }
      return !isPast(startDate);
    } catch {
      return false;
    }
  };

  // Get latest event (first in sorted array)
  const latestEvent = events.length > 0 ? events[0] : null;
  // Get other events (rest of the array)
  const otherEvents = events.length > 1 ? events.slice(1) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <Navbar />

      {loading ? (
        <div className="w-full px-4 sm:px-6 md:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl h-[600px] animate-pulse"></div>
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
                      className="w-full h-full"
                      priority
                      fetchPriority="high"
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
                {/* <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-[#ABC443] to-[#9BB03A] hover:from-[#9BB03A] hover:to-[#ABC443] text-white font-bold px-10 py-4 rounded-2xl text-lg transition-all shadow-xl hover:shadow-2xl whitespace-nowrap border-2 border-transparent hover:border-[#ABC443]/20"
                    >
                      Register Now
                    </motion.button> */}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {t('upcomingEvent')}
                    {(() => {
                      const days = getDaysUntil(latestEvent.startDate);
                      if (days !== null && days >= 0) {
                        return <span className="ml-1">• {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}</span>;
                      }
                      return null;
                    })()}
                  </motion.div>
                )}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-4xl font-bold text-black my-5 leading-tight drop-shadow-2xl"
                >
                  {latestEvent.title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-lg text-black mb-10 max-w-3xl mx-auto leading-relaxed font-medium"
                >
                  {latestEvent.description}
                </motion.p>

                {/* <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-[#ABC443] to-[#9BB03A] hover:from-[#9BB03A] hover:to-[#ABC443] text-white font-bold px-12 py-5 rounded-2xl text-lg md:text-xl transition-all shadow-2xl hover:shadow-[#ABC443]/50 border-2 border-white/20"
                  >
                    Join Event
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold px-12 py-5 rounded-2xl text-lg md:text-xl transition-all shadow-xl border-2 border-white/30"
                  >
                    Learn More
                  </motion.button>
                </motion.div> */}
              </motion.div>
            </div>
            {/* <div className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden">
              {latestEvent.bannerUrl ? (
                <Image
                  src={latestEvent.bannerUrl}
                  alt={latestEvent.title}
                  fill
                  className="object-cover"
                  priority
                  fetchPriority="high"
                  sizes="100vw"
                  quality={90}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#ABC443] via-[#9BB03A] to-[#41361A]"></div>
              )}

              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/85"></div>

              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '50px 50px'
                }} />
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 text-center z-10">
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
                      className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-[#ABC443] text-white rounded-full text-sm font-bold shadow-xl backdrop-blur-sm border border-white/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Upcoming Event
                      {(() => {
                        const days = getDaysUntil(latestEvent.startDate);
                        if (days !== null && days >= 0) {
                          return <span className="ml-1">• {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}</span>;
                        }
                        return null;
                      })()}
                    </motion.div>
                  )}

                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight drop-shadow-2xl"
                  >
                    {latestEvent.title}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-xl sm:text-2xl md:text-3xl text-white/95 mb-10 max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-xl"
                  >
                    {latestEvent.description}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-[#ABC443] to-[#9BB03A] hover:from-[#9BB03A] hover:to-[#ABC443] text-white font-bold px-12 py-5 rounded-2xl text-lg md:text-xl transition-all shadow-2xl hover:shadow-[#ABC443]/50 border-2 border-white/20"
                    >
                      Join Event
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold px-12 py-5 rounded-2xl text-lg md:text-xl transition-all shadow-xl border-2 border-white/30"
                    >
                      Learn More
                    </motion.button>
                  </motion.div>
                </motion.div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-2 border-gray-200 shadow-2xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 md:gap-10 text-gray-800">
                      <div className="flex items-center gap-3 group">
                        <div className="p-3 bg-gradient-to-br from-[#ABC443] to-[#9BB03A] rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Start Date</p>
                          <p className="text-base font-bold text-gray-900">{formatDateFull(latestEvent.startDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 group">
                        <div className="p-3 bg-gradient-to-br from-[#ABC443] to-[#9BB03A] rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">End Date</p>
                          <p className="text-base font-bold text-gray-900">{formatDateFull(latestEvent.endDate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
          </section>

          {/* About Event Section - Enhanced */}
          {latestEvent.moreDetails && (
            <section className="w-full px-4 sm:px-6 md:px-8 py-20 md:py-10 bg-white">
              <div className="max-w-7xl mx-auto">
                <div className="">
                  {/* Left Column - Image */}
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="relative mb-4 h-[450px] md:h-[550px] rounded-3xl overflow-hidden shadow-2xl group"
                  >
                    {latestEvent.bannerUrl ? (
                      <Image
                        src={latestEvent.bannerUrl}
                        alt={latestEvent.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#ABC443] to-[#9BB03A]"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    <div className="absolute top-6 left-6">
                      <span className="bg-white/90 backdrop-blur-sm text-[#ABC443] px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        Featured Event
                      </span>
                    </div>
                  </motion.div>

                  {/* Right Column - About Event */}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="space-y-6"
                  >
                    <div>
                      <span className="inline-block text-[#ABC443] font-bold text-sm uppercase tracking-wider mb-4 px-3 py-1 bg-[#ABC443]/10 rounded-full">
                        Event Details
                      </span>
                      <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
                        About This <span className="text-[#ABC443]">Event</span>
                      </h2>
                    </div>
                    <p className="text-gray-700 text-lg md:text-xl leading-relaxed">
                      {latestEvent.description}
                    </p>
                    <div className="bg-gradient-to-br from-[#ABC443]/10 via-[#9BB03A]/5 to-[#ABC443]/10 rounded-2xl p-8 border-2 border-[#ABC443]/20 shadow-lg">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-[#ABC443]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        More Information
                      </h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {latestEvent.moreDetails}
                      </p>
                    </div>
                    {/* <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-[#ABC443] to-[#9BB03A] hover:from-[#9BB03A] hover:to-[#ABC443] text-white font-bold px-10 py-4 rounded-2xl text-lg transition-all shadow-xl hover:shadow-2xl w-full sm:w-auto"
                    >
                      Get Your Ticket
                    </motion.button> */}
                  </motion.div>
                </div>
              </div>
            </section>
          )}
        </>
      ) : null}

      {/* Other Events Section - Enhanced */}
      {otherEvents.length > 0 && (
        <section className="w-full px-4 sm:px-6 md:px-8 py-20 md:py-4 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#ABC443]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#9BB03A]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <span className="inline-block text-[#000] font-bold text-sm tracking-wider mb-4 px-4 py-2 bg-[#ffe019] rounded-full">
                Explore More
              </span>
              <h2 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2 mb-4">
                {t('otherEvents')}
                <Image src="/eventstxt.png" alt="Events" width={120} height={100} />
                {/* <span className="text-[#ABC443]">Events</span> */}
              </h2>
              <p className="text-black text-lg mx-auto">
                {t('exploreMore')}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -12, scale: 1.02 }}
                  className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-300 border border-gray-100"
                >
                  <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    {event.bannerUrl ? (
                      <Image
                        src={event.bannerUrl}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#ABC443] to-[#9BB03A]"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
                    {isEventUpcoming(event) && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-[#ABC443] text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl backdrop-blur-sm border border-white/20">
                          Upcoming
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-2xl font-black text-white drop-shadow-2xl line-clamp-2 mb-2">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold">{formatDate(event.startDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow bg-white">
                    <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed flex-grow text-base">
                      {event.description || 'Join us for an exciting event filled with opportunities and networking.'}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        <span className="font-semibold text-gray-700">Ends:</span> {formatDate(event.endDate)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* No Events Message - Enhanced */}
      {!loading && events.length === 0 && (
        <section className="w-full px-4 sm:px-6 md:px-8 py-32">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-40 h-40 mx-auto mb-8 bg-gradient-to-br from-[#ABC443]/20 to-[#9BB03A]/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-20 h-20 text-[#ABC443]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-4xl font-black text-gray-900 mb-4">
                {t('noEventsAvailable')}
              </h3>
              <p className="text-gray-600 text-xl mb-8">
                {t('checkBackSoonEvents')}
              </p>
              <Link
                href="/"
                className="inline-block bg-gradient-to-r from-[#ABC443] to-[#9BB03A] hover:from-[#9BB03A] hover:to-[#ABC443] text-white font-bold px-8 py-4 rounded-xl transition-all shadow-xl hover:shadow-2xl"
              >
                {t('goToHomepage')}
              </Link>
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
