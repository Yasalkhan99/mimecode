'use client';

import { useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

export default function TermsAndConditionsPage() {
  useEffect(() => {
    document.title = 'Terms and Conditions - AvailCoupon';
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Terms and Conditions
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            Last updated: January 2025
          </p>

          <div className="prose prose-sm sm:prose-base max-w-none space-y-6 sm:space-y-8">
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                1. Agreement to Terms
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing and using AvailCoupon ("the Website"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="text-gray-700 leading-relaxed">
                These Terms and Conditions ("Terms") govern your access to and use of our website, services, and applications. By using our services, you agree to comply with and be bound by these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                2. Use of the Website
              </h2>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
                2.1 Eligibility
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You must be at least 18 years old to use this website. By using the website, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into these Terms.
              </p>
              
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
                2.2 Acceptable Use
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to use the website only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the website. Prohibited behavior includes:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
                <li>Harassing, abusing, or harming other users</li>
                <li>Transmitting any viruses, malware, or malicious code</li>
                <li>Attempting to gain unauthorized access to the website or its systems</li>
                <li>Using automated systems to scrape or collect data without permission</li>
                <li>Impersonating any person or entity</li>
                <li>Violating any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                3. Coupon Codes and Deals
              </h2>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
                3.1 Availability
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We strive to provide accurate and up-to-date coupon codes and deals. However, we cannot guarantee that all coupons will be valid, available, or applicable to your purchase. Coupon codes are subject to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
                <li>Expiration dates and time limitations</li>
                <li>Terms and conditions set by the retailer</li>
                <li>Geographic restrictions</li>
                <li>Minimum purchase requirements</li>
                <li>Product or category exclusions</li>
              </ul>
              
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
                3.2 No Warranty
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not warrant or guarantee that any coupon code will work, be valid, or provide the discount advertised. The validity and applicability of coupon codes are determined solely by the retailers. We are not responsible if a retailer refuses to honor a coupon code.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                4. Intellectual Property
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                All content on this website, including but not limited to text, graphics, logos, images, and software, is the property of AvailCoupon or its content suppliers and is protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may not:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
                <li>Reproduce, distribute, or create derivative works from our content without permission</li>
                <li>Use our trademarks or logos without written consent</li>
                <li>Remove any copyright or proprietary notices from our content</li>
                <li>Use our content for commercial purposes without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                5. User Accounts
              </h2>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
                5.1 Account Creation
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Some features of our website may require you to create an account. When creating an account, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
              
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
                5.2 Account Termination
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to suspend or terminate your account at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                6. Third-Party Links and Services
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our website contains links to third-party websites, including retailer websites where you can redeem coupons. These links are provided for your convenience only. We do not:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
                <li>Endorse or assume responsibility for third-party websites</li>
                <li>Control the content, privacy policies, or practices of third-party sites</li>
                <li>Guarantee the accuracy or completeness of information on third-party sites</li>
                <li>Have any liability for transactions between you and third-party retailers</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Your interactions with third-party retailers are solely between you and the retailer. We are not responsible for any disputes, issues, or transactions that arise from your use of third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                7. Disclaimers and Limitations of Liability
              </h2>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
                7.1 No Warranties
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                THE WEBSITE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>
              
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
                7.2 Limitation of Liability
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, AVAILCOUPON SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                8. Indemnification
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to indemnify, defend, and hold harmless AvailCoupon, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
                <li>Your use of the website</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Your violation of any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                9. Modifications to Terms
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the website after such modifications constitutes your acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                10. Governing Law and Dispute Resolution
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions. Any disputes arising out of or relating to these Terms or the website shall be resolved through binding arbitration or in the appropriate courts.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                11. Severability
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                12. Contact Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> legal@availcoupon.com
                </p>
                <p className="text-gray-700">
                  <strong>Website:</strong> www.availcoupon.com
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

