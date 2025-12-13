'use client';

// This route handles dynamic slugs with language prefixes (e.g., /du/christmas, /es/holiday-events)
// It checks if the slug matches events or blogs slug from page settings

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { getPageSettings } from '@/lib/services/pageSettingsService';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import EventsPageContent from '@/app/events/EventsPageContent';
import EventsPage from '@/app/events/page';

export default function LangSlugPage() {
  const params = useParams();
  const lang = params.lang as string;
  const slug = params.slug as string;
  const [pageType, setPageType] = useState<'events' | 'blogs' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPageType = async () => {
      const settings = await getPageSettings();
      
      if (settings) {
        if (slug === settings.eventsSlug) {
          setPageType('events');
          document.title = `${settings.eventsNavLabel || 'Events'} - MimeCode`;
        } else if (slug === settings.blogsSlug) {
          setPageType('blogs');
          document.title = `${settings.blogsNavLabel || 'Blogs'} - MimeCode`;
        } else {
          // Check if it matches default slugs
          if (slug === 'events') {
            setPageType('events');
            document.title = 'Events - MimeCode';
          } else if (slug === 'blogs') {
            setPageType('blogs');
            document.title = 'Blogs - MimeCode';
          } else {
            // Page not found
            notFound();
          }
        }
      } else {
        // Default check
        if (slug === 'events') {
          setPageType('events');
        } else if (slug === 'blogs') {
          setPageType('blogs');
        } else {
          notFound();
        }
      }
      
      setLoading(false);
    };

    checkPageType();
  }, [slug]);

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
    return <EventsPage />;
  }

  if (pageType === 'blogs') {
    // For now, redirect to the regular blogs page
    if (typeof window !== 'undefined') {
      window.location.href = '/blogs';
    }
    return null;
  }

  return notFound();
}

