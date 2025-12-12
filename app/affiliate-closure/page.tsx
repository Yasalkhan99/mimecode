'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';

export default function AffiliateClosurePage() {

    const [loading, setLoading] = useState(true);

    //   useEffect(() => {
    //     document.title = 'About Us - MimeCode';

    //     const fetchBanners = async () => {
    //       setLoading(true);
    //       try {
    //         const [data7, data8, data9] = await Promise.all([
    //           getBannerByLayoutPosition(7),
    //           getBannerByLayoutPosition(8),
    //           getBannerByLayoutPosition(9)
    //         ]);
    //         setBanner7(data7);
    //         setBanner8(data8);
    //         setBanner9(data9);
    //       } catch (error) {
    //         console.error('Error fetching about us banners:', error);
    //       } finally {
    //         setLoading(false);
    //       }
    //     };
    //     fetchBanners();
    //   }, []);

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
            <div className="w-full px-2 sm:px-4 md:px-6 sm:pt-8 md:pt-12 lg:pt-16 bg-white">
                <div className="max-w-7xl mx-auto">
                    {/* Title */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 sm:mb-12">
                        Affiliate <span className="text-[#ABC443]">Disclosure</span>
                    </h2>
                    <p className="text-xs  pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        MimeCode, operated by Techreforms Inc, participates in affiliate marketing programs. This means all outbound links on our website are affiliate links. When you click on these links and make a purchase or complete a qualifying action we may earn a commission at no additional cost to you.
                    </p>
                    <p className="text-xs  pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        Our goal is to provide users with verified coupons, discount codes, and deals that help them save money. The commissions we earn support the operation of our website, content creation, and overall service quality.
                    </p>
                    <p className="text-xs  pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        We only promote brands, stores, and offers we believe provide real value to our users. However, we do not control the availability of coupons, pricing changes, or final purchase conditions on merchant websites.
                    </p>
                    <p className="text-xs  pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        By using MimeCode and clicking on our links, you acknowledge and agree to our use of affiliate links.
                    </p>
                    <p className="text-xs  pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        If you have any questions, feel free to contact us at:
                    </p>
                    <p className="text-xs  pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>Techreforms Inc – MimeCode</strong>
                        <br />
                        811 Wilshire Blvd, Los Angeles, CA 90017
                        <br />
                        support@mimecode.com

                    </p>
                </div>
            </div>

            {/* Newsletter Subscription Section */}
            <NewsletterSubscription />

            {/* Footer */}
            <Footer />
        </div>
    );
}

