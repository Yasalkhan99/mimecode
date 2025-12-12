'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';

export default function CookiePolicyPage() {
    const [loading, setLoading] = useState(true);
    
    // Last Updated Date - Update this date whenever content changes
    const lastUpdatedDate = new Date('2025-12-03'); // Format: YYYY-MM-DD

    useEffect(() => {
        document.title = 'Cookie Policy - MimeCode';
        setLoading(false);
    }, []);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Main Content Section */}
            <div className="w-full px-2 sm:px-4 md:px-6 sm:pt-8 md:pt-12 lg:pt-16 bg-white">
                <div className="max-w-7xl mx-auto">
                    {/* Title */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4 sm:mb-6">
                        Cookie <span className="text-[#ABC443]">Policy</span>
                    </h2>
                    {/* Last Updated Date */}
                    <p className="text-xs sm:text-sm text-gray-500 mb-8 sm:mb-12">
                        Last Updated: {formatDate(lastUpdatedDate)}
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        This Cookies Policy explains how <strong>MimeCode</strong>, operated by <strong>Techreforms Inc</strong>, uses cookies and similar tracking technologies on our website to enhance your experience, improve performance, and support our affiliate-based operations.
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>What Are Cookies?</strong>
                        <br />
                        Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, understand how you use the platform, and provide a smoother browsing experience.
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        Cookies may be:
                    </p>
                    <ul className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed list-disc pl-5 sm:pl-6 md:pl-7 space-y-1 sm:space-y-2">
                        <li><strong>Session Cookies</strong> (deleted when you close your browser)</li>
                        <li><strong>Persistent Cookies</strong> (remain until they expire or you delete them)</li>
                        <li><strong>First-Party Cookies</strong> (set by our website)</li>
                        <li><strong>Third-Party Cookies</strong> (set by external services such as analytics or affiliate partners)</li>
                    </ul>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>How We Use Cookies</strong>
                        <br />
                        MimeCode uses cookies for the following purposes:
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>a. Essential Cookies</strong>
                        <br />
                        These cookies are required for our website to function properly.
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        They help with:
                    </p>
                    <ul className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed list-disc pl-5 sm:pl-6 md:pl-7 space-y-1 sm:space-y-2">
                        <li>Site navigation</li>
                        <li>Loading pages</li>
                        <li>Security and fraud prevention</li>
                    </ul>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        You cannot disable essential cookies.
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>Analytics Cookies</strong>
                        <br />
                        These help us understand:
                    </p>
                    <ul className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed list-disc pl-5 sm:pl-6 md:pl-7 space-y-1 sm:space-y-2">
                        <li>How visitors use our website</li>
                        <li>Which pages are most visited</li>
                        <li>Performance and user behavior</li>
                    </ul>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        We use tools like Google Analytics and similar services.
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>Affiliate & Marketing Cookies</strong>
                        <br />
                        Since MimeCode is a coupon and affiliate-based service, marketing and tracking cookies are essential.
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        These cookies:
                    </p>
                    <ul className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed list-disc pl-5 sm:pl-6 md:pl-7 space-y-1 sm:space-y-2">
                        <li>Track when a user clicks a coupon or deal</li>
                        <li>Ensure our affiliate partners recognize and credit us</li>
                        <li>Personalize content or offers you may see</li>
                    </ul>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        All outbound links on our website are affiliate links, meaning tracking cookies may be placed by partner networks.
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>Preference Cookies</strong>
                        <br />
                        These save your:
                    </p>
                    <ul className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed list-disc pl-5 sm:pl-6 md:pl-7 space-y-1 sm:space-y-2">
                        <li>Language settings</li>
                        <li>Display options</li>
                        <li>Saved preferences</li>
                    </ul>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        They make your next visit smoother and more personalized.
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>Third-Party Cookies</strong>
                        <br />
                        We may use cookies from:
                    </p>
                    <ul className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed list-disc pl-5 sm:pl-6 md:pl-7 space-y-1 sm:space-y-2">
                        <li>Affiliate networks (e.g., Awin, CJ, Impact, Rakuten, ShareASale)</li>
                        <li>Analytics providers (e.g., Google Analytics)</li>
                        <li>Advertising or performance tools</li>
                    </ul>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        These third parties may track your interaction with our site to monitor conversions and improve experiences.
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>Managing Your Cookie Preferences</strong>
                        <br />
                        You can manage or disable cookies anytime through:
                    </p>
                    <ul className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed list-disc pl-5 sm:pl-6 md:pl-7 space-y-1 sm:space-y-2">
                        <li>Your browser settings</li>
                        <li>Clearing browser data</li>
                        <li>Third-party opt-out pages (e.g., Google Analytics opt-out tool)</li>
                    </ul>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>Please note:</strong>
                        <br />
                        Disabling certain cookies may affect how the website works and limit some functionality.
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        <strong>Updates to This Policy</strong>
                        <br />
                        We may update this Cookies Policy from time to time.
                    </p>
                    <p className="text-xs pb-10 sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                        Any changes will be posted on this page with a revised "Last Updated" date.
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

