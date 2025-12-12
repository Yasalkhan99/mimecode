'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';

export default function GDPRPolicyPage() {
    const [loading, setLoading] = useState(true);

    // Last Updated Date - Update this date whenever content changes
    const lastUpdatedDate = new Date('2025-12-03'); // Format: YYYY-MM-DD

    useEffect(() => {
        document.title = 'GDPR Privacy Policy - MimeCode';
        setLoading(false);
    }, []);

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
                        GDPR Privacy Policy <span className="text-[#ABC443]"></span>
                    </h2>

                    <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed space-y-6 pb-10">
                        <p>
                            At <strong>MimeCode</strong>, we are committed to protecting and respecting your privacy.
                            This Privacy Policy explains how we collect, process, and use your personal information in
                            accordance with the General Data Protection Regulation (GDPR) and other applicable privacy
                            laws within the European Union (EU).
                        </p>

                        <div>
                            <h3 className="font-semibold mb-2">1. Collection of Information</h3>
                            <p className="mb-2">
                                We collect, process, and use personal information about you when you:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Register for our services</li>
                                <li>Interact with our services, including through our website and applications</li>
                                <li>
                                    Connect to our services via third-party platforms, such as social media accounts,
                                    email accounts, or business partners
                                </li>
                                <li>Contact our support team for assistance</li>
                            </ul>
                            <p className="mt-2">
                                We collect certain information when you engage with our services online, and we may also
                                automatically gather data through technologies such as cookies, location tracking, and
                                other analytics tools. Additionally, third parties may share information with us,
                                including merchants or business partners with whom you interact.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">2. Types of Information We May Collect</h3>
                            <p className="mb-2">The personal information we may collect includes, but is not limited to:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>
                                    <strong>Personal Identifiers:</strong> Name, postal address, email address,
                                    telephone number, and tax details (for contest winners or promotions)
                                </li>
                                <li>
                                    <strong>Device and Online Identifiers:</strong> IP address, device IDs, browser
                                    data, system configuration (e.g., operating system), mobile device details
                                    (carrier, installed apps), and session information
                                </li>
                                <li>
                                    <strong>Payment and Transaction Information:</strong> Payment account details,
                                    billing address, and transaction records
                                </li>
                                <li>
                                    <strong>Demographic Information:</strong> Gender, age, household income, marital
                                    status, or other classification characteristics provided in surveys
                                </li>
                                <li>
                                    <strong>Commercial Information:</strong> Details about products, merchants, services
                                    you’ve viewed, purchased, or interacted with, including search history and items
                                    added to your cart
                                </li>
                                <li>
                                    <strong>Internet and Network Activity:</strong> Browsing history, search activities,
                                    and interactions with our website and services
                                </li>
                                <li>
                                    <strong>Sensory Information:</strong> Audio recordings of phone calls, where
                                    applicable and permitted by law
                                </li>
                                <li>
                                    <strong>Account Information:</strong> Login credentials (username, password)
                                </li>
                                <li>
                                    <strong>Inferences:</strong> Data used to infer preferences, behaviors, or
                                    interests based on your activity
                                </li>
                            </ul>
                            <p className="mt-4">
                                In some jurisdictions, certain data we collect may be classified as &quot;sensitive
                                personal data,&quot; such as:
                            </p>
                            <ul className="list-disc list-inside space-y-1 mt-2">
                                <li>
                                    <strong>Sensitive Demographic Information:</strong> Gender, age, income, marital
                                    status (only if provided voluntarily)
                                </li>
                                <li>
                                    <strong>Precise Geolocation Data:</strong> If you have enabled location sharing on
                                    your device
                                </li>
                            </ul>
                            <p className="mt-2">
                                Please note, we do not sell or share sensitive personal data, nor do we use it for
                                targeted advertising as defined under applicable laws (such as those in the U.S.).
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">3. Use of the Information We Collect</h3>
                            <p className="mb-2">We use the information we collect for the following purposes:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>
                                    <strong>Providing Services:</strong> To process your registration, manage your
                                    account, and send technical notices, updates, and security alerts
                                </li>
                                <li>
                                    <strong>Personalization:</strong> To customize content, offers, and
                                    recommendations based on your preferences and interactions with our services
                                </li>
                                <li>
                                    <strong>Marketing Communications:</strong> To send you promotional offers,
                                    newsletters, rewards, discounts, and other marketing information (with your
                                    consent, where applicable)
                                </li>
                                <li>
                                    <strong>Service Improvement:</strong> To analyze usage trends, improve our
                                    services, and optimize user experience
                                </li>
                                <li>
                                    <strong>Fraud Prevention and Security:</strong> To detect and mitigate fraud, spam,
                                    and malicious activities, and to improve our security measures
                                </li>
                                <li>
                                    <strong>Legal Compliance:</strong> To fulfill legal obligations, comply with
                                    regulations, and respond to law enforcement or governmental requests
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">4. Your Privacy Rights Under the GDPR</h3>
                            <p className="mb-2">
                                As a user in the European Union, you have the following rights regarding your personal
                                data:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>
                                    <strong>Right of Access:</strong> You can request access to the personal
                                    information we hold about you and obtain a copy of it.
                                </li>
                                <li>
                                    <strong>Right to Rectification:</strong> You have the right to correct inaccurate
                                    or incomplete personal information we maintain.
                                </li>
                                <li>
                                    <strong>Right to Erasure:</strong> You can request that we delete your personal
                                    data, subject to certain legal exceptions.
                                </li>
                                <li>
                                    <strong>Right to Restrict Processing:</strong> You can request that we restrict the
                                    processing of your personal information in specific circumstances.
                                </li>
                                <li>
                                    <strong>Right to Object:</strong> You have the right to object to processing based
                                    on legitimate interests or for direct marketing purposes.
                                </li>
                                <li>
                                    <strong>Right to Data Portability:</strong> You can request a copy of your personal
                                    information in a structured, commonly used format, and request to transfer it to
                                    another data controller.
                                </li>
                                <li>
                                    <strong>Right to Withdraw Consent:</strong> If you have given consent for certain
                                    data processing activities, you can withdraw that consent at any time.
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">5. How to Exercise Your Rights</h3>
                            <p>
                                To exercise any of your privacy rights, you can contact us at{' '}
                                <a
                                    href="mailto:compliance@mimecode.com"
                                    className="text-[#ABC443] underline break-all"
                                >
                                    compliance@mimecode.com
                                </a>
                                . We will respond to your request in accordance with the GDPR, usually within 30 days.
                            </p>
                            <p className="mt-2">
                                Please note that we may need to verify your identity before processing your request, and
                                in some cases, we may need to retain certain information for legal or business
                                purposes.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">6. Data Security</h3>
                            <p>
                                We take the security of your personal data seriously and have implemented appropriate
                                technical and organizational measures to protect it from unauthorized access,
                                disclosure, alteration, or destruction. These measures are regularly reviewed and
                                updated to ensure the ongoing security of your data.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">7. Data Retention</h3>
                            <p>
                                We retain your personal information for as long as necessary to fulfill the purposes for
                                which it was collected, or as required by law. Once the data is no longer necessary, we
                                will delete or anonymize it in accordance with our data retention policy.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">8. Changes to This Privacy Policy</h3>
                            <p>
                                We may update this Privacy Policy from time to time. If we make significant changes, we
                                will notify you by updating the &quot;Effective Date&quot; at the top of this policy, or
                                by sending you a direct notice. We encourage you to review this policy periodically to
                                stay informed about how we protect your data.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">9. Contact Us</h3>
                            <p className="mb-2">
                                If you have any questions or concerns about this Privacy Policy, or if you wish to
                                exercise your data protection rights, please contact us at:
                            </p>
                            <p>
                                <strong>MimeCode Data Protection Team</strong>
                                <br />
                                Email:{' '}
                                <a
                                    href="mailto:compliance@mimecode.com"
                                    className="text-[#ABC443] underline break-all"
                                >
                                    compliance@mimecode.com
                                </a>
                            </p>
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

