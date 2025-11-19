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
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
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
      {/* Add your homepage content below this line */}
    </div>
  );
}
