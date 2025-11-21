'use client';

import Link from "next/link";
import Navbar from "./components/Navbar";
import HeroBanners from "./components/HeroBanners";
import HowItWorks from "./components/HowItWorks";
import TrendingStores from "./components/TrendingStores";
import PopularCoupons from "./components/PopularCoupons";
import SpotlightBanner from "./components/SpotlightBanner";
import TrustedPartners from "./components/TrustedPartners";
import RecentNews from "./components/RecentNews";
import NewsletterSubscription from "./components/NewsletterSubscription";
import Footer from "./components/Footer";
import ContactSupportModal from "./components/ContactSupportModal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    // Check if modal has been shown before
    const hasSeenModal = localStorage.getItem('contactModalShown');
    
    if (!hasSeenModal) {
      // Show modal after 4 seconds on first visit
      const timer = setTimeout(() => {
        setIsContactModalOpen(true);
        // Mark as shown in localStorage
        localStorage.setItem('contactModalShown', 'true');
      }, 4000);

      // Cleanup timer on unmount
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseModal = () => {
    setIsContactModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Hero Section with Banners */}
      <HeroBanners />
      {/* How It Works Section */}
      <HowItWorks />
      {/* Trending Stores Section */}
      <TrendingStores />
      {/* Popular Coupons Section */}
      <PopularCoupons />
      {/* Spotlight Banner Section (Layout 5) */}
      <SpotlightBanner />
      {/* Trusted Partners Section (Logos Grid) */}
      <TrustedPartners />
      {/* Recent News & Articles Section */}
      <RecentNews />
      {/* Newsletter Subscription Section */}
      <NewsletterSubscription />
      {/* Footer Section */}
      <Footer />

      {/* Contact Support Modal - Auto show on first visit */}
      <ContactSupportModal 
        isOpen={isContactModalOpen} 
        onClose={handleCloseModal} 
      />
    </div>
  );
}
