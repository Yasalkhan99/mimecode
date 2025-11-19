'use client';

import { useEffect, useState } from 'react';
import { getBannerByLayoutPosition, Banner } from '@/lib/services/bannerService';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';

export default function AboutUsPage() {
  const [banner7, setBanner7] = useState<Banner | null>(null);
  const [banner8, setBanner8] = useState<Banner | null>(null);
  const [banner9, setBanner9] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = 'About Us - AvailCoupon';
    
    const fetchBanners = async () => {
      setLoading(true);
      try {
        const [data7, data8, data9] = await Promise.all([
          getBannerByLayoutPosition(7),
          getBannerByLayoutPosition(8),
          getBannerByLayoutPosition(9)
        ]);
        setBanner7(data7);
        setBanner8(data8);
        setBanner9(data9);
      } catch (error) {
        console.error('Error fetching about us banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Banner Section with Layout 7 - 1728x547 */}
      <div className="w-full">
        {loading ? (
          <div className="w-full bg-gray-100 aspect-[1728/547] min-h-[200px] sm:min-h-[250px] animate-pulse"></div>
        ) : banner7 ? (
          <div className="relative w-full">
            <div className="w-full aspect-[1728/547] min-h-[200px] sm:min-h-[250px]">
              <img
                src={banner7.imageUrl}
                alt={banner7.title || 'About Us'}
                className="w-full h-full object-contain sm:object-cover"
                onError={(e) => {
                  console.error('About Us banner 7 image failed to load:', banner7.imageUrl);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>
        ) : (
          <div className="w-full aspect-[1728/547] min-h-[200px] sm:min-h-[250px] bg-gradient-to-r from-pink-100 to-orange-100"></div>
        )}
      </div>

      {/* Main Content Section */}
      <div className="w-full px-2 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 sm:mb-12">
            The Home of <span className="text-orange-600">Real Deals</span>
          </h2>

          {/* Top Section - Text Left, Image Right */}
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-stretch md:items-center mb-6 sm:mb-8 md:mb-12">
            {/* Left Side - Text Content */}
            <div className="w-full md:w-1/2">
              {/* Text Box */}
              <div className="w-full min-h-[300px] sm:min-h-[400px] md:aspect-[618/588] md:max-h-[588px] rounded-lg overflow-hidden shadow-xl bg-gradient-to-br from-pink-50 via-white to-purple-50 relative flex flex-col border-2 border-pink-200/50">
                {/* Decorative Corner Elements */}
                <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-t-2 sm:border-t-3 md:border-t-4 border-l-2 sm:border-l-3 md:border-l-4 border-orange-400 rounded-tl-lg"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-b-2 sm:border-b-3 md:border-b-4 border-r-2 sm:border-r-3 md:border-r-4 border-orange-400 rounded-br-lg"></div>
                
                {/* Content */}
                <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 md:p-8 lg:p-12 relative z-10">
                  <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1 shadow-md">
                      <span className="text-white font-bold text-xs sm:text-sm">•</span>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                      The Ultimate Guide to Smart Shopping with <span className="text-orange-600">Avail Coupon Code</span>
                    </h3>
                  </div>
                  
                  <div className="ml-0 sm:ml-8 md:ml-11 space-y-2 sm:space-y-3 md:space-y-4">
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                      In a time when the digital marketplace overflows with money-saving opportunities, Avail Coupon Code stands out as the ultimate destination for smart shoppers.
                    </p>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                      We simplify smart shopping by providing reliable, verified, and up-to-date coupons across various categories like fashion, electronics, groceries, and home essentials.
                    </p>
                  </div>
                  
                  {/* Decorative Line */}
                  <div className="ml-0 sm:ml-8 md:ml-11 mt-4 sm:mt-5 md:mt-6 w-16 sm:w-20 md:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Right Side - Layout 8 Banner Image */}
            <div className="w-full md:w-1/2">
              {loading ? (
                <div className="w-full min-h-[300px] sm:min-h-[400px] md:aspect-[618/588] md:max-h-[588px] bg-gray-100 rounded-lg animate-pulse"></div>
              ) : banner8 ? (
                <div className="w-full min-h-[300px] sm:min-h-[400px] md:aspect-[618/588] md:max-h-[588px] flex items-center justify-center">
                  <img
                    src={banner8.imageUrl}
                    alt={banner8.title || 'About Us'}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      console.error('About Us banner 8 image failed to load:', banner8.imageUrl);
                    }}
                  />
                </div>
              ) : (
                <div className="w-full min-h-[300px] sm:min-h-[400px] md:aspect-[618/588] md:max-h-[588px] flex items-center justify-center bg-gray-100 rounded-lg"></div>
              )}
            </div>
          </div>

          {/* Bottom Section - Image Left, Text Right */}
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-stretch md:items-center">
            {/* Left Side - Layout 9 Banner Image */}
            <div className="w-full md:w-1/2">
              {loading ? (
                <div className="w-full min-h-[300px] sm:min-h-[400px] md:aspect-[618/588] md:max-h-[588px] bg-gray-100 rounded-lg animate-pulse"></div>
              ) : banner9 ? (
                <div className="w-full min-h-[300px] sm:min-h-[400px] md:aspect-[618/588] md:max-h-[588px] flex items-center justify-center">
                  <img
                    src={banner9.imageUrl}
                    alt={banner9.title || 'About Us'}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      console.error('About Us banner 9 image failed to load:', banner9.imageUrl);
                    }}
                  />
                </div>
              ) : (
                <div className="w-full min-h-[300px] sm:min-h-[400px] md:aspect-[618/588] md:max-h-[588px] flex items-center justify-center bg-gray-100 rounded-lg"></div>
              )}
            </div>

            {/* Right Side - Text Content */}
            <div className="w-full md:w-1/2">
              {/* Text Box */}
              <div className="w-full min-h-[300px] sm:min-h-[400px] md:aspect-[618/588] md:max-h-[588px] rounded-lg overflow-hidden shadow-xl bg-gradient-to-br from-pink-50 via-white to-purple-50 relative flex flex-col border-2 border-pink-200/50">
                {/* Decorative Corner Elements */}
                <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-t-2 sm:border-t-3 md:border-t-4 border-l-2 sm:border-l-3 md:border-l-4 border-orange-400 rounded-tl-lg"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-b-2 sm:border-b-3 md:border-b-4 border-r-2 sm:border-r-3 md:border-r-4 border-orange-400 rounded-br-lg"></div>
                
                {/* Content */}
                <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 md:p-8 lg:p-12 relative z-10">
                  <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1 shadow-md">
                      <span className="text-white font-bold text-xs sm:text-sm">•</span>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                      The Ultimate Guide to Smart Shopping with <span className="text-orange-600">Avail Coupon Code</span>
                    </h3>
                  </div>
                  
                  <div className="ml-0 sm:ml-8 md:ml-11 space-y-2 sm:space-y-3 md:space-y-4">
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                      Our team consists of bargain hunters, deal experts, and tech-savvy shoppers dedicated to helping you save money. We partner with reputable retailers and regularly test promo codes.
                    </p>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                      Our mission is to create a smarter, more rewarding shopping experience by tracking seasonal sales, exclusive offers, and limited-time deals across easy-to-navigate categories.
                    </p>
                  </div>
                  
                  {/* Decorative Line */}
                  <div className="ml-0 sm:ml-8 md:ml-11 mt-4 sm:mt-5 md:mt-6 w-16 sm:w-20 md:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Newsletter Subscription Section */}
      <NewsletterSubscription />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

