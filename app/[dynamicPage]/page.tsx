'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { getPageSettings } from '@/lib/services/pageSettingsService';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import EventsPageContent from '@/app/events/EventsPageContent';

export default function DynamicPage() {
  const params = useParams();
  const dynamicPage = params.dynamicPage as string;
  const [pageType, setPageType] = useState<'events' | 'blogs' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPageType = async () => {
      const settings = await getPageSettings();
      
      if (settings) {
        if (dynamicPage === settings.eventsSlug) {
          setPageType('events');
          document.title = `${settings.eventsNavLabel || 'Events'} - MimeCode`;
        } else if (dynamicPage === settings.blogsSlug) {
          setPageType('blogs');
          document.title = `${settings.blogsNavLabel || 'Blogs'} - MimeCode`;
        } else {
          // Check if it matches default slugs
          if (dynamicPage === 'events') {
            setPageType('events');
            document.title = 'Events - MimeCode';
          } else if (dynamicPage === 'blogs') {
            setPageType('blogs');
            document.title = 'Blogs - MimeCode';
          } else {
            // Page not found
            notFound();
          }
        }
      }
      
      setLoading(false);
    };

    checkPageType();
  }, [dynamicPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ABC443] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (pageType === 'events') {
    return (
      <>
        <Navbar />
        <EventsPageContent />
        <NewsletterSubscription />
        <Footer />
      </>
    );
  }

  if (pageType === 'blogs') {
    // For now, redirect to the regular blogs page
    // You can create a BlogsPageContent component similar to EventsPageContent
    if (typeof window !== 'undefined') {
      window.location.href = '/blogs';
    }
    return null;
  }

  return notFound();
}

