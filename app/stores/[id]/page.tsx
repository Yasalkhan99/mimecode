'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoreById, getStoreBySlug, getStores, Store } from '@/lib/services/storeService';
import { getCouponsByStoreId, Coupon } from '@/lib/services/couponService';
import { getActiveStoreFAQs, StoreFAQ } from '@/lib/services/storeFaqService';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';

// Helper function to generate consistent random rating and reviews based on store ID
const getStoreRating = (storeId: string | undefined): { rating: number; reviews: number } => {
  if (!storeId) {
    return { rating: 4.0, reviews: 0 };
  }
  
  // Use store ID as seed for consistent random values
  let hash = 0;
  for (let i = 0; i < storeId.length; i++) {
    const char = storeId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Generate rating between 3.0 and 5.0
  const rating = 3.0 + (Math.abs(hash) % 200) / 100; // 3.0 to 5.0
  
  // Generate reviews between 10 and 5000
  const reviews = 10 + (Math.abs(hash * 7) % 4990);
  
  return { rating: Math.round(rating * 10) / 10, reviews };
};
import CouponPopup from '@/app/components/CouponPopup';

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idOrSlug = params.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [activeTab, setActiveTab] = useState<'coupons' | 'store-info' | 'faqs'>('coupons');
  const [filterTab, setFilterTab] = useState<'all' | 'coupons' | 'deals' | 'products'>('all');
  const [storeFaqs, setStoreFaqs] = useState<StoreFAQ[]>([]);
  const [userFeedback, setUserFeedback] = useState<'yes' | 'no' | null>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100; // Offset for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update active tab for visual feedback
      if (sectionId === 'coupons-section') setActiveTab('coupons');
      else if (sectionId === 'store-info-section') setActiveTab('store-info');
      else if (sectionId === 'faqs-section') setActiveTab('faqs');
    }
  };

  useEffect(() => {
    // Set page title
    if (store) {
      document.title = `${store.name} - MimeCode`;
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
            const [storeCoupons, faqsData, storesData] = await Promise.all([
              getCouponsByStoreId(storeData.id),
              getActiveStoreFAQs(storeData.id),
              getStores()
            ]);
            // Show all coupons (active and inactive) - Filter expired ones only
            const now = new Date();
            const validCoupons = storeCoupons.filter(coupon => {
              // Keep coupon if no expiry date
              if (!coupon.expiryDate) return true;
              
              // Parse expiry date
              let expiryDate: Date | null = null;
              if (coupon.expiryDate instanceof Date) {
                expiryDate = coupon.expiryDate;
              } else if (typeof coupon.expiryDate === 'string') {
                expiryDate = new Date(coupon.expiryDate);
                if (isNaN(expiryDate.getTime())) return true; // Invalid date = keep
              } else if (coupon.expiryDate && typeof (coupon.expiryDate as any).toDate === 'function') {
                expiryDate = (coupon.expiryDate as any).toDate();
              }
              
              // Keep if not expired
              return !expiryDate || expiryDate >= now;
            });
            setCoupons(validCoupons);
            setStoreFaqs(faqsData);
            setAllStores(storesData);
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

  // Update active tab based on scroll position
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -50% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          if (sectionId === 'coupons-section') setActiveTab('coupons');
          else if (sectionId === 'store-info-section') setActiveTab('store-info');
          else if (sectionId === 'faqs-section') setActiveTab('faqs');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const couponsSection = document.getElementById('coupons-section');
    const storeInfoSection = document.getElementById('store-info-section');
    const faqsSection = document.getElementById('faqs-section');

    if (couponsSection) observer.observe(couponsSection);
    if (storeInfoSection) observer.observe(storeInfoSection);
    if (faqsSection) observer.observe(faqsSection);

    return () => {
      if (couponsSection) observer.unobserve(couponsSection);
      if (storeInfoSection) observer.unobserve(storeInfoSection);
      if (faqsSection) observer.unobserve(faqsSection);
    };
  }, [coupons.length, storeFaqs.length]);

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        // Code copied successfully
        console.log('Code copied to clipboard:', text);
      }).catch((err) => {
        console.error('Clipboard API failed:', err);
        copyToClipboardFallback(text);
      });
    } else {
      copyToClipboardFallback(text);
    }
  };

  const copyToClipboardFallback = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '0';
      textArea.style.top = '0';
      textArea.style.width = '2px';
      textArea.style.height = '2px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.style.zIndex = '-1';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('Code copied to clipboard (fallback):', text);
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
  };

  const handleCouponClick = (coupon: Coupon) => {
    // Copy code to clipboard FIRST (before showing popup) - only for code type
    if (coupon.couponType === 'code' && coupon.code) {
      const codeToCopy = coupon.code.trim();
      copyToClipboard(codeToCopy);
    }
    
    // Show popup
    setSelectedCoupon(coupon);
    setShowPopup(true);
    
    // Automatically open URL in new tab after a short delay (to ensure popup is visible first)
    if (coupon.url && coupon.url.trim()) {
      setTimeout(() => {
        window.open(coupon.url, '_blank', 'noopener,noreferrer');
      }, 500);
    }
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

  // Get last 2 digits for hover display
  const getLastTwoDigits = (coupon: Coupon): string | null => {
    if ((coupon.couponType || 'deal') === 'code' && coupon.code) {
      const code = coupon.code.trim();
      if (code.length >= 2) {
        return code.slice(-2);
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ABC443] mb-4"></div>
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
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#ABC443] to-[#41361A] hover:from-[#41361A] hover:to-[#ABC443] text-white rounded-lg transition-all duration-300"
            >
              Browse All Stores
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getTrustedPartnerYear = () => {
    // Get store creation year or default to 2017
    if (store?.createdAt) {
      try {
        const createdAt = store.createdAt.toDate ? store.createdAt.toDate() : (typeof store.createdAt === 'number' ? new Date(store.createdAt) : new Date());
        return createdAt.getFullYear();
      } catch {
        return 2017;
      }
    }
    return 2017;
  };

  // Filter coupons based on selected tab
  const codeCoupons = coupons.filter(c => c.couponType === 'code');
  const dealCoupons = coupons.filter(c => c.couponType === 'deal');
  const filteredCoupons = filterTab === 'all' ? coupons : 
                         filterTab === 'coupons' ? codeCoupons :
                         filterTab === 'deals' ? dealCoupons : [];

  // Get related stores (exclude current store)
  const relatedStores = allStores
    .filter(s => s.id !== store?.id)
    .slice(0, 12);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Commission Disclosure */}
        <p className="text-xs sm:text-sm text-gray-500 mb-4">
          When you buy through links on our site, we may earn a commission.
        </p>

        {/* Store Header Section */}
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6">
          {/* Store Logo */}
          {store.logoUrl && (
            <div className="flex-shrink-0">
              <img
                src={store.logoUrl}
                alt={store.name}
                className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Store Info */}
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Verified {store.subStoreName || store.name} Coupons & Promo Codes
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-1">
              Trusted Partner since {getTrustedPartnerYear()}
            </p>
            <p className="text-sm sm:text-base text-gray-600">
              {coupons.length} Coupons Validated by Our Experts on {getCurrentDate()}
            </p>
          </div>
        </div>

        {/* Tabs Navigation - Scroll to Sections */}
        <div className="border-b border-gray-200 mb-6 sticky top-0 bg-white z-10 pb-2">
          <div className="flex space-x-6 sm:space-x-8">
            <button
              onClick={() => scrollToSection('coupons-section')}
              className={`pb-3 px-1 text-sm sm:text-base font-semibold transition-colors border-b-2 ${
                activeTab === 'coupons'
                  ? 'border-[#16a34a] text-[#16a34a]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Coupons
            </button>
            <button
              onClick={() => scrollToSection('store-info-section')}
              className={`pb-3 px-1 text-sm sm:text-base font-semibold transition-colors border-b-2 ${
                activeTab === 'store-info'
                  ? 'border-[#16a34a] text-[#16a34a]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Store Info
            </button>
            <button
              onClick={() => scrollToSection('faqs-section')}
              className={`pb-3 px-1 text-sm sm:text-base font-semibold transition-colors border-b-2 ${
                activeTab === 'faqs'
                  ? 'border-[#16a34a] text-[#16a34a]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              FAQs
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-6 space-y-6">
              {/* Store Logo Circle */}
              {store.logoUrl && (
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-gray-200">
                    <img
                      src={store.logoUrl}
                      alt={store.name}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Visit Store Button */}
              {store.websiteUrl && (
                <a
                  href={store.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-center py-3 px-4 rounded-lg transition-colors"
                >
                  Visit Store
                </a>
              )}

              {/* Rating Section */}
              {(() => {
                const { rating, reviews } = getStoreRating(store.id);
                const fullStars = Math.floor(rating);
                const hasHalfStar = rating % 1 >= 0.5;
                
                return (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => {
                        if (i < fullStars) {
                          return (
                            <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          );
                        } else if (i === fullStars && hasHalfStar) {
                          return (
                            <div key={i} className="relative w-5 h-5">
                              <svg className="w-5 h-5 text-gray-300 absolute" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <svg className="w-5 h-5 text-yellow-400 absolute overflow-hidden" style={{ width: '50%' }} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                          );
                        } else {
                          return (
                            <svg key={i} className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          );
                        }
                      })}
                    </div>
                    <p className="text-sm text-gray-600">
                      {rating.toFixed(1)} ({reviews > 999 ? `${(reviews / 1000).toFixed(1)}k` : reviews} reviews)
                    </p>
                  </div>
                );
              })()}

              {/* User Feedback Box */}
              <div className="bg-gray-800 text-white p-4 rounded-lg">
                <p className="text-sm mb-3">Enjoying {store.name} offers on our website?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUserFeedback('yes')}
                    className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors ${
                      userFeedback === 'yes' ? 'bg-green-600' : 'bg-white text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setUserFeedback('no')}
                    className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors ${
                      userFeedback === 'no' ? 'bg-red-600' : 'bg-white text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Store Stats */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Get latest {store.name} Coupons and Deals here!
                </p>
                <p className="text-xs text-gray-600 mb-3">Verified and updated</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    Active Coupons: <span className="font-bold">{codeCoupons.length}</span>
                  </p>
                  <p className="text-sm text-gray-700">
                    Active Deals: <span className="font-bold">{dealCoupons.length}</span>
                  </p>
                </div>
              </div>

              {/* Why Trust Us Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Why Trust Us?</h3>
                <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
                  <p>
                    At MimeCode, we are committed to providing you with the best deals and savings opportunities. Our dedicated team works tirelessly to ensure that every coupon and deal we feature is verified, up-to-date, and reliable.
                  </p>
                  <p>
                    We understand the importance of saving money, and that's why we make it our mission to help you find the best discounts from your favorite stores.
                  </p>
                  <p className="text-xs text-gray-500 mt-3">
                    Last updated: {getCurrentDate()}
                  </p>
                </div>
              </div>

              {/* Related Stores Section */}
              {relatedStores.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Related Stores</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {relatedStores.map((relatedStore) => (
                      <Link
                        key={relatedStore.id}
                        href={`/stores/${relatedStore.slug || relatedStore.id}`}
                        className="group flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        title={relatedStore.name}
                      >
                        {relatedStore.logoUrl ? (
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <img
                              src={relatedStore.logoUrl}
                              alt={relatedStore.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-xs font-semibold text-gray-500">${relatedStore.name.charAt(0)}</span>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <span className="text-xs font-semibold text-gray-600">
                              {relatedStore.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-xs text-gray-700 text-center line-clamp-2 group-hover:text-[#16a34a] transition-colors">
                          {relatedStore.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Filter Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex space-x-4 sm:space-x-6">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`pb-3 px-1 text-sm sm:text-base font-semibold transition-colors border-b-2 ${
                    filterTab === 'all'
                      ? 'border-[#16a34a] text-[#16a34a]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterTab('coupons')}
                  className={`pb-3 px-1 text-sm sm:text-base font-semibold transition-colors border-b-2 ${
                    filterTab === 'coupons'
                      ? 'border-[#16a34a] text-[#16a34a]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Coupons({codeCoupons.length})
                </button>
                <button
                  onClick={() => setFilterTab('deals')}
                  className={`pb-3 px-1 text-sm sm:text-base font-semibold transition-colors border-b-2 ${
                    filterTab === 'deals'
                      ? 'border-[#16a34a] text-[#16a34a]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Deals({dealCoupons.length})
                </button>
                {/* <button
                  onClick={() => setFilterTab('products')}
                  className={`pb-3 px-1 text-sm sm:text-base font-semibold transition-colors border-b-2 ${
                    filterTab === 'products'
                      ? 'border-[#16a34a] text-[#16a34a]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Products(0)       
                </button> */}
              </div>
            </div>

            {/* Coupons List */}
            <div id="coupons-section" className="w-full scroll-mt-24">
            {filteredCoupons.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-lg">No {filterTab === 'all' ? 'coupons' : filterTab} available for this store right now.</p>
                <Link
                  href="/stores"
                  className="inline-block mt-4 px-6 py-3 bg-[#ABC443] text-white rounded-lg hover:bg-[#9BB03A] transition-colors"
                >
                  Browse Other Stores
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
            {filteredCoupons.map((coupon, index) => {
              // Add email subscription after first 2-3 coupons
              const showEmailSubscription = index === Math.floor(filteredCoupons.length / 2) && filteredCoupons.length > 3;
              // Handle expiryDate - can be string, Date, or Firestore Timestamp
              const getExpiryDate = (expiryDate: any): Date | null => {
                if (!expiryDate) return null;
                // If it's already a Date object
                if (expiryDate instanceof Date) return expiryDate;
                // If it's a Firestore Timestamp object (has toDate method)
                if (expiryDate && typeof expiryDate.toDate === 'function') {
                  return expiryDate.toDate();
                }
                // If it's a string, try to parse it
                if (typeof expiryDate === 'string') {
                  const parsed = new Date(expiryDate);
                  return isNaN(parsed.getTime()) ? null : parsed;
                }
                // If it's a number (timestamp in milliseconds)
                if (typeof expiryDate === 'number') {
                  return new Date(expiryDate);
                }
                return null;
              };
              const expiryDateObj = getExpiryDate(coupon.expiryDate);
              const isExpired = expiryDateObj ? expiryDateObj < new Date() : false;
              
              const getCodePreview = (coupon: Coupon): string => {
                if (coupon.buttonText && coupon.buttonText.trim() !== '') {
                  return coupon.buttonText;
                }
                if ((coupon.couponType || 'deal') === 'code' && coupon.code) {
                  return 'Get Code';
                }
                return 'Get Deal';
              };

              const getLastTwoDigits = (coupon: Coupon): string | null => {
                if ((coupon.couponType || 'deal') === 'code' && coupon.code) {
                  const code = coupon.code.trim();
                  if (code.length >= 2) {
                    return code.slice(-2);
                  }
                }
                return null;
              };
              
              return (
                <div
                  key={coupon.id}
                  className="bg-white rounded-lg p-3 sm:p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#ABC443] transform hover:-translate-y-1 flex flex-row items-center gap-3 sm:gap-5"
                  style={{
                    overflow: 'visible',
                    minHeight: '88px'
                  }}
                >
                  {/* Logo Section */}
                  <div className="flex-shrink-0">
                    {coupon.logoUrl ? (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                        <img
                          src={coupon.logoUrl}
                          alt={coupon.storeName || coupon.code}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent) {
                              const initial = coupon.code?.charAt(0) || coupon.storeName?.charAt(0) || '?';
                              parent.innerHTML = `<span class="text-sm font-semibold text-gray-500">${initial}</span>`;
                            }
                          }}
                        />
                      </div>
                    ) : store?.logoUrl ? (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                        <img
                          src={store.logoUrl}
                          alt={store.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent) {
                              const initial = store.name?.charAt(0) || '?';
                              parent.innerHTML = `<span class="text-sm font-semibold text-gray-500">${initial}</span>`;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-semibold text-gray-500">
                          {coupon.code?.charAt(0) || coupon.storeName?.charAt(0) || store?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 min-w-0 flex flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 break-words mb-0.5">
                        {(() => {
                          // Helper to strip HTML tags
                          const stripHtml = (html: string) => {
                            if (!html) return '';
                            const tmp = document.createElement('DIV');
                            tmp.innerHTML = html;
                            return tmp.textContent || tmp.innerText || '';
                          };
                          
                          // Get coupon title - prefer title, then description, then generate from discount
                          if (coupon.title) return stripHtml(coupon.title);
                          if (coupon.description) return stripHtml(coupon.description);
                          if (coupon.discount && coupon.discount > 0) {
                            return coupon.discountType === 'percentage' 
                              ? `${coupon.discount}% Off`
                              : `$${coupon.discount} Off`;
                          }
                          return coupon.code || coupon.storeName || store?.name || 'Coupon';
                        })()}
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-green-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-[10px]">Verified</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {coupon.expiryDate ? (
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{formatDate(coupon.expiryDate) || '31 Dec, 2025'}</span>
                            </div>
                          ) : (
                            <span>31 Dec, 2025</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Button on Right */}
                    <div className="flex-shrink-0">
                      {isExpired ? (
                        <div className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-2 rounded text-center whitespace-nowrap">
                          Expired
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCouponClick(coupon);
                          }}
                          className="bg-[#ABC443] hover:bg-[#9BB03A] text-white font-semibold rounded-lg px-4 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap group relative overflow-hidden"
                        >
                          <span className="flex-1 flex items-center justify-center">
                            {coupon.couponType === 'code' && coupon.code ? (
                              <span className="text-sm sm:text-base">
                                {getCodePreview(coupon)}
                              </span>
                            ) : (
                              <span className="text-sm sm:text-base">
                                {getCodePreview(coupon)}
                              </span>
                            )}
                          </span>
                          {getLastTwoDigits(coupon) && (
                            <div className="w-0 opacity-0 group-hover:w-20 group-hover:opacity-100 transition-all duration-300 ease-out flex items-center justify-center border-l-2 border-white/70 ml-2 pl-2 whitespace-nowrap overflow-hidden bg-white/10">
                              <span className="text-white font-bold text-xs">...{getLastTwoDigits(coupon)}</span>
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
            </div>

            {/* Discover More Tags */}
            {store && (
              <div className="mt-8 flex flex-wrap gap-2">
                <span className="text-sm font-semibold text-gray-700 mr-2">Discover more:</span>
                {['online stores', 'shopping', store.name, 'Online shopping', 'shopping online', 'coupons', 'deals', 'discounts', 'savings'].map((tag, index) => (
                  <button
                    key={index}
                    className="text-xs sm:text-sm text-gray-600 hover:text-[#16a34a] hover:underline transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* More Information Section */}
            <div id="store-info-section" className="mt-12 bg-white rounded-lg shadow-md p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                More Information On {store.name} Coupons
              </h2>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4">
                <p>
                  At MimeCode, we are dedicated to helping you save money with incredible savings opportunities from {store.name}. Whether you're looking for your preferred item or exploring new products, our verified coupons and deals make it easy to shop more while spending less.
                </p>
                <p>
                  The expanding e-commerce market offers numerous opportunities for savings, and we've developed simple strategies to help you maximize your discounts. Our team works around the clock to ensure all {store.name} coupons are verified, up-to-date, and ready to use.
                </p>
                <p>
                  <strong>Seasonal Deals & Savings:</strong> Keep an eye out for special promotions during November deals, holiday deals, Black Friday, Cyber Monday, Christmas, New Year's, Easter, Thanksgiving, Winter Sale, Summer Sale, Halloween, Chinese Sale, Mother's Day, and Father's Day. These are the best times to find incredible discounts on {store.name} products.
                </p>
                {store.description && (
                  <p>
                    {store.description}
                  </p>
                )}
                {store.aboutText && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">About {store.name}</h3>
                    <p className="whitespace-pre-line">{store.aboutText}</p>
                  </div>
                )}
              </div>
            </div>

            {/* FAQs Section */}
            <div id="faqs-section" className="mt-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">FAQs</h2>
              {storeFaqs.length > 0 ? (
                <div className="space-y-4">
                  {storeFaqs.map((faq, index) => (
                    <div
                      key={faq.id || index}
                      className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600 text-lg mb-4">No FAQs available for this store at the moment.</p>
                  <Link
                    href="/faqs"
                    className="inline-block px-6 py-3 bg-[#16a34a] text-white rounded-lg hover:bg-[#15803d] transition-colors"
                  >
                    View General FAQs
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Back to Stores Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-8">
        <Link
          href="/stores"
          className="inline-flex items-center gap-2 text-[#16a34a] hover:text-[#15803d] font-semibold"
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
