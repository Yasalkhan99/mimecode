'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCategories, Category } from '@/lib/services/categoryService';
import { getStores, Store } from '@/lib/services/storeService';

export default function Footer() {
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
    <footer className="relative w-full bg-gray-800 text-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* About Us Content Section */}
        <div className="py-12 md:py-16 border-b border-gray-700 bg-gradient-to-b from-[#16a34a]/10 to-[#16a34a]/5">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">
            MimeCode is your place to save every day
          </h2>
          <p className="text-sm md:text-base text-gray-200 leading-relaxed max-w-4xl mx-auto text-center">
            We make it our mission to find you the best coupons, promo codes, deals and sales to ensure you walk away from every shopping experience with savings in tow – in money and time. Whether you're shopping for apparel online, booking a flight, ordering from a favorite restaurant or signing up for a streaming service, MimeCode is here to help you find the best ways to lower your cart total. Beyond our coupons and promo codes, you can receive the latest and greatest deals right in your inbox by signing up for our{' '}
            <Link href="/newsletter" className="text-white hover:text-[#16a34a] underline transition-colors">
              email newsletters
            </Link>
            . And for expert insight into the best sales to shop, the hottest products on the market and the best hacks to help you save at your favorite retailers, be sure to{' '}
            <Link href="/blogs" className="text-white hover:text-[#16a34a] underline transition-colors">
              give our blog a read
            </Link>
            .
          </p>
        </div>

        {/* Footer Grid */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12">
          {/* Logo and Disclaimer */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-pacifico), cursive' }}>
                MimeCode
              </h2>
              <img 
                src="/Group 1171275295.svg" 
                alt="MimeCode Logo" 
                className="h-8 md:h-10 w-auto"
              />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              The use of third-party trademarks and trade names on this website does not imply that mimecode.com is affiliated with or endorsed by the owners of those marks or names.
            </p>
          </div>

          {/* Top Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
            <ul className="space-y-2">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <li key={category.id}>
                    <Link 
                      href={`/categories/${category.id}`}
                      className="text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><span className="text-sm text-gray-300">Fashion</span></li>
                  <li><span className="text-sm text-gray-300">Food</span></li>
                  <li><span className="text-sm text-gray-300">Footwear</span></li>
                  <li><span className="text-sm text-gray-300">Travel</span></li>
                  <li><span className="text-sm text-gray-300">Beauty</span></li>
                  <li><span className="text-sm text-gray-300">Furniture</span></li>
                </>
              )}
            </ul>
          </div>

          {/* Top Stores */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Top Stores</h3>
            <ul className="space-y-2">
              {stores.length > 0 ? (
                stores.map((store) => (
                  <li key={store.id}>
                    <Link 
                      href={`/stores/${store.slug || store.id}`}
                      className="text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      {store.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><span className="text-sm text-gray-300">Amazon</span></li>
                  <li><span className="text-sm text-gray-300">Target</span></li>
                  <li><span className="text-sm text-gray-300">Walmart</span></li>
                  <li><span className="text-sm text-gray-300">Nike</span></li>
                  <li><span className="text-sm text-gray-300">Best Buy</span></li>
                  <li><span className="text-sm text-gray-300">eBay</span></li>
                </>
              )}
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Useful Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/stores" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Stores
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/about-us" className="text-sm text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-sm text-gray-300 hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Subscription and Social Media */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Get hand-picked bargains delivered straight to your inbox by subscribing
            </h3>
            <form onSubmit={handleNewsletterSubmit} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Recipient's username"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16a34a] text-sm"
                  disabled={newsletterLoading}
                  required
                />
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  className="bg-[#16a34a] hover:bg-[#15803d] text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Social Media Icons */}
            <div className="flex items-center gap-3">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <span className="text-white font-bold text-sm">f</span>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <span className="text-white font-bold text-sm">in</span>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                aria-label="X (Twitter)"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                aria-label="Pinterest"
              >
                <span className="text-white font-bold text-sm">p</span>
              </a>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © 2025 MimeCode. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/affiliate-disclosure" className="text-gray-400 hover:text-white transition-colors">
                Affiliate Disclosure
              </Link>
              <span className="text-gray-600">-</span>
              <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span className="text-gray-600">-</span>
              <Link href="/terms-and-conditions" className="text-gray-400 hover:text-white transition-colors">
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

