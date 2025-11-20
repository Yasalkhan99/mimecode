'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getBannerByLayoutPosition, Banner } from '@/lib/services/bannerService';
import { getActiveFAQs, FAQ } from '@/lib/services/faqService';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';
import ContactSupportModal from '@/app/components/ContactSupportModal';

export default function FAQsPage() {
  const [banner11, setBanner11] = useState<Banner | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = 'FAQs - AvailCoupon';
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bannerData, faqsData] = await Promise.all([
          getBannerByLayoutPosition(11),
          getActiveFAQs()
        ]);
        setBanner11(bannerData);
        setFaqs(faqsData);
      } catch (error) {
        console.error('Error fetching FAQs page data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <Navbar />
      
      {/* Banner Section with Layout 11 */}
      <div className="w-full">
        {loading ? (
          <div className="w-full bg-gray-100 aspect-[1728/547] min-h-[200px] sm:min-h-[250px] animate-pulse"></div>
        ) : banner11 ? (
          <div className="relative w-full">
            <div className="relative w-full aspect-[1728/547] min-h-[200px] sm:min-h-[250px]">
              {banner11.imageUrl.includes('res.cloudinary.com') || banner11.imageUrl.includes('storage.googleapis.com') ? (
                <Image
                  src={banner11.imageUrl}
                  alt={banner11.title || 'FAQs'}
                  fill
                  className="object-contain sm:object-cover"
                  priority
                  sizes="100vw"
                  onError={(e) => {
                    console.error('FAQs banner 11 image failed to load:', banner11.imageUrl);
                  }}
                />
              ) : (
                <img
                  src={banner11.imageUrl}
                  alt={banner11.title || 'FAQs'}
                  className="w-full h-full object-contain sm:object-cover"
                  loading="lazy"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('FAQs banner 11 image failed to load:', banner11.imageUrl);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="w-full aspect-[1728/547] min-h-[200px] sm:min-h-[250px] bg-gradient-to-r from-pink-100 to-orange-100"></div>
        )}
      </div>

      {/* FAQs Section */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 bg-white overflow-x-hidden">
        <div className="max-w-4xl mx-auto w-full">

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg p-6 animate-pulse h-24"></div>
              ))}
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">No FAQs available at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  {/* Question */}
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-4 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-lg"
                  >
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 pr-4 flex-1">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0">
                      <svg
                        className={`w-5 h-5 sm:w-6 sm:h-6 text-orange-600 transition-transform duration-300 ${
                          openIndex === index ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Answer */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openIndex === index ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-0">
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Additional Help Section */}
          <div className="mt-12 sm:mt-16 bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 rounded-lg p-6 sm:p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
              Can't find the answer you're looking for? Please contact our support team.
            </p>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="inline-block px-6 sm:px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
      
      {/* Newsletter Subscription Section */}
      <NewsletterSubscription />
      
      {/* Footer */}
      <Footer />

      {/* Contact Support Modal */}
      <ContactSupportModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </div>
  );
}

