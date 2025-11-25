'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFavorites, removeFromFavorites, FavoriteCoupon } from '@/lib/services/favoritesService';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'My Favorites - AvailCoupon';
    loadFavorites();
    
    // Listen for updates
    const handleUpdate = () => loadFavorites();
    window.addEventListener('favoritesUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('favoritesUpdated', handleUpdate);
    };
  }, []);

  const loadFavorites = () => {
    setLoading(true);
    const data = getFavorites();
    setFavorites(data);
    setLoading(false);
  };

  const handleRemove = (couponId: string) => {
    if (confirm('Remove this coupon from favorites?')) {
      removeFromFavorites(couponId);
      loadFavorites();
      window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <Navbar />
      
      {/* Favorites Section */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 bg-white overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              My <span className="text-pink-600">Favorites</span>
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {favorites.length} {favorites.length === 1 ? 'coupon' : 'coupons'} saved
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading favorites...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-gray-500 text-lg mb-2">No favorites yet</p>
              <p className="text-gray-400 text-sm mb-6">Start adding coupons to your favorites!</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all"
              >
                Browse Coupons
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {favorites.map((coupon) => (
                <div
                  key={coupon.couponId}
                  className="group bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-orange-400 hover:shadow-lg transition-all duration-300 relative"
                >
                  <button
                    onClick={() => handleRemove(coupon.couponId)}
                    className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove from favorites"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {coupon.logoUrl && (
                    <div className="mb-3 flex items-center justify-center h-16">
                      <img
                        src={coupon.logoUrl}
                        alt={coupon.storeName || coupon.code}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                      {coupon.code}
                    </h3>
                    {coupon.storeName && (
                      <p className="text-sm text-gray-600 mb-2">{coupon.storeName}</p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-500 mb-3 line-clamp-2">
                      {coupon.description}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {coupon.url && (
                        <a
                          href={coupon.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Use Deal
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <NewsletterSubscription />
      <Footer />
    </div>
  );
}

