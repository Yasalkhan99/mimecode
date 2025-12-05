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
    <footer className="relative w-full bg-black text-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* About Us Content Section */}
        <div className="bg-[#7F700C] rounded-2xl p-6 sm:p-8 md:p-10 mb-8 md:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-gray-900 italic text-center">
            #MimeCode is your place to save every day
          </h2>
          <p className="text-sm md:text-base text-gray-900 leading-relaxed">
            We make it our mission to find you the best coupons, promo codes, deals and sales to ensure you walk away from every shopping experience with savings in tow — in money and time. Whether you're shopping for apparel online, booking a flight, ordering from a favorite restaurant or signing up for a streaming service, MimeCode is here to help you find the best ways to lower your cart total. Beyond our coupons and promo codes, you can receive the latest and greatest deals right in your inbox by signing up for our{' '}
            <Link href="/newsletter" className="text-gray-900 hover:underline transition-all font-semibold underline">
              email newsletters
            </Link>
            . And for expert insight into the best sales to shop, the hottest products on the market and the best hacks to help you save at your favorite retailers, be sure to{' '}
            <Link href="/blogs" className="text-gray-900 hover:underline transition-all font-semibold underline">
              give our blog a read
            </Link>
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
              The use of third-party trademarks and trade names on this website does not imply that mimecode.com is affiliated with or endorsed by the owners of those marks or names.
            </p>
          </div>

          {/* Top Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Top Categories</h3>
            <ul className="space-y-2.5">
              <li><Link href="/categories/office-stationery" className="text-sm text-gray-300 hover:text-white transition-colors">Office & Stationery</Link></li>
              <li><Link href="/categories/pet-supplies" className="text-sm text-gray-300 hover:text-white transition-colors">Pet Supplies</Link></li>
              <li><Link href="/categories/jewelry-watches" className="text-sm text-gray-300 hover:text-white transition-colors">Jewelry & Watches</Link></li>
              <li><Link href="/categories/travel-hotels" className="text-sm text-gray-300 hover:text-white transition-colors">Travel & Hotels</Link></li>
              <li><Link href="/categories/automotive" className="text-sm text-gray-300 hover:text-white transition-colors">Automotive</Link></li>
              <li><Link href="/categories/toys-kids" className="text-sm text-gray-300 hover:text-white transition-colors">Toys & Kids</Link></li>
              <li><Link href="/categories/books-media" className="text-sm text-gray-300 hover:text-white transition-colors">Books & Media</Link></li>
              <li><Link href="/categories/food-grocery" className="text-sm text-gray-300 hover:text-white transition-colors">Food & Grocery</Link></li>
            </ul>
          </div>

          {/* Top Stores */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Top Stores</h3>
            <ul className="space-y-2.5">
              <li><Link href="/stores/cettire-us" className="text-sm text-gray-300 hover:text-white transition-colors">Cettire US</Link></li>
              <li><Link href="/stores/oakley-us" className="text-sm text-gray-300 hover:text-white transition-colors">Oakley US</Link></li>
              <li><Link href="/stores/pacsun-us" className="text-sm text-gray-300 hover:text-white transition-colors">Pacsun US</Link></li>
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Useful Links</h3>
            <ul className="space-y-2.5">
              <li><Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/stores" className="text-sm text-gray-300 hover:text-white transition-colors">Stores</Link></li>
              <li><Link href="/categories" className="text-sm text-gray-300 hover:text-white transition-colors">Categories</Link></li>
              <li><Link href="/contact-us" className="text-sm text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/about-us" className="text-sm text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/faqs" className="text-sm text-gray-300 hover:text-white transition-colors">FAQs</Link></li>
              <li><Link href="/cookie-policy" className="text-sm text-gray-300 hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link href="/imprint" className="text-sm text-gray-300 hover:text-white transition-colors">Imprint</Link></li>
            </ul>
          </div>
        </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#FFE019] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-900 font-medium">
              © 2025 MimeCode. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

