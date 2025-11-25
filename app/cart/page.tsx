'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCartItems, removeFromCart, clearCart, CartItem } from '@/lib/services/cartService';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'My Cart - AvailCoupon';
    loadCart();
    
    // Listen for updates
    const handleUpdate = () => loadCart();
    window.addEventListener('cartUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleUpdate);
    };
  }, []);

  const loadCart = () => {
    setLoading(true);
    const data = getCartItems();
    setCartItems(data);
    setLoading(false);
  };

  const handleRemove = (couponId: string) => {
    if (confirm('Remove this coupon from cart?')) {
      removeFromCart(couponId);
      loadCart();
    }
  };

  const handleClearCart = () => {
    if (confirm('Clear all items from cart?')) {
      clearCart();
      loadCart();
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <Navbar />
      
      {/* Cart Section */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 bg-white overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                My <span className="text-orange-600">Cart</span>
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {cartItems.length} {cartItems.length === 1 ? 'coupon' : 'coupons'} saved
              </p>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={handleClearCart}
                className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
              >
                Clear Cart
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading cart...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 text-lg mb-2">Your cart is empty</p>
              <p className="text-gray-400 text-sm mb-6">Start adding coupons to your cart!</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all"
              >
                Browse Coupons
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {cartItems.map((item) => (
                <div
                  key={item.couponId}
                  className="group bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-orange-400 hover:shadow-lg transition-all duration-300 relative"
                >
                  <button
                    onClick={() => handleRemove(item.couponId)}
                    className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove from cart"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  
                  {item.logoUrl && (
                    <div className="mb-3 flex items-center justify-center h-16">
                      <img
                        src={item.logoUrl}
                        alt={item.storeName || item.code}
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
                      {item.code}
                    </h3>
                    {item.storeName && (
                      <p className="text-sm text-gray-600 mb-2">{item.storeName}</p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-500 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {item.url && (
                        <a
                          href={item.url}
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

