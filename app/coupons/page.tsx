'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getActiveCoupons, Coupon } from '@/lib/services/couponService';
import { getCategories, Category } from '@/lib/services/categoryService';
import { getStores, Store } from '@/lib/services/storeService';
// import { getBannersWithLayout, Banner } from '@/lib/services/bannerService';
import { addNotification } from '@/lib/services/notificationsService';
import { useTranslation } from '@/lib/hooks/useTranslation';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import CouponPopup from '@/app/components/CouponPopup';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

function CouponsContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const storeParam = searchParams.get('store');
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  // const [banners, setBanners] = useState<Banner[]>([]);
  // const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  // const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || '');
  const [selectedStore, setSelectedStore] = useState<string>(storeParam || '');
  const [revealedCoupons, setRevealedCoupons] = useState<Set<string>>(new Set());
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const couponsPerPage = 20;

  useEffect(() => {
    document.title = 'All Coupons - MimeCode';
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [couponsData, categoriesData, storesData] = await Promise.all([
          getActiveCoupons(),
          getCategories(),
          getStores(),
          // getBannersWithLayout()
        ]);
        setCoupons(couponsData);
        setCategories(categoriesData);
        setStores(storesData);
        // const bannersList = bannersData.filter(Boolean) as Banner[];
        // setBanners(bannersList.slice(0, 4)); // Get first 4 banners
      } catch (error) {
        console.error('Error fetching coupons data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Helper function to check if coupon is expired
  const getExpiryDate = (expiryDate: any): Date | null => {
    if (!expiryDate) return null;
    if (expiryDate instanceof Date) return expiryDate;
    if (expiryDate && typeof expiryDate.toDate === 'function') {
      return expiryDate.toDate();
    }
    if (typeof expiryDate === 'string') {
      const parsed = new Date(expiryDate);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof expiryDate === 'number') {
      return new Date(expiryDate);
    }
    return null;
  };

  useEffect(() => {
    let filtered = [...coupons];
    
    // Note: Expired coupons are already filtered at API level (getActiveCoupons)
    // But we do an extra check here just in case
    filtered = filtered.filter(coupon => {
      const expiryDateObj = getExpiryDate(coupon.expiryDate);
      const isExpired = expiryDateObj ? expiryDateObj < new Date() : false;
      return !isExpired && coupon.isActive !== false;
    });
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(coupon => coupon.categoryId === selectedCategory);
    }
    
    // Filter by store
    if (selectedStore) {
      filtered = filtered.filter(coupon => {
        // Check if coupon is associated with selected store via storeIds
        if (coupon.storeIds && coupon.storeIds.includes(selectedStore)) {
          return true;
        }
        // Also check by storeName for backward compatibility
        const store = stores.find(s => s.id === selectedStore);
        if (store && coupon.storeName === store.name) {
          return true;
        }
        return false;
      });
    }
    
    // Sort by priority (higher priority first), then by ID
    filtered.sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      if (priorityB !== priorityA) {
        return priorityB - priorityA; // Higher priority first
      }
      // If priorities are equal, sort by ID (newer first)
      const idA = parseInt(String(a.id || '0'), 10) || 0;
      const idB = parseInt(String(b.id || '0'), 10) || 0;
      return idB - idA;
    });
    
    // Reset to page 1 when filters change
    setCurrentPage(1);
    
    setFilteredCoupons(filtered);
  }, [selectedCategory, selectedStore, coupons, stores]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  // Get last 2 digits of code for code type coupons
  const getCodePreview = (coupon: Coupon): string => {
    // Use custom button text if provided
    if (coupon.buttonText && coupon.buttonText.trim() !== '') {
      return coupon.buttonText;
    }
    // Default to type-based text
    if ((coupon.couponType || 'deal') === 'code' && coupon.code) {
      return t('getCode');
    }
    return t('getDeal');
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


  // Helper to get store for a coupon
  const getStoreForCoupon = (coupon: Coupon): Store | null => {
    if (!stores || stores.length === 0) return null;
    
    // Try by storeIds first
    if (coupon.storeIds && coupon.storeIds.length > 0) {
      for (const storeId of coupon.storeIds) {
        const match = stores.find(s => s.id === storeId || String(s.id).toLowerCase() === String(storeId).toLowerCase());
        if (match) return match;
      }
    }
    
    // Try by store name
    if (coupon.storeName) {
      const couponStoreName = coupon.storeName.trim().toLowerCase();
      const match = stores.find(s => s.name?.trim().toLowerCase() === couponStoreName);
      if (match) return match;
    }
    
    return null;
  };

  const handleGetDeal = (coupon: Coupon, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Copy code to clipboard FIRST (before showing popup) - only for code type
    if (coupon.couponType === 'code' && coupon.code) {
      const codeToCopy = coupon.code.trim();
      copyToClipboard(codeToCopy);
    }
    
    // Mark coupon as revealed
    if (coupon.id) {
      setRevealedCoupons(prev => new Set(prev).add(coupon.id!));
    }
    
    // Get store for this coupon
    const store = getStoreForCoupon(coupon);
    
    // Get URL to open - prioritize coupon.url (primary), then store trackingLink, then trackingUrl
    // Check coupon.url FIRST - if it exists and is not empty, use it
    let urlToOpen = null;
    const couponUrl = coupon.url;
    if (couponUrl && typeof couponUrl === 'string' && couponUrl.trim() !== '') {
      urlToOpen = couponUrl.trim();
    } else if (store?.trackingLink && store.trackingLink.trim()) {
      urlToOpen = store.trackingLink.trim();
    } else if (store?.trackingUrl && store.trackingUrl.trim()) {
      urlToOpen = store.trackingUrl.trim();
    } else {
      const storeTrackingUrl = store?.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'] || null;
      urlToOpen = storeTrackingUrl || coupon.affiliateLink || null;
    }
    if (urlToOpen && !urlToOpen.startsWith('http')) {
      urlToOpen = `https://${urlToOpen}`;
    }
    
    // Helper to extract domain for favicon
    const extractDomainForLogo = (url: string | null | undefined): string | null => {
      if (!url) return null;
      let cleanUrl = url.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].replace(/\.+$/, '');
      return cleanUrl || null;
    };
    
    // Get the correct logo URL - SAME LOGIC as card display
    let correctLogoUrl: string | null = null;
    
    // Priority 1: Store tracking Link/Tracking URL favicon (use same priority as urlToOpen)
    const storeTrackingUrlForLogo = store?.trackingLink || store?.trackingUrl || store?.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'] || null;
    if (storeTrackingUrlForLogo) {
      const domain = extractDomainForLogo(storeTrackingUrlForLogo);
      if (domain) {
        correctLogoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
      }
    }
    
    // Priority 2: Store logo URL
    if (!correctLogoUrl && store?.logoUrl) {
      if (store.logoUrl.startsWith('http://') || store.logoUrl.startsWith('https://') || store.logoUrl.includes('cloudinary.com')) {
        correctLogoUrl = store.logoUrl;
      }
    }
    
    // Priority 3: Coupon logo URL
    if (!correctLogoUrl && coupon.logoUrl) {
      if (coupon.logoUrl.startsWith('http://') || coupon.logoUrl.startsWith('https://') || coupon.logoUrl.includes('cloudinary.com')) {
        correctLogoUrl = coupon.logoUrl;
      }
    }
    
    // Priority 4: Coupon URL favicon
    if (!correctLogoUrl && coupon.url) {
      const domain = extractDomainForLogo(coupon.url);
      if (domain) {
        correctLogoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
      }
    }
    
    // Create enhanced coupon with correct logo for popup
    const enhancedCoupon: Coupon = {
      ...coupon,
      logoUrl: correctLogoUrl || coupon.logoUrl,
      storeName: store?.name || coupon.storeName,
      url: urlToOpen || coupon.url,
    };
    
    // Show popup with enhanced coupon
    setSelectedCoupon(enhancedCoupon);
    setShowPopup(true);
    
    // Automatically open URL in new tab after a short delay
    if (urlToOpen) {
      setTimeout(() => {
        window.open(urlToOpen!, '_blank', 'noopener,noreferrer');
      }, 500);
    }
  };

  const handlePopupContinue = () => {
    if (selectedCoupon?.url) {
      window.open(selectedCoupon.url, '_blank', 'noopener,noreferrer');
    }
    setShowPopup(false);
    setSelectedCoupon(null);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    setSelectedCoupon(null);
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        addNotification({
          title: t('codeCopied'),
          message: t('couponCodeCopied').replace('{code}', text),
          type: 'success'
        });
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
        addNotification({
          title: t('codeCopied'),
          message: t('couponCodeCopied').replace('{code}', text),
          type: 'success'
        });
      } else {
        addNotification({
          title: 'Copy Manually',
          message: `Code: ${text} (Please copy manually)`,
          type: 'info'
        });
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      addNotification({
        title: 'Copy Manually',
        message: `Code: ${text} (Please copy manually)`,
        type: 'info'
      });
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedStore('');
  };

  // // Auto-slide banners - COMMENTED OUT (only on home page)
  // useEffect(() => {
  //   if (banners.length <= 1) return;
  //   
  //   const interval = setInterval(() => {
  //     setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  //     setDirection(1);
  //   }, 5000); // Change banner every 5 seconds

  //   return () => clearInterval(interval);
  // }, [banners.length]);

  // // Swipe handlers
  // const handlePrev = () => {
  //   setDirection(-1);
  //   setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  // };

  // const handleNext = () => {
  //   setDirection(1);
  //   setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  // };

  // const slideVariants = {
  //   enter: (direction: number) => ({
  //     x: direction > 0 ? '100%' : '-100%',
  //     opacity: 0,
  //     scale: 0.9
  //   }),
  //   center: {
  //     zIndex: 1,
  //     x: 0,
  //     opacity: 1,
  //     scale: 1
  //   },
  //   exit: (direction: number) => ({
  //     zIndex: 0,
  //     x: direction < 0 ? '100%' : '-100%',
  //     opacity: 0,
  //     scale: 0.9
  //   })
  // };

  // const swipeConfidenceThreshold = 10000;
  // const swipePower = (offset: number, velocity: number) => {
  //   return Math.abs(offset) * velocity;
  // };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Banner Section - COMMENTED OUT (only on home page) */}
      {/* {banners.length > 0 && (
        <section className="relative w-full bg-white py-4 sm:py-6 md:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="relative h-[300px] md:h-[350px] lg:h-[400px] w-full rounded-xl overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {banners.map((banner, index) => {
                if (index !== currentBannerIndex) return null;
                
                return (
                  <motion.div
                    key={banner.id || `banner-${index}`}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.4 }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = swipePower(offset.x, velocity.x);
                      if (swipe < -swipeConfidenceThreshold) {
                        handleNext();
                      } else if (swipe > swipeConfidenceThreshold) {
                        handlePrev();
                      }
                    }}
                    className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing rounded-xl"
                  >
                    <Link href="#" className="relative block w-full h-full rounded-xl overflow-hidden bg-gray-50">
                      {banner.imageUrl.includes('res.cloudinary.com') || banner.imageUrl.includes('storage.googleapis.com') ? (
                        <Image
                          src={banner.imageUrl}
                          alt={`Banner ${index + 1}`}
                          fill
                          className="object-contain rounded-xl"
                          priority={index === 0}
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 1152px, 1152px"
                        />
                      ) : (
                        <img
                          src={banner.imageUrl}
                          alt={`Banner ${index + 1}`}
                          className="w-full h-full object-contain rounded-xl"
                          style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {banners.length > 1 && (
              <>
                <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
                  <motion.button
                    onClick={handlePrev}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group"
                    aria-label="Previous banner"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </motion.button>
                  <motion.button
                    onClick={handleNext}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group"
                    aria-label="Next banner"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={`banner-dot-${index}`}
                      onClick={() => {
                        setDirection(index > currentBannerIndex ? 1 : -1);
                        setCurrentBannerIndex(index);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentBannerIndex
                          ? 'bg-white w-8'
                          : 'bg-white/50 hover:bg-white/80 w-1.5'
                      }`}
                      aria-label={`Go to banner ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
            </div>
          </div>
        </section>
      )}

      {banners.length === 0 && !loading && (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#ABC443]/10 via-white to-[#9BB03A]/10 py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900">Welcome to MimeCode</h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">Discover the best deals and savings</p>
          </div>
        </section>
      )} */}
      
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4 text-gray-900">
              {t('allCoupons')}
            </h1>
            <p className="text-center text-gray-700 text-sm sm:text-base">
              {t('browseAllCoupons')}
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('filterByCategory')}
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('allCategories')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <label htmlFor="store" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('filterByStore')}
                </label>
                <select
                  id="store"
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('allStoresFilter')}</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {(selectedCategory || selectedStore) && (
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    {t('clearSearch')}
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-gray-700">
              {t('showingArticles')} <span className="font-semibold text-gray-900">{filteredCoupons.length}</span> {t('ofArticles')} <span className="font-semibold text-gray-900">{coupons.length}</span> {t('coupons')}
            </div>
          </div>

          {/* Coupons Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 h-64 animate-pulse">
                  <div className="h-12 w-12 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-700 text-lg mb-4">{t('noCouponsFound')}</p>
              {(selectedCategory || selectedStore) && (
                <button
                  onClick={clearFilters}
                    className="text-gray-900 hover:text-[#FFE019] font-semibold underline"
                >
                  {t('noCouponsFoundMessage')}
                </button>
              )}
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {(() => {
                // Calculate pagination
                const totalPages = Math.ceil(filteredCoupons.length / couponsPerPage);
                const startIndex = (currentPage - 1) * couponsPerPage;
                const endIndex = startIndex + couponsPerPage;
                const paginatedCoupons = filteredCoupons.slice(startIndex, endIndex);
                
                return paginatedCoupons.map((coupon, index) => {
                const isRevealed = coupon.id && revealedCoupons.has(coupon.id);
                // Handle expiryDate - can be string, Date, or Firestore Timestamp
                const getExpiryDate = (expiryDate: any): Date | null => {
                  if (!expiryDate) return null;
                  if (expiryDate instanceof Date) return expiryDate;
                  if (expiryDate && typeof expiryDate.toDate === 'function') {
                    return expiryDate.toDate();
                  }
                  if (typeof expiryDate === 'string') {
                    const parsed = new Date(expiryDate);
                    return isNaN(parsed.getTime()) ? null : parsed;
                  }
                  if (typeof expiryDate === 'number') {
                    return new Date(expiryDate);
                  }
                  return null;
                };
                const expiryDateObj = getExpiryDate(coupon.expiryDate);
                const isExpired = expiryDateObj ? expiryDateObj < new Date() : false;
                
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
                      {(() => {
                        // Helper function to extract domain from URL
                        const extractDomain = (url: string | null | undefined): string | null => {
                          if (!url) return null;
                          let cleanUrl = url.trim();
                          cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
                          cleanUrl = cleanUrl.replace(/^www\./, '');
                          cleanUrl = cleanUrl.split('/')[0];
                          cleanUrl = cleanUrl.replace(/\.+$/, '');
                          return cleanUrl || null;
                        };

                        // Helper function to get favicon/logo from website URL
                        const getLogoFromWebsite = (websiteUrl: string | null | undefined): string | null => {
                          const domain = extractDomain(websiteUrl);
                          if (!domain) return null;
                          return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
                        };

                        // Get coupon logo URL with fallback to favicon
                        const getCouponLogoUrl = (): string | null => {
                          // If logo exists and is a full URL, use it
                          if (coupon.logoUrl) {
                            if (coupon.logoUrl.startsWith('http://') || coupon.logoUrl.startsWith('https://') || coupon.logoUrl.includes('cloudinary.com')) {
                              return coupon.logoUrl;
                            }
                          }
                          
                          // Fallback 1: Try to get favicon from coupon URL
                          if (coupon.url) {
                            const favicon = getLogoFromWebsite(coupon.url);
                            if (favicon) return favicon;
                          }
                          
                          // Fallback 2: Try to get favicon from store URL if coupon URL not available
                          if (coupon.storeIds && coupon.storeIds.length > 0 && stores.length > 0) {
                            const firstStoreId = coupon.storeIds[0];
                            const store = stores.find(s => {
                              // Try matching by ID (can be UUID or Store Id string)
                              return s.id === firstStoreId || 
                                     (typeof s.id === 'string' && firstStoreId && s.id.includes(firstStoreId)) ||
                                     (typeof firstStoreId === 'string' && s.id && firstStoreId.includes(s.id));
                            });
                            // Try websiteUrl, or Tracking Url, or Store Display Url from store data
                            const storeUrl = store?.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'];
                            if (storeUrl) {
                              const favicon = getLogoFromWebsite(storeUrl);
                              if (favicon) return favicon;
                            }
                          }
                          
                          // Fallback 3: Try to get favicon from store name (find store by name)
                          if (coupon.storeName && stores.length > 0) {
                            const store = stores.find(s => {
                              const storeName = s.name?.trim().toLowerCase();
                              const couponStoreName = coupon.storeName?.trim().toLowerCase();
                              return storeName === couponStoreName || 
                                     storeName?.includes(couponStoreName || '') ||
                                     couponStoreName?.includes(storeName || '');
                            });
                            // Try websiteUrl, or Tracking Url, or Store Display Url from store data
                            const storeUrl = store?.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'];
                            if (storeUrl) {
                              const favicon = getLogoFromWebsite(storeUrl);
                              if (favicon) return favicon;
                            }
                          }
                          
                          return null;
                        };

                        const logoUrl = getCouponLogoUrl();

                        return logoUrl ? (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                            <img
                              src={logoUrl}
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
                        ) : (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <span className="text-xs sm:text-sm font-semibold text-gray-700">
                              {coupon.code?.charAt(0) || coupon.storeName?.charAt(0) || '?'}
                            </span>
                          </div>
                        );
                      })()}
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
                            return coupon.code || coupon.storeName || 'Coupon';
                          })()}
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-green-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[10px]">Verified</span>
                          </div>
                          <div className="text-xs text-gray-600">
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
                            onClick={(e) => handleGetDeal(coupon, e)}
                            className="bg-black hover:bg-black text-white hover:text-[#FFE019] border-2 border-black font-semibold rounded-lg px-4 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap group relative overflow-hidden"
                          >
                            <span className="flex-1 flex items-center justify-center">
                              {isRevealed && coupon.couponType === 'code' && coupon.code ? (
                                <span className="font-bold text-sm sm:text-base">
                                  {coupon.code}
                                </span>
                              ) : (
                                <span className="text-sm sm:text-base">
                                  {getCodePreview(coupon)}
                                </span>
                              )}
                            </span>
                            {getLastTwoDigits(coupon) && !isRevealed && (
                              <div className="w-0 opacity-0 group-hover:w-20 group-hover:opacity-100 transition-all duration-300 ease-out flex items-center justify-center border-l-2 border-white/20 ml-2 pl-2 whitespace-nowrap overflow-hidden bg-white/10">
                                <span className="text-white font-bold text-xs">...{getLastTwoDigits(coupon)}</span>
                              </div>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
                });
              })()}
            </div>
            
            {/* Pagination Controls */}
            {(() => {
              const totalPages = Math.ceil(filteredCoupons.length / couponsPerPage);
              
              if (totalPages <= 1) return null;
              
              const getPageNumbers = () => {
                const pages: (number | string)[] = [];
                const maxVisible = 5;
                
                if (totalPages <= maxVisible) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  if (currentPage <= 3) {
                    for (let i = 1; i <= 4; i++) {
                      pages.push(i);
                    }
                    pages.push('ellipsis');
                    pages.push(totalPages);
                  } else if (currentPage >= totalPages - 2) {
                    pages.push(1);
                    pages.push('ellipsis');
                    for (let i = totalPages - 3; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    pages.push(1);
                    pages.push('ellipsis');
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                      pages.push(i);
                    }
                    pages.push('ellipsis');
                    pages.push(totalPages);
                  }
                }
                
                return pages;
              };
              
              return (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-semibold text-gray-900">
                      {((currentPage - 1) * couponsPerPage) + 1}
                    </span> to <span className="font-semibold text-gray-900">
                      {Math.min(currentPage * couponsPerPage, filteredCoupons.length)}
                    </span> of <span className="font-semibold text-gray-900">
                      {filteredCoupons.length}
                    </span> coupons
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 border-2 ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                          : 'bg-white text-gray-900 border-gray-900 hover:bg-gray-900 hover:text-white hover:shadow-lg active:scale-95'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Previous</span>
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => {
                        if (page === 'ellipsis') {
                          return (
                            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        
                        const pageNum = page as number;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setCurrentPage(pageNum);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 border-2 ${
                              currentPage === pageNum
                                ? 'bg-[#FFE019] text-gray-900 border-gray-900'
                                : 'bg-white text-gray-900 border-gray-300 hover:border-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Next Button */}
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 border-2 ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                          : 'bg-white text-gray-900 border-gray-900 hover:bg-gray-900 hover:text-white hover:shadow-lg active:scale-95'
                      }`}
                    >
                      <span>Next</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })()}
            </>
          )}
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
        onClose={handlePopupClose}
        onContinue={handlePopupContinue}
      />
    </div>
  );
}

export default function CouponsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ABC443] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading coupons...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <CouponsContent />
    </Suspense>
  );
}
