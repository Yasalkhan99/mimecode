'use client';

import Link from 'next/link';
import LocalizedLink from './LocalizedLink';
import { useEffect, useState } from 'react';
import { getCategories, Category } from '@/lib/services/categoryService';
import { getStores, Store } from '@/lib/services/storeService';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function Footer() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, storesData] = await Promise.all([
          getCategories(),
          getStores()
        ]);
        setCategories(categoriesData.slice(0, 8));

        // Sort stores by createdAt (latest first) and take only 3
        const sortedStores = [...storesData].sort((a, b) => {
          // Handle different timestamp formats: number (milliseconds), Timestamp object, or undefined
          const getTime = (ts: any): number => {
            if (!ts) return 0;
            if (typeof ts === 'number') return ts; // Already in milliseconds
            if (typeof ts === 'object' && 'toMillis' in ts) return ts.toMillis();
            if (typeof ts === 'object' && 'seconds' in ts) return ts.seconds * 1000;
            return 0;
          };
          const aTime = getTime(a.createdAt);
          const bTime = getTime(b.createdAt);
          return bTime - aTime; // Descending order (newest first)
        });
        setStores(sortedStores.slice(0, 3));
      } catch (error) {
        // Silently handle errors
      }
    };
    fetchData();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setNewsletterLoading(true);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        setNewsletterEmail('');
        alert('Thank you for subscribing!');
      }
    } catch (error) {
      // Silently handle errors
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <footer className="relative w-full bg-black text-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* About Us Content Section */}
        <div className="bg-[#7F700C] rounded-2xl p-6 sm:p-8 md:p-10 mb-8 md:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-gray-900 italic text-center">
            {t('mimecodeIsYourPlace')}
          </h2>
          <p className="text-sm md:text-base text-gray-900 leading-relaxed">
            {t('footerDescription')}{' '}
            <LocalizedLink href="/newsletter" className="text-gray-900 hover:underline transition-all font-semibold underline">
              {t('emailNewsletters')}
            </LocalizedLink>
            . And for expert insight into the best sales to shop, the hottest products on the market and the best hacks to help you save at your favorite retailers, be sure to{' '}
            <LocalizedLink href="/blogs" className="text-gray-900 hover:underline transition-all font-semibold underline">
              {t('giveOurBlogARead')}
            </LocalizedLink>
            .
          </p>
        </div>

        {/* Footer Grid */}
        <div className="pb-8 md:pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Logo and Disclaimer */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/Group 1171275050 (2).svg"
                  alt="HB Mime Code Logo"
                  className="h-10 md:h-12 w-auto"
                />
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {t('disclaimer')}
              </p>
            </div>

            {/* Top Categories */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">{t('topCategories')}</h3>
              <ul className="space-y-2.5">
                <li><LocalizedLink href="/categories/office-stationery" className="text-sm text-gray-300 hover:text-white transition-colors">Office & Stationery</LocalizedLink></li>
                <li><LocalizedLink href="/categories/pet-supplies" className="text-sm text-gray-300 hover:text-white transition-colors">Pet Supplies</LocalizedLink></li>
                <li><LocalizedLink href="/categories/jewelry-watches" className="text-sm text-gray-300 hover:text-white transition-colors">Jewelry & Watches</LocalizedLink></li>
                <li><LocalizedLink href="/categories/travel-hotels" className="text-sm text-gray-300 hover:text-white transition-colors">Travel & Hotels</LocalizedLink></li>
                <li><LocalizedLink href="/categories/automotive" className="text-sm text-gray-300 hover:text-white transition-colors">Automotive</LocalizedLink></li>
                <li><LocalizedLink href="/categories/toys-kids" className="text-sm text-gray-300 hover:text-white transition-colors">Toys & Kids</LocalizedLink></li>
                <li><LocalizedLink href="/categories/books-media" className="text-sm text-gray-300 hover:text-white transition-colors">Books & Media</LocalizedLink></li>
                <li><LocalizedLink href="/categories/food-grocery" className="text-sm text-gray-300 hover:text-white transition-colors">Food & Grocery</LocalizedLink></li>
              </ul>
            </div>

            {/* Top Stores */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">{t('topStores')}</h3>
              <ul className="space-y-2.5">
                <li><LocalizedLink href="/stores/cettire-us" className="text-sm text-gray-300 hover:text-white transition-colors">Cettire US</LocalizedLink></li>
                <li><LocalizedLink href="/stores/oakley-us" className="text-sm text-gray-300 hover:text-white transition-colors">Oakley US</LocalizedLink></li>
                <li><LocalizedLink href="/stores/pacsun-us" className="text-sm text-gray-300 hover:text-white transition-colors">Pacsun US</LocalizedLink></li>
                <li><LocalizedLink href="/stores/maven-trading-usa" className="text-sm text-gray-300 hover:text-white transition-colors">Maven Trading Usa</LocalizedLink></li>
                <li><LocalizedLink href="/stores/saksoff5th-us" className="text-sm text-gray-300 hover:text-white transition-colors">Saks Off 5th Us</LocalizedLink></li>
                <li><LocalizedLink href="/stores/wolfand-badger-uk" className="text-sm text-gray-300 hover:text-white transition-colors">Wolf And Badger Uk</LocalizedLink></li>
                <li><LocalizedLink href="/stores/overstock-us" className="text-sm text-gray-300 hover:text-white transition-colors">Overstock Us</LocalizedLink></li>
                <li><LocalizedLink href="/stores/garnethill-us" className="text-sm text-gray-300 hover:text-white transition-colors">Garnet Hill US</LocalizedLink></li>
                {/* <li><Link href="/stores/dazzle-dry-us" className="text-sm text-gray-300 hover:text-white transition-colors">Dazzle Dry US</Link></li> */}
                {/* <li><Link href="/stores/under-outfit-us" className="text-sm text-gray-300 hover:text-white transition-colors">Under Outfit Us</Link></li> */}
              </ul>
            </div>

            {/* Useful Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">{t('usefulLinks')}</h3>
              <ul className="space-y-2.5">
                <li><LocalizedLink href="/" className="text-sm text-gray-300 hover:text-white transition-colors">{t('home')}</LocalizedLink></li>
                <li><LocalizedLink href="/stores" className="text-sm text-gray-300 hover:text-white transition-colors">{t('stores')}</LocalizedLink></li>
                <li><LocalizedLink href="/categories" className="text-sm text-gray-300 hover:text-white transition-colors">{t('categories')}</LocalizedLink></li>
                <li><LocalizedLink href="/contact-us" className="text-sm text-gray-300 hover:text-white transition-colors">{t('contactUs')}</LocalizedLink></li>
                <li><LocalizedLink href="/about-us" className="text-sm text-gray-300 hover:text-white transition-colors">{t('aboutUs')}</LocalizedLink></li>
                <li><LocalizedLink href="/faqs" className="text-sm text-gray-300 hover:text-white transition-colors">{t('faqs')}</LocalizedLink></li>
                <li><LocalizedLink href="/cookie-policy" className="text-sm text-gray-300 hover:text-white transition-colors">Cookie Policy</LocalizedLink></li>
                <li><LocalizedLink href="/imprint" className="text-sm text-gray-300 hover:text-white transition-colors">Imprint</LocalizedLink></li>
                <li><LocalizedLink href="/gdpr-policy" className="text-sm text-gray-300 hover:text-white transition-colors">GDPR Policy</LocalizedLink></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#FFE019] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6">
            <p className="text-sm text-gray-900 font-medium">
              © 2025 MimeCode. {t('allRightsReserved')}.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <LocalizedLink href="/privacy-policy" className="text-gray-900 hover:underline font-medium transition-colors">
                {t('privacyPolicy')}
              </LocalizedLink>
              <span className="text-gray-900">|</span>
              <LocalizedLink href="/terms-and-conditions" className="text-gray-900 hover:underline font-medium transition-colors">
                {t('termsAndConditions')}
              </LocalizedLink>
              <span className="text-gray-900">|</span>
              <LocalizedLink href="/affiliate-closure" className="text-gray-900 hover:underline font-medium transition-colors">
                {t('affiliateDisclosure')}
              </LocalizedLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

