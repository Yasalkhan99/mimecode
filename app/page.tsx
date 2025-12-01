'use client';

import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ContactSupportModal from "./components/ContactSupportModal";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import { getBannersWithLayout, Banner } from '@/lib/services/bannerService';
import { getCoupons, Coupon } from '@/lib/services/couponService';
import { getNews, NewsArticle } from '@/lib/services/newsService';
import { getStores, Store } from '@/lib/services/storeService';
import { getLatestCoupons } from '@/lib/services/couponService';
import { getCategories, Category } from '@/lib/services/categoryService';
import { getActiveFAQs, FAQ } from '@/lib/services/faqService';
import { addToFavorites, removeFromFavorites, isFavorite } from '@/lib/services/favoritesService';
import CouponPopup from './components/CouponPopup';
import RegionSpecificOffers from './components/RegionSpecificOffers';
import dynamic from 'next/dynamic';

const SpotlightBanner = dynamic(() => import('./components/SpotlightBanner'), {
  ssr: false,
  loading: () => null
});
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [latestCoupons, setLatestCoupons] = useState<Coupon[]>([]);
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]); // All coupons for Featured Deals
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);
  const [latestCouponsWithLayout, setLatestCouponsWithLayout] = useState<(Coupon | null)[]>(Array(8).fill(null));
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealedCoupons, setRevealedCoupons] = useState<Set<string>>(new Set());
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const [isFeaturedDealsPaused, setIsFeaturedDealsPaused] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const featuredDealsSliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasSeenModal = localStorage.getItem('contactModalShown');
    if (!hasSeenModal) {
      const timer = setTimeout(() => {
        setIsContactModalOpen(true);
        localStorage.setItem('contactModalShown', 'true');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannersData, couponsData, newsData, latestCouponsData, categoriesData, allStoresData, faqsData] = await Promise.all([
          getBannersWithLayout(),
          getCoupons(),
          getNews(),
          getLatestCoupons(), // Get latest coupons with layout positions
          getCategories(),
          getStores(), // Get all stores for count and logos
          getActiveFAQs() // Get active FAQs
        ]);
        
        const bannersList = bannersData.filter(Boolean) as Banner[];
        setBanners(bannersList.slice(0, 4)); // Get first 4 banners
        setLatestCoupons(couponsData.slice(0, 6));
        setAllCoupons(couponsData); // Store all coupons for Featured Deals
        setLatestNews(newsData.slice(0, 4));
        
        // Filter latest coupons: Get 8 unique store coupons from all coupons
        // Use all coupons instead of just latestCouponsData to get variety from all stores
        const filteredLatestCoupons = filterCouponsWithFavicons(couponsData, allStoresData);
        setLatestCouponsWithLayout(filteredLatestCoupons);
        setCategories(categoriesData.slice(0, 6));
        setAllStores(allStoresData);
        setFaqs(faqsData);
      } catch (error) {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCloseModal = () => {
    setIsContactModalOpen(false);
  };

  // Helper function to filter coupons that have extractable favicons and ensure unique stores
  const filterCouponsWithFavicons = (coupons: (Coupon | null)[], stores: Store[]): (Coupon | null)[] => {
    const extractDomain = (url: string | null | undefined): string | null => {
      if (!url) return null;
      let cleanUrl = url.trim();
      cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
      cleanUrl = cleanUrl.replace(/^www\./, '');
      cleanUrl = cleanUrl.split('/')[0];
      cleanUrl = cleanUrl.replace(/\.+$/, '');
      return cleanUrl || null;
    };

    const getStoreForCoupon = (coupon: Coupon) => {
      // Try to find store by storeIds first
      if (coupon.storeIds && coupon.storeIds.length > 0 && stores.length > 0) {
        const firstStoreId = coupon.storeIds[0];
        const store = stores.find(s => {
          return s.id === firstStoreId || 
                 (typeof s.id === 'string' && firstStoreId && s.id.includes(firstStoreId)) ||
                 (typeof firstStoreId === 'string' && s.id && firstStoreId.includes(s.id));
        });
        if (store) return store;
      }
      
      // Try to find store by name
      if (coupon.storeName && stores.length > 0) {
        const store = stores.find(s => {
          const storeName = s.name?.trim().toLowerCase();
          const couponStoreName = coupon.storeName?.trim().toLowerCase();
          return storeName === couponStoreName || 
                 storeName?.includes(couponStoreName || '') ||
                 couponStoreName?.includes(storeName || '');
        });
        if (store) return store;
      }
      
      return null;
    };

    const hasExtractableFavicon = (coupon: Coupon): boolean => {
      // If logo exists and is a full URL, it's extractable
      if (coupon.logoUrl) {
        if (coupon.logoUrl.startsWith('http://') || coupon.logoUrl.startsWith('https://') || coupon.logoUrl.includes('cloudinary.com')) {
          return true;
        }
      }
      
      // Check if coupon has URL (can extract favicon from it)
      if (coupon.url) {
        const domain = extractDomain(coupon.url);
        if (domain) return true;
      }
      
      // Check if store has URL (can extract favicon from store URL)
      const store = getStoreForCoupon(coupon);
      if (store) {
        const storeUrl = store.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'];
        if (storeUrl) {
          const domain = extractDomain(storeUrl);
          if (domain) return true;
        }
      }
      
      return false;
    };

    const seenStores = new Set<string>();
    const filtered: (Coupon | null)[] = [];

    for (const coupon of coupons) {
      if (!coupon) continue;
      
      // Skip if favicon cannot be extracted
      if (!hasExtractableFavicon(coupon)) {
        continue;
      }
      
      // Get store identifier (prefer store ID, fallback to store name)
      const store = getStoreForCoupon(coupon);
      const storeIdentifier = store?.id || store?.name || coupon.storeName || coupon.storeIds?.[0] || '';
      
      // Skip if we've already seen this store
      if (storeIdentifier && seenStores.has(storeIdentifier)) {
        continue;
      }
      
      // Add to seen stores and result
      if (storeIdentifier) {
        seenStores.add(storeIdentifier);
      }
      filtered.push(coupon);
      
      // Stop when we have 8 unique stores
      if (filtered.length >= 8) {
        break;
      }
    }
    
    // Pad with nulls to always return 8 items
    while (filtered.length < 8) {
      filtered.push(null);
    }
    
    return filtered.slice(0, 8);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  const getCodePreview = (coupon: Coupon): string => {
    // Use custom button text if provided
    if (coupon.buttonText && coupon.buttonText.trim() !== '') {
      return coupon.buttonText;
    }
    // Default to type-based text
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

  // Helper to normalize URL - ensure it has protocol
  const normalizeUrl = (url: string | null | undefined): string | null => {
    if (!url || !url.trim()) return null;
    
    const trimmed = url.trim();
    
    // If already has protocol, return as is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    
    // If starts with //, add https:
    if (trimmed.startsWith('//')) {
      return `https:${trimmed}`;
    }
    
    // Otherwise, add https://
    return `https://${trimmed}`;
  };

  // Helper to get store for a coupon
  const getStoreForCoupon = (coupon: Coupon): Store | null => {
    if (!allStores || allStores.length === 0) return null;
    
    // Priority 1: Match by storeIds (exact match first)
    if (coupon.storeIds && coupon.storeIds.length > 0) {
      for (const storeId of coupon.storeIds) {
        // Try exact match
        const exactMatch = allStores.find(s => s.id === storeId);
        if (exactMatch) return exactMatch;
        
        // Try partial match
        const partialMatch = allStores.find(s => {
          if (!s.id || !storeId) return false;
          const sId = String(s.id).toLowerCase();
          const cId = String(storeId).toLowerCase();
          return sId === cId || sId.includes(cId) || cId.includes(sId);
        });
        if (partialMatch) return partialMatch;
      }
    }
    
    // Priority 2: Match by store name (exact match first, then partial)
    if (coupon.storeName) {
      const couponStoreName = coupon.storeName.trim().toLowerCase();
      
      // Try exact match
      const exactNameMatch = allStores.find(s => {
        const storeName = s.name?.trim().toLowerCase();
        return storeName === couponStoreName;
      });
      if (exactNameMatch) return exactNameMatch;
      
      // Try partial match
      const partialNameMatch = allStores.find(s => {
        const storeName = s.name?.trim().toLowerCase();
        if (!storeName) return false;
        return storeName.includes(couponStoreName) || couponStoreName.includes(storeName);
      });
      if (partialNameMatch) return partialNameMatch;
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
      navigator.clipboard.writeText(codeToCopy).catch(() => {});
    }
    
    // Mark coupon as revealed
    if (coupon.id) {
      setRevealedCoupons(prev => new Set(prev).add(coupon.id!));
    }
    
    // Get store for this specific coupon
    const store = getStoreForCoupon(coupon);
    
    // Get tracking URL - ALWAYS use store's tracking URL if available
    let urlToOpen: string | null = null;
    
    if (store) {
      // Priority 1: Store tracking URL (most reliable)
      urlToOpen = store.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'] || null;
    }
    
    // Fallback to coupon URL if no store URL
    if (!urlToOpen) {
      urlToOpen = coupon.url || null;
    }
    
    // Normalize URL to ensure it has protocol
    urlToOpen = normalizeUrl(urlToOpen);
    
    // Show popup
    setSelectedCoupon(coupon);
    setShowPopup(true);
    
    // Automatically open tracking URL in new tab after a short delay
    if (urlToOpen) {
      setTimeout(() => {
        window.open(urlToOpen!, '_blank', 'noopener,noreferrer');
      }, 500);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, coupon: Coupon) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!coupon.id) return;
    
    if (isFavorite(coupon.id)) {
      removeFromFavorites(coupon.id);
    } else {
      addToFavorites({
        couponId: coupon.id,
        code: coupon.code,
        storeName: coupon.storeName,
        discount: coupon.discount,
        discountType: coupon.discountType,
        description: coupon.description,
        logoUrl: coupon.logoUrl,
        url: coupon.url,
        addedAt: Date.now()
      });
    }
  };

  const handlePopupContinue = () => {
    if (!selectedCoupon) {
      setShowPopup(false);
      setSelectedCoupon(null);
      return;
    }
    
    // Get store for this coupon and use its tracking URL
    const store = getStoreForCoupon(selectedCoupon);
    let urlToOpen: string | null = null;
    
    if (store) {
      // Priority: Store tracking URL
      urlToOpen = store.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'] || null;
    }
    
    // Fallback to coupon URL
    if (!urlToOpen) {
      urlToOpen = selectedCoupon.url || null;
    }
    
    // Normalize URL to ensure it has protocol
    urlToOpen = normalizeUrl(urlToOpen);
    
    if (urlToOpen) {
      window.open(urlToOpen, '_blank', 'noopener,noreferrer');
    }
    
    setShowPopup(false);
    setSelectedCoupon(null);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    setSelectedCoupon(null);
  };

  // Ensure we always have 8 slots for latest coupons (code type)
  const displayLatestCoupons = [...Array(8)].map((_, index) => latestCouponsWithLayout[index] || null);
  
  // Get random deals for Featured Deals - ensure unique stores (NO DUPLICATES)
  // Fill empty slots with stores
  const displayLatestDeals = useMemo(() => {
    const result: (Coupon | Store | null)[] = [];
    const usedCouponIds = new Set<string>();
    const usedStoreIds = new Set<string>();
    const usedStoreNames = new Set<string>(); // Track by name too to avoid duplicates
    
    // Helper to get unique store identifier (use main getStoreForCoupon function)
    const getStoreIdentifier = (coupon: Coupon): string | null => {
      const store = getStoreForCoupon(coupon);
      if (store) {
        // Use store ID as primary identifier
        if (store.id) return `id:${store.id}`;
        // Fallback to store name
        if (store.name) return `name:${store.name.trim().toLowerCase()}`;
      }
      // If no store found, use coupon's store ID or name
      if (coupon.storeIds && coupon.storeIds.length > 0) {
        return `coupon-store-id:${coupon.storeIds[0]}`;
      }
      if (coupon.storeName) {
        return `coupon-store-name:${coupon.storeName.trim().toLowerCase()}`;
      }
      return null;
    };
    
    // First, try to get coupons from latestCouponsWithLayout (has layout positions)
    for (let i = 0; i < latestCouponsWithLayout.length && result.length < 8; i++) {
      const layoutCoupon = latestCouponsWithLayout[i];
      if (layoutCoupon && layoutCoupon.couponType === 'deal' && layoutCoupon.url && layoutCoupon.id) {
        const storeIdentifier = getStoreIdentifier(layoutCoupon);
        const store = getStoreForCoupon(layoutCoupon);
        
        // Check if store is already used (by ID or name)
        const isStoreUsed = storeIdentifier ? usedStoreIds.has(storeIdentifier) : false;
        const isStoreNameUsed = store?.name ? usedStoreNames.has(store.name.trim().toLowerCase()) : false;
        
        // Only add if we haven't used this coupon or store yet
        if (!usedCouponIds.has(layoutCoupon.id) && !isStoreUsed && !isStoreNameUsed) {
          result.push(layoutCoupon);
          usedCouponIds.add(layoutCoupon.id);
          if (storeIdentifier) usedStoreIds.add(storeIdentifier);
          if (store?.name) usedStoreNames.add(store.name.trim().toLowerCase());
        }
      }
    }
    
    // Get all deal type coupons with URLs (for favicon logos)
    const dealCoupons = allCoupons.filter(c => 
      c && 
      c.id && 
      c.couponType === 'deal' && 
      c.url && 
      c.isActive !== false &&
      !usedCouponIds.has(c.id)
    );
    
    // Shuffle and pick unique stores - STRICT: no duplicate stores
    const shuffled = [...dealCoupons].sort(() => Math.random() - 0.5);
    
    for (const coupon of shuffled) {
      if (result.length >= 8) break;
      
      const storeIdentifier = getStoreIdentifier(coupon);
      const store = getStoreForCoupon(coupon);
      
      // Check if store is already used (by ID or name)
      const isStoreUsed = storeIdentifier ? usedStoreIds.has(storeIdentifier) : false;
      const isStoreNameUsed = store?.name ? usedStoreNames.has(store.name.trim().toLowerCase()) : false;
      
      // STRICT: Only add if store is completely unique (no duplicates by ID or name)
      if (!isStoreUsed && !isStoreNameUsed) {
        result.push(coupon);
        if (coupon.id) usedCouponIds.add(coupon.id);
        if (storeIdentifier) usedStoreIds.add(storeIdentifier);
        if (store?.name) usedStoreNames.add(store.name.trim().toLowerCase());
      }
    }
    
    // If still need more, try any coupon with URL (but still avoid duplicate stores)
    if (result.length < 8) {
      const remainingDeals = allCoupons.filter(c => {
        if (!c || !c.id || usedCouponIds.has(c.id)) return false;
        if (c.couponType !== 'deal' || !c.url || c.isActive === false) return false;
        
        const storeIdentifier = getStoreIdentifier(c);
        const store = getStoreForCoupon(c);
        const isStoreUsed = storeIdentifier ? usedStoreIds.has(storeIdentifier) : false;
        const isStoreNameUsed = store?.name ? usedStoreNames.has(store.name.trim().toLowerCase()) : false;
        
        // Still avoid duplicate stores
        return !isStoreUsed && !isStoreNameUsed;
      });
      
      const shuffledRemaining = [...remainingDeals].sort(() => Math.random() - 0.5);
      
      for (const coupon of shuffledRemaining) {
        if (result.length >= 8) break;
        const storeIdentifier = getStoreIdentifier(coupon);
        const store = getStoreForCoupon(coupon);
        const isStoreUsed = storeIdentifier ? usedStoreIds.has(storeIdentifier) : false;
        const isStoreNameUsed = store?.name ? usedStoreNames.has(store.name.trim().toLowerCase()) : false;
        
        if (!isStoreUsed && !isStoreNameUsed && coupon.id) {
          result.push(coupon);
          usedCouponIds.add(coupon.id);
          if (storeIdentifier) usedStoreIds.add(storeIdentifier);
          if (store?.name) usedStoreNames.add(store.name.trim().toLowerCase());
        }
      }
    }
    
    // Fill empty slots with stores (instead of nulls)
    if (result.length < 8 && allStores.length > 0) {
      // Get stores that haven't been used yet
      const availableStores = allStores.filter(store => {
        if (!store.id && !store.name) return false;
        const storeId = store.id ? `id:${store.id}` : null;
        const storeName = store.name ? store.name.trim().toLowerCase() : null;
        const isStoreUsed = storeId ? usedStoreIds.has(storeId) : false;
        const isStoreNameUsed = storeName ? usedStoreNames.has(storeName) : false;
        return !isStoreUsed && !isStoreNameUsed;
      });
      
      // Shuffle available stores
      const shuffledStores = [...availableStores].sort(() => Math.random() - 0.5);
      
      // Fill remaining slots with stores
      for (let i = 0; i < shuffledStores.length && result.length < 8; i++) {
        const store = shuffledStores[i];
        result.push(store as any); // Cast to any to allow Store in result array
        if (store.id) {
          usedStoreIds.add(`id:${store.id}`);
        }
        if (store.name) {
          usedStoreNames.add(store.name.trim().toLowerCase());
        }
      }
    }
    
    // Pad with nulls if still not 8 items
    while (result.length < 8) {
      result.push(null);
    }
    
    return result.slice(0, 8);
  }, [latestCouponsWithLayout, allCoupons, allStores]);

  // Auto-slide banners
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      setDirection(1);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  // Swipe handlers
  const handlePrev = () => {
    setDirection(-1);
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  // Newsletter subscription handler
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      setNewsletterMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setNewsletterLoading(true);
    setNewsletterMessage(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setNewsletterMessage({ type: 'success', text: 'Successfully subscribed! Check your inbox.' });
        setNewsletterEmail('');
      } else {
        setNewsletterMessage({ type: 'error', text: data.error || 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      setNewsletterMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Banner Section - Retail Store Style */}
      {banners.length > 0 && (
        <section className="relative w-full bg-white py-4 sm:py-6 md:py-8">
          {/* Container with padding and max-width */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {/* Hero Slider with rounded corners */}
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
                    <Link href="#" className="block w-full h-full rounded-xl overflow-hidden bg-gray-50">
                      {banner.imageUrl.includes('res.cloudinary.com') || banner.imageUrl.includes('storage.googleapis.com') ? (
                        <Image
                          src={banner.imageUrl}
                          alt={`Banner ${index + 1}`}
                          fill
                          className="object-contain rounded-xl"
                          priority={index === 0}
                          sizes="100vw"
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

            {/* Minimal Navigation - Bottom Right */}
            {banners.length > 1 && (
              <>
                {/* Arrow Navigation */}
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

                {/* Dots Indicator - Bottom Center */}
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

      {/* Fallback if no banners */}
      {banners.length === 0 && !loading && (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#ABC443]/10 via-white to-[#9BB03A]/10 py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900">Welcome to MimeCode</h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">Discover the best deals and savings</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/coupons"
                className="px-8 py-4 bg-[#ABC443] text-white font-semibold rounded-xl hover:bg-[#9BB03A] transition-all"
              >
                Explore Deals
              </Link>
              <Link
                href="/stores"
                className="px-8 py-4 bg-white border-2 border-[#ABC443] text-[#ABC443] font-semibold rounded-xl hover:bg-[#ABC443] hover:text-white transition-all"
              >
                Browse Stores
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Section Heading - Coupons and Deals */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
              Exclusive <span className="text-[#16a34a]">Coupons</span> and <span className="text-[#16a34a]">Deals</span> from Your Favorite Stores
            </h2>
          </motion.div>
        </div>
      </section>

        {/* Latest Coupons Section - 8 Layout Slots (Code Type Only) */}
        <section className="py-8 sm:py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                  Latest Coupons
                </h2>
                <Link
                  href="/coupons"
                  className="text-blue-500 hover:text-blue-600 font-medium text-sm sm:text-base transition-colors"
                >
                  View All
                </Link>
              </div>

              {/* Coupons Slider - Single Row Horizontal Scroll with Auto-scroll */}
              <div 
                className="overflow-hidden pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
                onMouseEnter={() => setIsSliderPaused(true)}
                onMouseLeave={() => setIsSliderPaused(false)}
              >
                <div 
                  ref={sliderRef}
                  className="flex gap-4 md:gap-5"
                  style={{ 
                    width: 'fit-content',
                    animation: 'scrollLeft 30s linear infinite',
                    animationPlayState: isSliderPaused ? 'paused' : 'running',
                    willChange: 'transform'
                  }}
                >
              {[...displayLatestCoupons, ...displayLatestCoupons].map((coupon, index) => {
                const layoutNumber = (index % displayLatestCoupons.length) + 1;
                const isDuplicate = index >= displayLatestCoupons.length;

                if (!coupon) {
                  // Empty Slot
                  return (
                    <div
                      key={`latest-coupon-empty-${index}-${isDuplicate ? 'dup' : ''}`}
                      className="bg-gray-50 rounded-lg p-4 sm:p-5 border-2 border-dashed flex flex-col items-center justify-center min-h-[250px] border-gray-200 w-[200px] sm:w-[220px] flex-shrink-0"
                    >
                      <div className="text-gray-400 text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-xs font-medium">Layout {layoutNumber} Empty Slot</p>
                      </div>
                    </div>
                  );
                }

                // Coupon Card - Clean Minimalist Style
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

                // Get store object for name and URL
                const getStoreForCoupon = () => {
                  // Try to find store by storeIds first
                  if (coupon.storeIds && coupon.storeIds.length > 0 && allStores.length > 0) {
                    const firstStoreId = coupon.storeIds[0];
                    const store = allStores.find(s => {
                      return s.id === firstStoreId || 
                             (typeof s.id === 'string' && firstStoreId && s.id.includes(firstStoreId)) ||
                             (typeof firstStoreId === 'string' && s.id && firstStoreId.includes(s.id));
                    });
                    if (store) return store;
                  }
                  
                  // Try to find store by name
                  if (coupon.storeName && allStores.length > 0) {
                    const store = allStores.find(s => {
                      const storeName = s.name?.trim().toLowerCase();
                      const couponStoreName = coupon.storeName?.trim().toLowerCase();
                      return storeName === couponStoreName || 
                             storeName?.includes(couponStoreName || '') ||
                             couponStoreName?.includes(storeName || '');
                    });
                    if (store) return store;
                  }
                  
                  return null;
                };

                const store = getStoreForCoupon();
                const storeUrl = store?.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'];
                const storeName = store?.name || coupon.storeName || '';

                // Get coupon logo URL with fallback to favicon - prioritize store URL
                const getCouponLogoUrl = (): string | null => {
                  // If logo exists and is a full URL, use it
                  if (coupon.logoUrl) {
                    if (coupon.logoUrl.startsWith('http://') || coupon.logoUrl.startsWith('https://') || coupon.logoUrl.includes('cloudinary.com')) {
                      return coupon.logoUrl;
                    }
                  }
                  
                  // Priority 1: Try to get favicon from store URL (more reliable than coupon URL)
                  if (storeUrl) {
                    const favicon = getLogoFromWebsite(storeUrl);
                    if (favicon) return favicon;
                  }
                  
                  // Priority 2: Try to get favicon from coupon URL
                  if (coupon.url) {
                    const favicon = getLogoFromWebsite(coupon.url);
                    if (favicon) return favicon;
                  }
                  
                  return null;
                };

                const logoUrl = getCouponLogoUrl();

                // Handle expiryDate
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
                const expiryDateObj = getExpiryDate(coupon?.expiryDate);
                const isExpired = expiryDateObj ? expiryDateObj < new Date() : false;

                return (
                  <motion.div
                    key={`latest-coupon-${coupon.id || 'no-id'}-${index}-${isDuplicate ? 'dup' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: (index % displayLatestCoupons.length) * 0.05 }}
                    className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 flex flex-col relative overflow-hidden group cursor-pointer w-[200px] sm:w-[220px] flex-shrink-0"
                    onClick={(e) => handleGetDeal(coupon, e)}
                  >
                    {/* Label Badge - Top Left */}
                    <div className="absolute top-3 left-3 z-10">
                      {isExpired ? (
                        <span className="bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                          EXPIRED
                        </span>
                      ) : coupon.dealScope === 'online-only' ? (
                        <span className="bg-blue-700 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                          ONLINE ONLY
                        </span>
                      ) : (
                        <span className="bg-blue-700 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                          SITEWIDE
                        </span>
                      )}
                    </div>

                    {/* Logo Section - Centered */}
                    <div className="flex items-center justify-center h-32 sm:h-40 mb-4 relative">
                      {logoUrl ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <img
                            src={logoUrl}
                            alt={coupon.storeName || coupon.code || 'Coupon'}
                            className="max-w-full max-h-full object-contain"
                            style={{ 
                              width: 'auto', 
                              height: 'auto',
                              maxWidth: '120px',
                              maxHeight: '120px'
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-24 h-24 rounded-lg bg-gradient-to-br from-[#ABC443] to-[#41361A] flex items-center justify-center">
                                    <span class="text-white font-bold text-2xl">${(coupon.storeName || coupon.code || 'C').charAt(0)}</span>
                                  </div>
                                `;
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-[#ABC443] to-[#41361A] flex items-center justify-center">
                          <span className="text-white font-bold text-2xl">
                            {(coupon.storeName || coupon.code || 'C').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {/* Discount Badge - Bottom Right of Logo Area */}
                      <div className="absolute bottom-0 right-0 bg-gray-200 rounded-lg px-3 py-1.5">
                        <span className="text-gray-900 font-bold text-sm sm:text-base">
                          {coupon.discount || 25}% OFF
                        </span>
                      </div>
                    </div>

                    {/* Brand Name */}
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 text-center uppercase line-clamp-2">
                      {storeName || `${coupon.discount || 25}% OFF DEAL`}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-gray-600 mb-4 text-center line-clamp-2 leading-relaxed flex-grow">
                      {storeName ? `Visit ${storeName} for great deals` : `Save ${coupon.discount || 25}% on your order`}
                    </p>

                    {/* Get Code Button - With Code Preview on Hover */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetDeal(coupon, e);
                      }}
                      className="w-full bg-[#ABC443] hover:bg-[#9BB03A] text-white font-semibold rounded-lg px-4 py-2.5 flex items-center justify-between transition-all duration-300 shadow-sm hover:shadow-md group"
                    >
                      <span className="text-sm flex-1">
                        {coupon.id && revealedCoupons.has(coupon.id) && coupon.code ? (
                          coupon.code
                        ) : (
                          getCodePreview(coupon)
                        )}
                      </span>
                      {getLastTwoDigits(coupon) && !(coupon.id && revealedCoupons.has(coupon.id)) && (
                        <span className="text-xs font-bold border-2 border-dashed border-white/50 rounded px-1.5 py-0.5 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          ...{getLastTwoDigits(coupon)}
                        </span>
                      )}
                    </button>
                  </motion.div>
                );
                })}
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="space-y-16">
          {/* Featured Deals Section - Modern Card Style */}
            <section>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                  Featured Deals
                </h2>
                <Link
                  href="/coupons"
                  className="text-blue-500 hover:text-blue-600 font-medium text-sm sm:text-base transition-colors"
                >
                  View All
                </Link>
              </div>

              {/* Coupons Slider - Featured Deals Style with Auto-scroll */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
                  {[...Array(8)].map((_, i) => (
                    <div key={`featured-deal-loading-${i}`} className="bg-white rounded-lg p-4 sm:p-5 h-64 animate-pulse border border-gray-200 flex flex-col">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gray-200 rounded"></div>
                        <div className="w-24 h-4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="space-y-2 mb-4 flex-grow">
                        <div className="w-full h-3 bg-gray-200 rounded"></div>
                        <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
                      </div>
                      <div className="w-full h-8 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  className="overflow-hidden pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
                  onMouseEnter={() => setIsFeaturedDealsPaused(true)}
                  onMouseLeave={() => setIsFeaturedDealsPaused(false)}
                >
                  <div 
                    ref={featuredDealsSliderRef}
                    className="flex gap-4 md:gap-5"
                    style={{ 
                      width: 'fit-content',
                      animation: 'scrollLeft 30s linear infinite',
                      animationPlayState: isFeaturedDealsPaused ? 'paused' : 'running',
                      willChange: 'transform'
                    }}
                  >
                    {/* Render 3 copies for seamless infinite scroll */}
                    {[...displayLatestDeals, ...displayLatestDeals, ...displayLatestDeals].map((item, index) => {
                      const isDuplicate = index >= displayLatestDeals.length;
                      
                      // Check if item is a Store (not a Coupon)
                      const isStore = item && 'websiteUrl' in item && !('couponType' in item);
                      const coupon = isStore ? null : (item as Coupon | null);
                      const store = isStore ? (item as Store) : null;
                      
                      if (!item) {
                        // Empty Slot - calculate actual layout number (not duplicate index)
                        const actualIndex = index % displayLatestDeals.length;
                        const layoutNumber = actualIndex + 1;
                        return (
                          <div
                            key={`featured-deal-empty-copy-${Math.floor(index / displayLatestDeals.length)}-idx-${index}`}
                            className="bg-gray-50 rounded-lg p-4 sm:p-5 border-2 border-dashed flex flex-col items-center justify-center min-h-[250px] border-gray-200 w-[200px] sm:w-[220px] flex-shrink-0"
                          >
                            <div className="text-gray-400 text-center">
                              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                              <p className="text-xs font-medium">Layout {layoutNumber} Empty Slot</p>
                            </div>
                          </div>
                        );
                      }
                      
                      // Render Store Card (for empty slots filled with stores)
                      if (isStore && store) {
                        const storeUrl = store.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'];
                        const storeName = store.name || '';
                        
                        // Get store logo
                        const extractDomain = (url: string | null | undefined): string | null => {
                          if (!url) return null;
                          let cleanUrl = url.trim();
                          cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
                          cleanUrl = cleanUrl.replace(/^www\./, '');
                          cleanUrl = cleanUrl.split('/')[0];
                          cleanUrl = cleanUrl.replace(/\.+$/, '');
                          return cleanUrl || null;
                        };
                        
                        const getLogoFromWebsite = (websiteUrl: string | null | undefined): string | null => {
                          const domain = extractDomain(websiteUrl);
                          if (!domain) return null;
                          return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
                        };
                        
                        let logoUrl: string | null = null;
                        if (store.logoUrl) {
                          if (store.logoUrl.startsWith('http://') || store.logoUrl.startsWith('https://') || store.logoUrl.includes('cloudinary.com')) {
                            logoUrl = store.logoUrl;
                          }
                        }
                        if (!logoUrl && storeUrl) {
                          logoUrl = getLogoFromWebsite(storeUrl);
                        }
                        
                        // Create a temporary coupon object for stores to work with popup
                        const storeCoupon: Coupon = {
                          id: `store-${store.id}`,
                          title: storeName,
                          description: `Visit ${storeName} for great deals`,
                          storeName: storeName,
                          storeIds: [store.id],
                          url: storeUrl || '',
                          logoUrl: logoUrl || '',
                          discount: 25,
                          discountType: 'percentage',
                          couponType: 'deal',
                          dealScope: 'sitewide',
                          code: null,
                          expiryDate: null,
                          createdAt: new Date(),
                          updatedAt: new Date()
                        };
                        
                        return (
                          <motion.div
                            key={`featured-store-${store.id || store.name || 'unknown'}-copy-${Math.floor(index / displayLatestDeals.length)}-idx-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: (index % displayLatestDeals.length) * 0.05 }}
                            className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 flex flex-col relative overflow-hidden group cursor-pointer w-[200px] sm:w-[220px] flex-shrink-0"
                            onClick={(e) => handleGetDeal(storeCoupon, e)}
                          >
                            {/* Label Badge - Top Left */}
                            <div className="absolute top-3 left-3 z-10">
                              <span className="bg-blue-700 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                SITEWIDE
                              </span>
                            </div>

                            {/* Logo Section - Centered */}
                            <div className="flex items-center justify-center h-32 sm:h-40 mb-4 relative">
                              {logoUrl ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <img
                                    src={logoUrl}
                                    alt={storeName}
                                    className="max-w-full max-h-full object-contain"
                                    style={{ 
                                      width: 'auto', 
                                      height: 'auto',
                                      maxWidth: '120px',
                                      maxHeight: '120px'
                                    }}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `
                                          <div class="w-24 h-24 rounded-lg bg-gradient-to-br from-[#ABC443] to-[#41361A] flex items-center justify-center">
                                            <span class="text-white font-bold text-2xl">${storeName.charAt(0).toUpperCase()}</span>
                                          </div>
                                        `;
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-[#ABC443] to-[#41361A] flex items-center justify-center">
                                  <span className="text-white font-bold text-2xl">
                                    {storeName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              
                              {/* Discount Badge - Bottom Right of Logo Area */}
                              <div className="absolute bottom-0 right-0 bg-gray-200 rounded-lg px-3 py-1.5">
                                <span className="text-gray-900 font-bold text-sm sm:text-base">
                                  25% OFF
                                </span>
                              </div>
                            </div>

                            {/* Brand Name */}
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 text-center uppercase">
                              {storeName}
                            </h3>

                            {/* Description */}
                            <p className="text-xs sm:text-sm text-gray-600 mb-4 text-center line-clamp-2 leading-relaxed flex-grow">
                              Visit {storeName} for great deals
                            </p>

                            {/* Get Deal Button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGetDeal(storeCoupon, e);
                              }}
                              className="w-full bg-[#ABC443] hover:bg-[#9BB03A] text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
                            >
                              Get Deal
                            </button>
                          </motion.div>
                        );
                      }

                      // Featured Deal Card - Modern Style (for coupons)
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
                      const expiryDateObj = getExpiryDate(coupon?.expiryDate);
                      const isExpired = expiryDateObj ? expiryDateObj < new Date() : false;
                      
                      return (
                        <motion.div
                          key={`featured-deal-${coupon.id || 'no-id'}-copy-${Math.floor(index / displayLatestDeals.length)}-idx-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: (index % displayLatestDeals.length) * 0.05 }}
                          className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 flex flex-col relative overflow-hidden group cursor-pointer w-[200px] sm:w-[220px] flex-shrink-0"
                          onClick={(e) => handleGetDeal(coupon, e)}
                        >
                        {/* Label Badge - Top Left */}
                        <div className="absolute top-3 left-3 z-10">
                          {isExpired ? (
                            <span className="bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                              EXPIRED
                            </span>
                          ) : coupon.dealScope === 'online-only' ? (
                            <span className="bg-blue-700 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                              ONLINE ONLY
                            </span>
                          ) : (
                            <span className="bg-blue-700 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                              SITEWIDE
                            </span>
                          )}
                        </div>

                        {/* Logo Section - Centered */}
                        <div className="flex items-center justify-center h-32 sm:h-40 mb-4 relative">
                          {(() => {
                            // Helper to extract domain from URL
                            const extractDomain = (url: string | null | undefined): string | null => {
                              if (!url) return null;
                              let cleanUrl = url.trim();
                              cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
                              cleanUrl = cleanUrl.replace(/^www\./, '');
                              cleanUrl = cleanUrl.split('/')[0];
                              cleanUrl = cleanUrl.replace(/\.+$/, '');
                              return cleanUrl || null;
                            };

                            // Helper to get favicon/logo from website URL - improved domain extraction
                            const getLogoFromWebsite = (websiteUrl: string | null | undefined): string | null => {
                              if (!websiteUrl) return null;
                              
                              // Clean and extract domain properly
                              let cleanUrl = websiteUrl.trim();
                              
                              // Remove protocol
                              cleanUrl = cleanUrl.replace(/^https?:\/\//i, '');
                              
                              // Remove www.
                              cleanUrl = cleanUrl.replace(/^www\./i, '');
                              
                              // Get domain part only (before first /)
                              cleanUrl = cleanUrl.split('/')[0];
                              
                              // Remove port if present
                              cleanUrl = cleanUrl.split(':')[0];
                              
                              // Remove trailing dots
                              cleanUrl = cleanUrl.replace(/\.+$/, '');
                              
                              if (!cleanUrl) return null;
                              
                              // Use Google favicon API with proper domain
                              return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanUrl)}&sz=128`;
                            };

                            // Get store object for logo - improved matching
                            const getStoreForCoupon = () => {
                              if (!allStores || allStores.length === 0) return null;
                              
                              // Priority 1: Match by storeIds (exact match first)
                              if (coupon.storeIds && coupon.storeIds.length > 0) {
                                for (const storeId of coupon.storeIds) {
                                  // Try exact match
                                  const exactMatch = allStores.find(s => s.id === storeId);
                                  if (exactMatch) return exactMatch;
                                  
                                  // Try partial match
                                  const partialMatch = allStores.find(s => {
                                    if (!s.id || !storeId) return false;
                                    const sId = String(s.id).toLowerCase();
                                    const cId = String(storeId).toLowerCase();
                                    return sId === cId || sId.includes(cId) || cId.includes(sId);
                                  });
                                  if (partialMatch) return partialMatch;
                                }
                              }
                              
                              // Priority 2: Match by store name (exact match first, then partial)
                              if (coupon.storeName) {
                                const couponStoreName = coupon.storeName.trim().toLowerCase();
                                
                                // Try exact match
                                const exactNameMatch = allStores.find(s => {
                                  const storeName = s.name?.trim().toLowerCase();
                                  return storeName === couponStoreName;
                                });
                                if (exactNameMatch) return exactNameMatch;
                                
                                // Try partial match
                                const partialNameMatch = allStores.find(s => {
                                  const storeName = s.name?.trim().toLowerCase();
                                  if (!storeName) return false;
                                  return storeName.includes(couponStoreName) || couponStoreName.includes(storeName);
                                });
                                if (partialNameMatch) return partialNameMatch;
                              }
                              
                              return null;
                            };

                            const store = getStoreForCoupon();
                            // Get store tracking URL - this is the most reliable source
                            const storeTrackingUrl = store?.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'];
                            
                            // Get logo URL with priority: store tracking URL favicon > store.logoUrl > coupon.logoUrl > coupon URL favicon
                            // MOST IMPORTANT: Use store tracking URL for favicon
                            let logoUrl: string | null = null;
                            
                            // Priority 1: Favicon from store tracking URL (MOST IMPORTANT - most reliable)
                            if (storeTrackingUrl) {
                              logoUrl = getLogoFromWebsite(storeTrackingUrl);
                            }
                            
                            // Priority 2: Store logo URL (if available)
                            if (!logoUrl && store?.logoUrl) {
                              if (store.logoUrl.startsWith('http://') || store.logoUrl.startsWith('https://') || store.logoUrl.includes('cloudinary.com')) {
                                logoUrl = store.logoUrl;
                              }
                            }
                            
                            // Priority 3: Coupon logo URL (fallback)
                            if (!logoUrl && coupon.logoUrl) {
                              if (coupon.logoUrl.startsWith('http://') || coupon.logoUrl.startsWith('https://') || coupon.logoUrl.includes('cloudinary.com')) {
                                logoUrl = coupon.logoUrl;
                              }
                            }
                            
                            // Priority 4: Favicon from coupon URL (last resort)
                            if (!logoUrl && coupon.url) {
                              logoUrl = getLogoFromWebsite(coupon.url);
                            }

                            if (logoUrl) {
                              // Always use img tag for favicons (Google favicon API)
                              return (
                                <div className="w-full h-full flex items-center justify-center">
                                  <img
                                    src={logoUrl}
                                    alt={coupon.storeName || coupon.code || 'Coupon'}
                                    className="max-w-full max-h-full object-contain"
                                    style={{ 
                                      width: 'auto', 
                                      height: 'auto',
                                      maxWidth: '120px',
                                      maxHeight: '120px'
                                    }}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `
                                          <div class="w-24 h-24 rounded-lg bg-gradient-to-br from-[#ABC443] to-[#41361A] flex items-center justify-center">
                                            <span class="text-white font-bold text-2xl">${(coupon.storeName || coupon.code || 'C').charAt(0)}</span>
                                          </div>
                                        `;
                                      }
                                    }}
                                  />
                                </div>
                              );
                            } else {
                              return (
                                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-[#ABC443] to-[#41361A] flex items-center justify-center">
                                  <span className="text-white font-bold text-2xl">
                                    {(coupon.storeName || coupon.code || 'C').charAt(0)}
                                  </span>
                                </div>
                              );
                            }
                          })()}
                          
                          {/* Discount Badge - Bottom Right of Logo Area */}
                          <div className="absolute bottom-0 right-0 bg-gray-200 rounded-lg px-3 py-1.5">
                            <span className="text-gray-900 font-bold text-sm sm:text-base">
                              {coupon.discount || 0}% OFF
                            </span>
                          </div>
                        </div>

                        {/* Brand Name */}
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 text-center uppercase line-clamp-2">
                          {(() => {
                            const storeName = store?.name || coupon.storeName;
                            return storeName || `${coupon.discount || 25}% OFF DEAL`;
                          })()}
                        </h3>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-gray-600 mb-4 text-center line-clamp-2 leading-relaxed flex-grow">
                          {(() => {
                            const storeName = store?.name || coupon.storeName;
                            return storeName ? `Visit ${storeName} for great deals` : `Save ${coupon.discount || 25}% on your order`;
                          })()}
                        </p>

                        {/* Get Code Button - With Code Preview on Hover */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetDeal(coupon, e);
                          }}
                          className="w-full bg-[#ABC443] hover:bg-[#9BB03A] text-white font-semibold rounded-lg px-4 py-2.5 flex items-center justify-between transition-all duration-300 shadow-sm hover:shadow-md group"
                        >
                          <span className="text-sm flex-1">
                            {coupon.id && revealedCoupons.has(coupon.id) && coupon.code ? (
                              coupon.code
                            ) : (
                              getCodePreview(coupon)
                            )}
                          </span>
                          {getLastTwoDigits(coupon) && !(coupon.id && revealedCoupons.has(coupon.id)) && (
                            <span className="text-xs font-bold border-2 border-dashed border-white/50 rounded px-1.5 py-0.5 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              ...{getLastTwoDigits(coupon)}
                            </span>
                          )}
                        </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Region Specific Offers Section */}
            <RegionSpecificOffers />

            {/* Stores Of The Season Section */}
            {allStores && allStores.length > 0 && allStores.filter(store => store && store.logoUrl).length > 0 && (
              <section className="py-12 md:py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {/* Header Text */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8 md:mb-12"
                  >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                      Stores Of The <span className="text-[#16a34a]">Season</span>
                    </h2>
                  </motion.div>
                  
                  {/* Horizontal Scrollable Store Logos */}
                  <div className="relative overflow-hidden mb-6 md:mb-8">
                    <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4" style={{ scrollBehavior: 'smooth' }}>
                      {(selectedCategoryId 
                        ? allStores.filter(store => store && store.logoUrl && store.categoryId === selectedCategoryId)
                        : allStores.filter(store => store && store.logoUrl)
                      ).map((store, index) => (
                        <Link
                          key={store.id || `store-${index}`}
                          href={`/stores/${store.slug || store.id}`}
                          className="flex flex-col items-center flex-shrink-0 group"
                        >
                          {/* Circular Logo Container */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center p-3 mb-3 group-hover:scale-105">
                            {store.logoUrl ? (
                              <img
                                src={store.logoUrl}
                                alt={store.name || 'Store'}
                                className="max-w-full max-h-full object-contain rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center rounded-full bg-gray-100"><span class="text-sm font-semibold text-gray-500">${(store.name || 'S').charAt(0)}</span></div>`;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center rounded-full bg-gray-100">
                                <span className="text-sm font-semibold text-gray-500">
                                  {(store.name || 'S').charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          {/* Store Name */}
                          <p className="text-sm md:text-base font-medium text-gray-900 text-center max-w-[100px] sm:max-w-[120px] truncate">
                            {store.name || 'Store'}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Category Tags */}
                  {categories && categories.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                      <button
                        onClick={() => setSelectedCategoryId(null)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                          selectedCategoryId === null
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        Discover more
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategoryId(category.id || null)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                            selectedCategoryId === category.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-blue-600 border border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* FAQ Section */}
                  {faqs && faqs.length > 0 && (
                    <div className="mt-12 md:mt-16">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="bg-white rounded-lg shadow-sm p-6 md:p-8"
                      >
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 md:mb-8">
                          Frequently Asked <span className="text-[#16a34a]">Questions</span>
                        </h2>
                        <div className="space-y-0">
                          {faqs.map((faq, index) => (
                            <div
                              key={faq.id}
                              className="border-b border-gray-200 last:border-b-0"
                            >
                              <button
                                onClick={() => setOpenFAQIndex(openFAQIndex === index ? null : index)}
                                className="w-full flex items-center justify-between py-4 md:py-5 text-left hover:bg-gray-50 transition-colors"
                              >
                                <span className="text-[#16a34a] font-medium text-sm sm:text-base md:text-lg pr-4">
                                  {faq.question}
                                </span>
                                <svg
                                  className={`w-5 h-5 text-gray-900 flex-shrink-0 transition-transform duration-200 ${
                                    openFAQIndex === index ? 'rotate-180' : ''
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {openFAQIndex === index && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pb-4 md:pb-5 text-gray-700 text-sm sm:text-base leading-relaxed">
                                    {faq.answer}
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Newsletter Section - Compact Design */}
                  <div className="mt-12 md:mt-16">
                    <div className="max-w-4xl mx-auto">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm"
                      >
                        {/* Header Bar */}
                        <div className="bg-[#16a34a] py-3 px-4 text-center">
                          <h3 className="text-white font-bold text-sm sm:text-base">Daily Exclusive Deals</h3>
                        </div>
                        
                        {/* Content Area */}
                        <div className="p-6 md:p-8">
                          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                            Get <span className="text-[#16a34a]">Exclusive Coupons</span> and <span className="text-[#16a34a]">Best Deals</span> Delivered to Your Inbox
                          </h2>
                          
                          <form
                            onSubmit={handleNewsletterSubmit}
                            className="flex flex-col sm:flex-row gap-3 mb-4"
                          >
                            <input
                              type="email"
                              placeholder="Email Address"
                              value={newsletterEmail}
                              onChange={(e) => setNewsletterEmail(e.target.value)}
                              className="flex-1 px-4 py-3 border border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] text-gray-900 placeholder-gray-500"
                              disabled={newsletterLoading}
                              required
                            />
                            <button
                              type="submit"
                              disabled={newsletterLoading}
                              className="bg-[#16a34a] hover:bg-[#15803d] text-white font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {newsletterLoading ? 'Subscribing...' : 'Unlock Deals'}
                            </button>
                          </form>
                          
                          {/* Disclaimer Text */}
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                            By clicking unlock deals you confirm that you are 16 years of age or older and you agree to our{' '}
                            <Link href="/terms-of-service" className="underline hover:text-gray-900">
                              Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link href="/privacy-policy" className="underline hover:text-gray-900">
                              Privacy Policy
                            </Link>
                            . You may unsubscribe at any time.
                          </p>
                          
                          {newsletterMessage && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`mt-4 px-4 py-3 rounded-lg ${
                                newsletterMessage.type === 'success'
                                  ? 'bg-green-50 border border-green-200 text-green-700'
                                  : 'bg-red-50 border border-red-200 text-red-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {newsletterMessage.type === 'success' ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                                <span className="text-sm font-medium">{newsletterMessage.text}</span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Spotlight Banner Section */}
            <SpotlightBanner />

            {/* Savings Tips / Articles Section */}
            {latestNews.filter(article => article && article.id).length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Savings Tips</h2>
                  <Link 
                    href="/blogs" 
                    className="hidden sm:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm group"
                  >
                    View All
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  {latestNews.filter(a => a && a.id).slice(0, 8).map((article, index) => {
                    
                    const formatArticleDate = (date: any) => {
                      if (!date) return null;
                      try {
                        if (typeof date === 'string') {
                          return date;
                        }
                        const dateObj = date.toDate ? date.toDate() : new Date(date);
                        return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                      } catch {
                        return null;
                      }
                    };
                    
                    return (
                      <motion.article
                        key={`savings-tips-article-${article.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="flex gap-4 p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors group"
                      >
                        <Link href={`/blogs/${article.id}`} className="flex gap-4 w-full">
                          {/* Circular Thumbnail */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                            {article.imageUrl ? (
                              article.imageUrl.includes('res.cloudinary.com') || article.imageUrl.includes('storage.googleapis.com') ? (
                                <Image
                                  src={article.imageUrl}
                                  alt={article.title || 'Article'}
                                  width={96}
                                  height={96}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <img
                                  src={article.imageUrl}
                                  alt={article.title || 'Article'}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <span className="text-gray-400 text-xs font-semibold">
                                  {(article.title || 'A').charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {article.title || 'Article'}
                            </h3>
                            
                            {/* Author and Date */}
                            <div className="flex items-center gap-2 mb-2 text-sm">
                              <span className="text-blue-600 hover:text-blue-700 cursor-pointer">
                                MimeCode Staff
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-blue-600 hover:text-blue-700 cursor-pointer">
                                {formatArticleDate(article.date || article.createdAt) || 'Recently'}
                              </span>
                            </div>
                            
                            {/* Description */}
                            <p className="text-sm text-gray-700 mb-2 line-clamp-2 leading-relaxed">
                              {article.description || article.content?.substring(0, 120) || ''}
                            </p>
                            
                            {/* Categories */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-blue-600 hover:text-blue-700 text-xs cursor-pointer">
                                Guides
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.article>
                    );
                  })}
                </div>
                
                <div className="mt-6 text-center sm:hidden">
                  <Link 
                    href="/blogs" 
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View All Articles
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </section>
            )}
          </div>
      </div>



      <Footer />

      <ContactSupportModal 
        isOpen={isContactModalOpen} 
        onClose={handleCloseModal} 
      />

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
