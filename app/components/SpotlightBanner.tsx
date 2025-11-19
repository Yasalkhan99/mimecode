'use client';

import { useEffect, useState } from 'react';
import { getBannerByLayoutPosition, Banner } from '@/lib/services/bannerService';

export default function SpotlightBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      setLoading(true);
      try {
        const data = await getBannerByLayoutPosition(5);
        setBanner(data);
      } catch (error) {
        console.error('Error fetching spotlight banner:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, []);

  if (loading) {
    return (
      <div className="w-full px-2 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="w-full md:w-1/2 bg-gray-100 rounded-lg h-[568px] animate-pulse"></div>
            <div className="w-full md:w-1/2 bg-gray-100 rounded-lg h-[568px] animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!banner) {
    return null; // Don't show section if no banner at layout 5
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 lg:py-16 bg-white animate-fade-in-up">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-center">
          {/* Left Side - Text Content */}
          <div className="w-full md:w-1/2 space-y-4 sm:space-y-6 animate-slide-in-left">
            {/* Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              <span className="text-gray-900">Spotlight on</span>{' '}
              <span className="text-orange-600">Top Coupons</span>
            </h2>

            {/* Text Box 1 */}
            <div className="border-2 border-dashed border-orange-400 rounded-lg p-4 sm:p-6 bg-orange-50/30 relative">
              <div className="absolute top-3 left-3">
                <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6c0 .59.13 1.14.36 1.64l4 8c.5 1 1.5 1.64 2.64 1.64s2.14-.64 2.64-1.64l4-8zM6 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm7.64 6.64c-.23.5-.36 1.05-.36 1.64 0 2.21 1.79 4 4 4s4-1.79 4-4c0-.59-.13-1.14-.36-1.64l-4-8c-.5-1-1.5-1.64-2.64-1.64s-2.14.64-2.64 1.64l-4 8zm4-6.64c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
                </svg>
              </div>
              <div className="ml-8">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  The Ultimate Guide to Smart Shopping with <span className="text-orange-600">Avail Coupon Code</span>
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  In a time when the digital marketplace overflows with money-saving opportunities, Avail Coupon Code stands out as the ultimate destination for smart shoppers.
                </p>
              </div>
            </div>

            {/* Text Box 2 */}
            <div className="border-2 border-dashed border-orange-400 rounded-lg p-4 sm:p-6 bg-orange-50/30 relative">
              <div className="absolute top-3 left-3">
                <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6c0 .59.13 1.14.36 1.64l4 8c.5 1 1.5 1.64 2.64 1.64s2.14-.64 2.64-1.64l4-8zM6 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm7.64 6.64c-.23.5-.36 1.05-.36 1.64 0 2.21 1.79 4 4 4s4-1.79 4-4c0-.59-.13-1.14-.36-1.64l-4-8c-.5-1-1.5-1.64-2.64-1.64s-2.14.64-2.64 1.64l-4 8zm4-6.64c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
                </svg>
              </div>
              <div className="ml-8">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  The Ultimate Guide to Smart Shopping with <span className="text-orange-600">Avail Coupon Code</span>
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Avail Coupon Code is more than just another name in the crowded world of online shopping — it's a haven for those who love the excitement of finding premium products without the heavy price tag.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Banner Image */}
          <div className="w-full md:w-1/2 animate-slide-in-right">
            <div className="w-full rounded-lg overflow-hidden shadow-lg bg-gradient-to-b from-pink-100 to-purple-100 p-3 sm:p-4">
              <div className="aspect-[618/568] max-h-[300px] sm:max-h-[400px] md:max-h-[568px] flex items-center justify-center">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    console.error('Spotlight banner image failed to load:', banner.imageUrl);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

