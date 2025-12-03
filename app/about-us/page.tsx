'use client';

import { useEffect, useState } from 'react';
// import { getBannerByLayoutPosition, Banner } from '@/lib/services/bannerService';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';

export default function AboutUsPage() {
  // const [banner7, setBanner7] = useState<Banner | null>(null);
  // const [banner8, setBanner8] = useState<Banner | null>(null);
  // const [banner9, setBanner9] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = 'About Us - MimeCode';

    const fetchBanners = async () => {
      setLoading(true);
      try {
        // const [data7, data8, data9] = await Promise.all([
        //   getBannerByLayoutPosition(7),
        //   getBannerByLayoutPosition(8),
        //   getBannerByLayoutPosition(9)
        // ]);
        // setBanner7(data7);
        // setBanner8(data8);
        // setBanner9(data9);
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

      {/* Banner Section with Layout 7 - COMMENTED OUT (only on home page) */}
      {/* <div className="w-full">
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
          <div className="w-full aspect-[1728/547] min-h-[200px] sm:min-h-[250px] bg-gradient-to-r from-[#ABC443]/20 to-[#41361A]/20"></div>
        )}
      </div> */}

      {/* Main Content Section */}
      <div className="w-full px-2 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 sm:mb-12">
            About <span className="text-[#ABC443]">Us</span>
          </h2>
          <p className="text-xs text-center pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
            MimeCode is a smart-saving platform owned by Techreforms Inc, built to help shoppers find the best deals, discounts, and exclusive coupon codes across thousands of online stores. Our goal is simple — make online shopping more affordable, more rewarding, and absolutely hassle-free.
            We partner with trusted global brands and affiliate networks to bring verified, active, and top-value coupons directly to our users.

          </p>

          {/* Top Section - Text Left, Image Right */}
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-stretch md:items-center mb-6 sm:mb-8 md:mb-12">
            {/* Left Side - Text Content */}
            <div className="w-full md:w-1/2">
              {/* Text Box */}
              <div className="w-full min-h-[300px] sm:min-h-[400px] md:aspect-[618/588] md:max-h-[588px] rounded-lg overflow-hidden shadow-xl bg-gradient-to-br from-[#ABC443]/10 via-white to-[#41361A]/10 relative flex flex-col border-2 border-[#ABC443]/20">
                {/* Decorative Corner Elements */}
                <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-t-2 sm:border-t-3 md:border-t-4 border-l-2 sm:border-l-3 md:border-l-4 border-[#ABC443] rounded-tl-lg"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-b-2 sm:border-b-3 md:border-b-4 border-r-2 sm:border-r-3 md:border-r-4 border-[#ABC443] rounded-br-lg"></div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 md:p-8 lg:p-12 relative z-10">
                  <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#ABC443] to-[#41361A] flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1 shadow-md">
                      <span className="text-white font-bold text-xs sm:text-sm">•</span>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                      Our <span className="text-[#ABC443]">Mission</span>
                    </h3>
                  </div>

                  <div className="ml-0 sm:ml-8 md:ml-11 space-y-2 sm:space-y-3 md:space-y-4">
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                      Our mission is to empower every shopper to save more on every purchase.
                      We work around the clock to:
                    </p>
                    <ul className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed list-disc pl-5 sm:pl-6 md:pl-7 space-y-1 sm:space-y-2">
                      <li>Curate the latest coupon codes</li>
                      <li>Negotiate exclusive deals</li>
                      <li>Provide honest, updated, and reliable savings opportunities</li>
                    </ul>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                      At MimeCode, we believe that <strong>smart shopping is the future</strong> — and we’re here to make it easier for everyone.
                    </p>
                  </div>

                  {/* Decorative Line */}
                  <div className="ml-0 sm:ml-8 md:ml-11 mt-4 sm:mt-5 md:mt-6 w-16 sm:w-20 md:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-[#ABC443] to-[#41361A] rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Right Side - Layout 8 Banner Image - COMMENTED OUT (only on home page) */}
            <div className="w-full md:w-1/2">
              <div className="w-full min-h-[300px] sm:min-h-[400px] md:aspect-[618/588] md:max-h-[588px] flex items-center justify-center bg-gray-100 rounded-lg"></div>
              {/* {loading ? (
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
              )} */}
            </div>
          </div>

          {/* Bottom Section - Image Left, Text Right */}
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-stretch md:items-center">
            {/* Left Side - Layout 9 Banner Image - COMMENTED OUT (only on home page) */}
            <div className="w-full md:w-1/2">
              <div className="w-full min-h-[300px] sm:min-h-[400px] md:aspect-[618/588] md:max-h-[588px] flex items-center justify-center bg-gray-100 rounded-lg"></div>
              {/* {loading ? (
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
              )} */}
            </div>

            {/* Right Side - Text Content */}
            <div className="w-full md:w-1/2">
              {/* Text Box */}
              <div className="w-full min-h-[300px] sm:min-h-[400px] md:aspect-[618/588] md:max-h-[588px] rounded-lg overflow-hidden shadow-xl bg-gradient-to-br from-[#ABC443]/10 via-white to-[#41361A]/10 relative flex flex-col border-2 border-[#ABC443]/20">
                {/* Decorative Corner Elements */}
                <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-t-2 sm:border-t-3 md:border-t-4 border-l-2 sm:border-l-3 md:border-l-4 border-[#ABC443] rounded-tl-lg"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-b-2 sm:border-b-3 md:border-b-4 border-r-2 sm:border-r-3 md:border-r-4 border-[#ABC443] rounded-br-lg"></div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 md:p-8 lg:p-12 relative z-10">
                  <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#ABC443] to-[#41361A] flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1 shadow-md">
                      <span className="text-white font-bold text-xs sm:text-sm">•</span>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                      What <span className="text-[#ABC443]">We Offer</span>
                    </h3>
                  </div>

                  <div className="ml-0 sm:ml-8 md:ml-11 space-y-2 sm:space-y-3 md:space-y-4">
                    <ul className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed list-disc pl-5 sm:pl-6 md:pl-7 space-y-1 sm:space-y-2">
                      <li><strong>Exclusive Coupons & Discount Codes</strong></li>
                      <li><strong>Special Seasonal Deals</strong> (Black Friday, Cyber Monday, Holiday Sales & more)</li>
                      <li><strong>Brand Offers from Top Retailers</strong></li>
                      <li><strong>Verified & Updated Savings</strong> backed by trusted affiliate partnerships</li>
                    </ul>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                      Whether you’re shopping for fashion, tech, beauty, home essentials, or travel — MimeCode ensures you never pay full price again.
                    </p>
                    {/* <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                      Our mission is to create a smarter, more rewarding shopping experience by tracking seasonal sales, exclusive offers, and limited-time deals across easy-to-navigate categories.
                    </p> */}
                  </div>

                  {/* Decorative Line */}
                  <div className="ml-0 sm:ml-8 md:ml-11 mt-4 sm:mt-5 md:mt-6 w-16 sm:w-20 md:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-[#ABC443] to-[#41361A] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex pt-12 flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-stretch md:items-center mb-6 sm:mb-8 md:mb-12">
            {/* Left Side - Text Content */}
            <div className="w-full md:w-1/2">
              {/* Text Box */}
              <div className="w-full min-h-[300px] sm:min-h-[400px] md:aspect-[618/588] md:max-h-[588px] rounded-lg overflow-hidden shadow-xl bg-gradient-to-br from-[#ABC443]/10 via-white to-[#41361A]/10 relative flex flex-col border-2 border-[#ABC443]/20">
                {/* Decorative Corner Elements */}
                <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-t-2 sm:border-t-3 md:border-t-4 border-l-2 sm:border-l-3 md:border-l-4 border-[#ABC443] rounded-tl-lg"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-b-2 sm:border-b-3 md:border-b-4 border-r-2 sm:border-r-3 md:border-r-4 border-[#ABC443] rounded-br-lg"></div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 md:p-8 lg:p-12 relative z-10">
                  <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#ABC443] to-[#41361A] flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1 shadow-md">
                      <span className="text-white font-bold text-xs sm:text-sm">•</span>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                      Our <span className="text-[#ABC443]">Vision</span>
                    </h3>
                  </div>

                  <div className="ml-0 sm:ml-8 md:ml-11 space-y-2 sm:space-y-3 md:space-y-4">
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                      To become a leading global savings platform where shoppers can trust every coupon, discover new brands, and enjoy seamless savings with every click.
                    </p>
                  </div>

                  {/* Decorative Line */}
                  <div className="ml-0 sm:ml-8 md:ml-11 mt-4 sm:mt-5 md:mt-6 w-16 sm:w-20 md:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-[#ABC443] to-[#41361A] rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Right Side - Layout 8 Banner Image - COMMENTED OUT (only on home page) */}
            <div className="w-full md:w-1/2">
              <div className="w-full min-h-[300px] sm:min-h-[400px] md:aspect-[618/588] md:max-h-[588px] flex items-center justify-center bg-gray-100 rounded-lg"></div>
              {/* {loading ? (
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
              )} */}
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

