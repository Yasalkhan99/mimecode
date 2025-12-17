'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LocalizedLink from '@/app/components/LocalizedLink';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useTranslation } from '@/lib/hooks/useTranslation';
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
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { getLocalizedPath } = useLanguage();
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
    // Set page title and meta description
    if (store) {
      // Use SEO title if available, otherwise use default
      document.title = store.seoTitle || `${store.name} Coupons & Deals - MimeCode`;
      
      // Set meta description if available
      if (store.seoDescription) {
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', store.seoDescription);
      }
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
          // If store has a slug and URL is using ID, redirect to slug-based URL
          if (storeData.slug && idOrSlug !== storeData.slug) {
            // Check if current URL is using ID (numeric or UUID-like) instead of slug
            const isNumericId = /^\d+$/.test(idOrSlug);
            const isUuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug) || idOrSlug.length > 15;
            
            if (isNumericId || isUuidLike || idOrSlug === storeData.id) {
              // Redirect to slug-based URL
              const slugPath = getLocalizedPath(`/stores/${storeData.slug}`);
              router.replace(slugPath);
              return; // Exit early, redirect will happen
            }
          }
          
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
            
            // Sort coupons: CODE type first, then DEAL type
            const sortedCoupons = validCoupons.sort((a, b) => {
              const typeA = a.couponType?.toLowerCase() || 'deal';
              const typeB = b.couponType?.toLowerCase() || 'deal';
              
              // CODE comes before DEAL
              if (typeA === 'code' && typeB !== 'code') return -1;
              if (typeA !== 'code' && typeB === 'code') return 1;
              return 0;
            });
            
            setCoupons(sortedCoupons);
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
    // CRITICAL: Different behavior for CODE vs DEAL
    if (coupon.couponType === 'code' && coupon.code) {
      // FOR CODE TYPE: Copy code, open popup in NEW tab, redirect current tab to coupon link
      
      // Copy code to clipboard
      const codeToCopy = coupon.code.trim();
      copyToClipboard(codeToCopy);
      
      // Get redirect URL
      const redirectUrl = (coupon.url && coupon.url.trim()) || (coupon.affiliateLink && coupon.affiliateLink.trim());
      
      if (redirectUrl) {
        // Open popup in NEW tab (with site URL + coupon info in query params)
        const siteUrl = window.location.origin;
        const popupUrl = `${siteUrl}/?popup=coupon&id=${encodeURIComponent(coupon.id || '')}&code=${encodeURIComponent(coupon.code || '')}&store=${encodeURIComponent(coupon.storeName || store?.name || '')}`;
        window.open(popupUrl, '_blank', 'noopener,noreferrer');
        
        // Redirect current tab to coupon link after brief delay (to ensure popup opens first)
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 200);
      }
      
      return; // Exit early for code type
    }
    
    // FOR DEAL TYPE: Show popup on same page, open link in new tab
    setSelectedCoupon(coupon);
    setShowPopup(true);
    
    // Automatically open URL in new tab after a short delay (to ensure popup is visible first)
    const redirectUrl = (coupon.url && coupon.url.trim()) || (coupon.affiliateLink && coupon.affiliateLink.trim());
    if (redirectUrl) {
      setTimeout(() => {
        window.open(redirectUrl, '_blank', 'noopener,noreferrer');
      }, 500);
    }
  };

  const handleContinue = () => {
    // Use url first, then affiliateLink as fallback
    const redirectUrl = selectedCoupon?.url || selectedCoupon?.affiliateLink;
    if (redirectUrl) {
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFE019] mb-4"></div>
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
            <LocalizedLink
              href="/stores"
              className="inline-block px-6 py-3 bg-black hover:bg-[#FFE019] text-[#FFE019] hover:text-black border-2 border-[#FFE019] rounded-lg transition-all duration-300 font-semibold"
            >
              Browse All Stores
            </LocalizedLink>
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
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 max-lg:flex-col-reverse">
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
                  className="block w-full bg-[#FFE019] hover:bg-black text-black hover:text-[#FFE019] border-2 border-black font-bold text-center py-3 px-4 rounded-lg transition-all duration-300"
                >
                  Visit Store
                </a>
              )}

              {/* Rating Section - Dynamic */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => {
                    const rating = store.rating || 4.5;
                    const isFilled = i < Math.floor(rating);
                    const isHalfFilled = i === Math.floor(rating) && rating % 1 >= 0.5;
                    
                    return (
                      <div key={i} className="relative">
                        {isFilled ? (
                          // Filled star
                          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ) : isHalfFilled ? (
                          // Half-filled star
                          <div className="relative">
                            <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <svg className="w-5 h-5 text-yellow-400 absolute top-0 left-0" fill="currentColor" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 50% 0 0)' }}>
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        ) : (
                          // Empty star
                          <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-600">
                  {store.reviewCount || 0} review{(store.reviewCount || 0) !== 1 ? 's' : ''}
                </p>
              </div>

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

              {/* Why Trust Us Section - Dynamic Content */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{t('whyTrustUs')}</h3>
                <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
                  {store.whyTrustUs ? (
                    <div dangerouslySetInnerHTML={{ __html: store.whyTrustUs.replace(/\n/g, '<br />') }} />
                  ) : (
                    // Default content if not set
                    <>
                      <p>
                        {t('whyTrustUsDescription1')}
                      </p>
                      <p>
                        {t('whyTrustUsDescription2')}
                      </p>
                    </>
                  )}
                  <p className="text-xs text-gray-500 mt-3">
                    {t('lastUpdated')} {getCurrentDate()}
                  </p>
                </div>
              </div>

              {/* Related Stores Section */}
              {relatedStores.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Related Stores</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {relatedStores.map((relatedStore) => (
                      <LocalizedLink
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
                      </LocalizedLink>
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
              </div>
            </div>

            {/* Coupons List */}
            <div id="coupons-section" className="w-full scroll-mt-24">
            {filteredCoupons.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-lg">No {filterTab === 'all' ? 'coupons' : filterTab} available for this store right now.</p>
                <LocalizedLink
                  href="/stores"
                  className="inline-block mt-4 px-6 py-3 bg-black hover:bg-[#FFE019] text-[#FFE019] hover:text-black border-2 border-[#FFE019] rounded-lg transition-all duration-300 font-semibold"
                >
                  Browse Other Stores
                </LocalizedLink>
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
                return t('getDeal');
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
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 break-words mb-1">
                        {(() => {
                          // Helper to strip HTML tags
                          const stripHtml = (html: string) => {
                            if (!html) return '';
                            const tmp = document.createElement('DIV');
                            tmp.innerHTML = html;
                            return tmp.textContent || tmp.innerText || '';
                          };
                          
                          // Get coupon title - prefer title, then generate from discount/code
                          if (coupon.title) return stripHtml(coupon.title);
                          if (coupon.discount && coupon.discount > 0) {
                            return coupon.discountType === 'percentage' 
                              ? `${coupon.discount}% Off`
                              : `$${coupon.discount} Off`;
                          }
                          return coupon.code || coupon.storeName || store?.name || 'Coupon';
                        })()}
                      </h3>
                      {coupon.description && (
                        <p className="text-xs sm:text-sm text-gray-600 break-words mt-1">
                          {(() => {
                            // Helper to strip HTML tags
                            const stripHtml = (html: string) => {
                              if (!html) return '';
                              const tmp = document.createElement('DIV');
                              tmp.innerHTML = html;
                              return tmp.textContent || tmp.innerText || '';
                            };
                            return stripHtml(coupon.description || '');
                          })()}
                        </p>
                      )}
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
                          className="bg-[#FFE019] hover:bg-black text-black hover:text-[#FFE019] border-2 border-black font-semibold rounded-lg px-4 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap group relative overflow-hidden"
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

            {/* More Information Section - Dynamic Content */}
            <div id="store-info-section" className="mt-12 bg-white rounded-lg shadow-md p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                {t('moreInformation')} On {store.name} {t('coupons')}
              </h2>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4">
                {store.moreInformation ? (
                  // Use custom content from admin if available
                  <div dangerouslySetInnerHTML={{ __html: store.moreInformation.replace(/\n/g, '<br />') }} />
                ) : (
                  // Default content if not set
                  <>
                    <p>
                      {t('moreInformationParagraph1').replace('{storeName}', store.name)}
                    </p>
                    <p>
                      {t('moreInformationParagraph2').replace('{storeName}', store.name)}
                    </p>
                    <p>
                      <strong>{t('seasonalDealsAndSavings')}</strong> {t('moreInformationParagraph3').replace('{storeName}', store.name)}
                    </p>
                    {store.description && (
                      <p>
                        {store.description}
                      </p>
                    )}
                    {store.aboutText && (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('aboutStore').replace('{storeName}', store.name)}</h3>
                        <p className="whitespace-pre-line">{store.aboutText}</p>
                      </div>
                    )}
                  </>
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
                    className="inline-block px-6 py-3 bg-black hover:bg-[#FFE019] text-[#FFE019] hover:text-black border-2 border-[#FFE019] rounded-lg transition-all duration-300 font-semibold"
                  >
                    View General FAQs
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
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
