'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoreById, getStoreBySlug, Store } from '@/lib/services/storeService';
import { getCouponsByStoreId, Coupon } from '@/lib/services/couponService';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';
import CouponPopup from '@/app/components/CouponPopup';

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idOrSlug = params.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    // Set page title
    if (store) {
      document.title = `${store.name} - AvailCoupon`;
    }
  }, [store]);

  useEffect(() => {
    const fetchStoreData = async () => {
      setLoading(true);
      try {
        // Try to fetch by slug first, then by ID
        let storeData = await getStoreBySlug(idOrSlug);
        
        if (!storeData) {
          storeData = await getStoreById(idOrSlug);
        }

        if (storeData) {
          setStore(storeData);
          
          // Fetch coupons for this store
          if (storeData.id) {
            const storeCoupons = await getCouponsByStoreId(storeData.id);
            // Filter only active coupons
            const activeCoupons = storeCoupons.filter(coupon => coupon.isActive);
            setCoupons(activeCoupons);
          }
        } else {
          // Store not found - could redirect to 404 or stores page
          console.error('Store not found:', idOrSlug);
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (idOrSlug) {
      fetchStoreData();
    }
  }, [idOrSlug]);

  const handleCouponClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setShowPopup(true);
  };

  const handleContinue = () => {
    if (selectedCoupon?.url) {
      window.open(selectedCoupon.url, '_blank', 'noopener,noreferrer');
    }
    setShowPopup(false);
    setSelectedCoupon(null);
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discount}% OFF`;
    } else {
      return `$${coupon.discount} OFF`;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <p className="text-gray-600">Loading store...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Store Not Found</h1>
            <p className="text-gray-600 mb-6">The store you're looking for doesn't exist.</p>
            <Link
              href="/stores"
              className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Browse All Stores
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
      
      {/* Store Header Section */}
      <div className="w-full bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Store Logo */}
            {store.logoUrl && (
              <div className="flex-shrink-0">
                <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-white rounded-2xl shadow-lg p-4 sm:p-6 flex items-center justify-center">
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Store Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                {store.subStoreName || store.name}
              </h1>
              {store.voucherText && (
                <div className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm sm:text-base font-bold px-4 py-2 rounded-full shadow-lg mb-4">
                  {store.voucherText}
                </div>
              )}
              {store.description && (
                <p className="text-gray-600 text-base sm:text-lg max-w-2xl">
                  {store.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Available <span className="text-orange-600">Coupons</span>
          </h2>
          <p className="text-gray-600">
            {coupons.length > 0 
              ? `Found ${coupons.length} active coupon${coupons.length !== 1 ? 's' : ''}`
              : 'No active coupons available at the moment'}
          </p>
        </div>

        {coupons.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500 text-lg">No coupons available for this store right now.</p>
            <Link
              href="/stores"
              className="inline-block mt-4 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Browse Other Stores
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-orange-400 transition-all duration-300 shadow-md hover:shadow-xl overflow-hidden cursor-pointer transform hover:-translate-y-1"
                onClick={() => handleCouponClick(coupon)}
              >
                {/* Coupon Logo/Header */}
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 flex items-center justify-center">
                  {coupon.logoUrl ? (
                    <img
                      src={coupon.logoUrl}
                      alt={coupon.storeName || store.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-sm font-semibold text-center">
                      {coupon.storeName || store.name}
                    </div>
                  )}
                </div>

                {/* Coupon Content */}
                <div className="p-4 border-t border-gray-100">
                  <div className="mb-2">
                    <span className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {formatDiscount(coupon)}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2">
                    {coupon.description}
                  </h3>
                  {coupon.expiryDate && (
                    <p className="text-xs text-gray-500 mb-2">
                      Expires: {formatDate(coupon.expiryDate)}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-600">
                      {coupon.couponType === 'code' ? 'Code' : 'Deal'}
                    </span>
                    <button className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                      Get Offer →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to Stores Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-8">
        <Link
          href="/stores"
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to All Stores
        </Link>
      </div>

      {/* Newsletter Subscription */}
      <NewsletterSubscription />
      
      {/* Footer */}
      <Footer />

      {/* Coupon Popup */}
      <CouponPopup
        coupon={selectedCoupon}
        isOpen={showPopup}
        onClose={() => {
          setShowPopup(false);
          setSelectedCoupon(null);
        }}
        onContinue={handleContinue}
      />
    </div>
  );
}
