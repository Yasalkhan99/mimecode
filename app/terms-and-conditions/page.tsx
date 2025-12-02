'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { getTermsAndConditions, TermsAndConditions } from '@/lib/services/termsService';

export default function TermsAndConditionsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TermsAndConditions | null>(null);

  useEffect(() => {
    document.title = 'Terms and Conditions - MimeCode';
    
    const fetchTerms = async () => {
      try {
        const termsData = await getTermsAndConditions();
        if (termsData) {
          setData(termsData);
        } else {
          // Fallback to default content if no terms exist
          setData({
            title: 'Terms and Conditions',
            content: '<p>Terms and conditions content is being loaded...</p>',
            contactEmail: 'legal@mimecode.com',
            contactWebsite: 'www.mimecode.com',
          });
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
        // Fallback content
        setData({
          title: 'Terms and Conditions',
          content: '<p>Unable to load terms and conditions content. Please try again later.</p>',
          contactEmail: 'legal@mimecode.com',
          contactWebsite: 'www.mimecode.com',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="text-lg font-semibold">Loading...</div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            {data.title}
          </h1>
          {data.lastUpdated && (
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              Last updated: {new Date(data.lastUpdated).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}

          <div 
            className="prose prose-sm sm:prose-base max-w-none space-y-6 sm:space-y-8"
            dangerouslySetInnerHTML={{ __html: data.content }}
          />

          {/* Contact Section */}
          <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong> {data.contactEmail}
              </p>
              <p className="text-gray-700">
                <strong>Website:</strong> {data.contactWebsite}
              </p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
