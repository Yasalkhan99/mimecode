'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { getPrivacyPolicy, PrivacyPolicy } from '@/lib/services/privacyPolicyService';

export default function PrivacyPolicyPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PrivacyPolicy | null>(null);

  useEffect(() => {
    document.title = 'Privacy Policy - MimeCode';
    
    const fetchPrivacyPolicy = async () => {
      try {
        const policyData = await getPrivacyPolicy();
        if (policyData) {
          setData(policyData);
        } else {
          // Fallback to default content if no policy exists
          setData({
            title: 'Privacy Policy',
            content: '<p>Privacy policy content is being loaded...</p>',
            contactEmail: 'privacy@mimecode.com',
            contactWebsite: 'www.mimecode.com',
          });
        }
      } catch (error) {
        console.error('Error fetching privacy policy:', error);
        // Fallback content
        setData({
          title: 'Privacy Policy',
          content: '<p>Unable to load privacy policy content. Please try again later.</p>',
          contactEmail: 'privacy@mimecode.com',
          contactWebsite: 'www.mimecode.com',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyPolicy();
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
          <h1 className="text-3xl text-center sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            {data.title}
          </h1>
          {data.lastUpdated && (
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              Last updated: {new Date(data?.lastUpdated).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}

          <style dangerouslySetInnerHTML={{__html: `
            .privacy-content h1 {
              font-size: 2.25rem;
              font-weight: 700;
              color: #111827;
              margin-top: 2rem;
              margin-bottom: 1rem;
              line-height: 1.2;
            }
            .privacy-content h2 {
              font-size: 1.875rem;
              font-weight: 700;
              color: #111827;
              margin-top: 1.75rem;
              margin-bottom: 0.875rem;
              line-height: 1.3;
            }
            .privacy-content h3 {
              font-size: 1.5rem;
              font-weight: 700;
              color: #111827;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
              line-height: 1.4;
            }
            .privacy-content h4 {
              font-size: 1.25rem;
              font-weight: 700;
              color: #111827;
              margin-top: 1.25rem;
              margin-bottom: 0.625rem;
              line-height: 1.4;
            }
            .privacy-content h5 {
              font-size: 1.125rem;
              font-weight: 700;
              color: #111827;
              margin-top: 1rem;
              margin-bottom: 0.5rem;
              line-height: 1.5;
            }
            .privacy-content h6 {
              font-size: 1rem;
              font-weight: 700;
              color: #111827;
              margin-top: 0.875rem;
              margin-bottom: 0.5rem;
              line-height: 1.5;
            }
            .privacy-content p {
              color: #374151;
              line-height: 1.75;
              margin-bottom: 1rem;
            }
            .privacy-content ul {
              list-style: disc;
              margin-top: 1rem;
              margin-bottom: 1rem;
              padding-left: 1.5rem;
            }
            .privacy-content ol {
              margin-top: 1rem;
              margin-bottom: 1rem;
              padding-left: 1.5rem;
            }
            .privacy-content li {
              margin-bottom: 0.5rem;
              color: #374151;
              line-height: 1.75;
            }
            .privacy-content strong {
              font-weight: 700;
              color: #111827;
            }
            .privacy-content a {
              color: #2563eb;
              text-decoration: underline;
            }
            .privacy-content a:hover {
              color: #1d4ed8;
            }
            @media (min-width: 640px) {
              .privacy-content h1 {
                font-size: 2.5rem;
              }
              .privacy-content h2 {
                font-size: 2.25rem;
              }
              .privacy-content h3 {
                font-size: 1.875rem;
              }
              .privacy-content h4 {
                font-size: 1.5rem;
              }
              .privacy-content h5 {
                font-size: 1.25rem;
              }
              .privacy-content h6 {
                font-size: 1.125rem;
              }
            }
          `}} />
          <div 
            className="privacy-content max-w-none space-y-6 sm:space-y-8"
            dangerouslySetInnerHTML={{ __html: data.content }}
          />

          {/* Contact Section */}
          {/* <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong> {data.contactEmail}
              </p>
              <p className="text-gray-700">
                <strong>Website:</strong> {data.contactWebsite}
              </p>
            </div>
          </section> */}
        </div>
      </div>

      <Footer />
    </div>
  );
}
