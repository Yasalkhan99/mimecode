'use client';

import { useEffect, useState } from 'react';
import { getBannerByLayoutPosition, Banner } from '@/lib/services/bannerService';
import Navbar from '@/app/components/Navbar';
import CategoriesGrid from '@/app/components/CategoriesGrid';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';

export default function CategoriesPage() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = 'Categories - AvailCoupon';
    
    const fetchBanner = async () => {
      setLoading(true);
      try {
        const data = await getBannerByLayoutPosition(6);
        setBanner(data);
      } catch (error) {
        console.error('Error fetching categories banner:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Banner Section with Layout 6 - 1728x547 */}
      <div className="w-full">
        {loading ? (
          <div className="w-full bg-gray-100 aspect-[1728/547] animate-pulse"></div>
        ) : banner ? (
          <div className="relative w-full">
            <div className="w-full aspect-[1728/547]">
              <img
                src={banner.imageUrl}
                alt={banner.title || 'Categories'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Categories banner image failed to load:', banner.imageUrl);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>
        ) : (
          <div className="w-full aspect-[1728/547] bg-gradient-to-r from-pink-100 to-orange-100"></div>
        )}
      </div>

      {/* Categories Grid Section */}
      <CategoriesGrid />
      
      {/* Newsletter Subscription Section */}
      <NewsletterSubscription />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

