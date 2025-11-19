'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCategoryById, Category } from '@/lib/services/categoryService';
import { getStoresByCategoryId, Store } from '@/lib/services/storeService';
import { getCouponsByCategoryId, Coupon } from '@/lib/services/couponService';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Link from 'next/link';

export default function CategoryDetailPage() {
  const params = useParams();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedCoupons, setRevealedCoupons] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [categoryData, storesData, couponsData] = await Promise.all([
          getCategoryById(categoryId),
          getStoresByCategoryId(categoryId),
          getCouponsByCategoryId(categoryId),
        ]);
        
        setCategory(categoryData);
        setStores(storesData);
        setCoupons(couponsData);
      } catch (error) {
        console.error('Error fetching category data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchData();
    }
  }, [categoryId]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  const handleGetDeal = (coupon: Coupon) => {
    if (coupon.id) {
      setRevealedCoupons(prev => new Set(prev).add(coupon.id!));
    }
    if (coupon.url) {
      window.open(coupon.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-xl font-semibold text-gray-600">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Category Not Found</h1>
            <Link href="/categories" className="text-pink-600 hover:underline">
              Back to Categories
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Category Header */}
      <div className="w-full bg-gradient-to-r from-pink-50 to-orange-50 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-md flex-shrink-0"
              style={{ backgroundColor: category.backgroundColor }}
            >
              {category.logoUrl ? (
                <img
                  src={category.logoUrl}
                  alt={category.name}
                  className={`${category.logoUrl.includes('data:image/svg+xml') ? 'w-full h-full' : 'w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14'} object-contain`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: category.backgroundColor }}>
                  <div className="w-3/4 h-3/4 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-700">
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 capitalize truncate">
                {category.name}
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-0.5 sm:mt-1">
                {stores.length} {stores.length === 1 ? 'Store' : 'Stores'} • {coupons.length} {coupons.length === 1 ? 'Coupon' : 'Coupons'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-12">
        {/* Stores Section */}
        {stores.length > 0 && (
          <div className="mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6">Stores</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/stores/${store.id}`}
                  className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 md:p-4 lg:p-6 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex flex-col items-center text-center">
                    {store.logoUrl ? (
                      <img
                        src={store.logoUrl}
                        alt={store.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-contain mb-2 sm:mb-3 md:mb-4 group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-gray-200 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                        <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600">
                          {store.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 group-hover:text-pink-600 transition-colors line-clamp-2">
                      {store.name}
                    </h3>
                    {store.voucherText && (
                      <p className="text-xs sm:text-sm text-pink-600 font-medium line-clamp-1">{store.voucherText}</p>
                    )}
                    {store.description && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2 hidden sm:block">{store.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Coupons Section */}
        {coupons.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6">Coupons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {coupons.map((coupon) => {
                const isRevealed = coupon.id && revealedCoupons.has(coupon.id);
                const isExpired = coupon.expiryDate && coupon.expiryDate.toDate() < new Date();
                
                return (
                  <div
                    key={coupon.id}
                    className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col">
                      {coupon.logoUrl && (
                        <img
                          src={coupon.logoUrl}
                          alt={coupon.storeName || coupon.code}
                          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain mb-2 sm:mb-3 md:mb-4 mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 text-center line-clamp-2">
                        {coupon.storeName || coupon.code}
                      </h3>
                      <div className="text-center mb-2 sm:mb-3 md:mb-4">
                        <span className="text-lg sm:text-xl md:text-2xl font-bold text-pink-600">
                          {coupon.discount}
                          {coupon.discountType === 'percentage' ? '%' : '$'} OFF
                        </span>
                      </div>
                      {coupon.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 md:mb-4 text-center line-clamp-2 hidden sm:block">
                          {coupon.description}
                        </p>
                      )}
                      {isExpired && (
                        <div className="bg-red-100 text-red-700 text-xs font-semibold px-2 sm:px-3 py-1 rounded mb-2 sm:mb-3 md:mb-4 text-center">
                          Expired
                        </div>
                      )}
                      {!isExpired && (
                        <button
                          onClick={() => handleGetDeal(coupon)}
                          className="w-full bg-pink-600 text-white font-semibold py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg hover:bg-pink-700 transition-colors text-xs sm:text-sm md:text-base"
                        >
                          {isRevealed ? (coupon.url ? 'Visit Store' : 'Get Deal') : 'Reveal Code'}
                        </button>
                      )}
                      {isRevealed && coupon.code && (
                        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-100 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Coupon Code:</p>
                          <p className="text-sm sm:text-base md:text-lg font-mono font-bold text-gray-800 text-center break-all">
                            {coupon.code}
                          </p>
                        </div>
                      )}
                      {coupon.expiryDate && (
                        <p className="text-xs text-gray-500 mt-2 sm:mt-3 text-center">
                          Expires: {formatDate(coupon.expiryDate)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stores.length === 0 && coupons.length === 0 && (
          <div className="text-center py-6 sm:py-8 md:py-12">
            <p className="text-gray-600 text-sm sm:text-base md:text-lg">No stores or coupons found for this category.</p>
            <Link href="/categories" className="text-pink-600 hover:underline mt-2 sm:mt-4 inline-block text-sm sm:text-base">
              Browse All Categories
            </Link>
          </div>
        )}
      </div>

      {/* Newsletter Subscription */}
      <NewsletterSubscription />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

