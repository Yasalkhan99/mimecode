'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/hooks/useTranslation';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';

export default function ImprintPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);

    // Last Updated Date - Update this date whenever content changes
    const lastUpdatedDate = new Date('2025-12-03'); // Format: YYYY-MM-DD

    useEffect(() => {
        document.title = `${t('imprint')} - MimeCode`;
        setLoading(false);
    }, [t]);

    // const formatDate = (date: Date) => {
    //     return date.toLocaleDateString('en-US', { 
    //         year: 'numeric', 
    //         month: 'long', 
    //         day: 'numeric' 
    //     });
    // };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Main Content Section */}
            <div className="w-full px-2 sm:px-4 md:px-6 sm:pt-8 md:pt-12 lg:pt-16 bg-white">
                <div className="max-w-7xl mx-auto">
                    {/* Title */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4 sm:mb-6">
                        {t('imprint')} <span className="text-[#ABC443]"></span>
                    </h2>
                    {/* Last Updated Date */}
                    {/* <p className="text-xs sm:text-sm text-gray-500 mb-8 sm:mb-12">
                        Last Updated: {formatDate(lastUpdatedDate)}
                    </p> */}
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>MimeCode</strong> is owned and operated by <strong>Techreforms Inc</strong>.
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>{t('companyInformation')}</strong>
                        <br />
                        <strong>{t('businessName')}:</strong> Techreforms Inc<br />
                        <strong>{t('brand')}:</strong> MimeCode<br />
                        <strong>{t('businessType')}:</strong> Affiliate Marketing / Coupon & Discount Platform<br />
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>{t('registeredAddress')}</strong>
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        811 Wilshire Blvd, Los Angeles, CA 90017, USA
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>{t('contactInformation')}</strong>
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>{t('email')}:</strong> support@mimecode.com<br />
                        <strong>{t('website')}:</strong> www.mimecode.com<br />
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>{t('responsiblePartyForContent')}</strong>
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>Techreforms Inc</strong>
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        811 Wilshire Blvd, Los Angeles, CA 90017
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>{t('legalNotice')}</strong>
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        MimeCode provides promotional offers, coupons, and discount links through affiliate partnerships.<br />
                        Techreforms Inc does not guarantee the availability, accuracy, or validity of third-party offers.
                        All trademarks, logos, and brand names displayed on the website belong to their respective owners.
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>{t('liabilityForExternalLinks')}</strong>
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        Our website contains affiliate links that lead to external merchants. We are not responsible for the content, terms, or privacy practices of these external sites. Visitors access third-party websites at their own risk.
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>{t('copyrightNotice')}</strong>
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        All website content, including text, graphics, logo design, and layout, is the intellectual property of Techreforms Inc unless otherwise stated. Unauthorized copying, distribution, or use is prohibited.
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

