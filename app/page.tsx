'use client';

import Link from "next/link";
import Navbar from "./components/Navbar";
import ContactSupportModal from "./components/ContactSupportModal";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { getBannersWithLayout, Banner } from '@/lib/services/bannerService';
import { getCoupons, Coupon } from '@/lib/services/couponService';
import { getNews, NewsArticle } from '@/lib/services/newsService';
import { getStores, Store } from '@/lib/services/storeService';
import { getLatestCoupons } from '@/lib/services/couponService';
import { getCategories, Category } from '@/lib/services/categoryService';
import { getActiveFAQs, FAQ } from '@/lib/services/faqService';
import { addToFavorites, removeFromFavorites, isFavorite } from '@/lib/services/favoritesService';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load heavy components
const CouponPopup = dynamic(() => import('./components/CouponPopup'), {
  ssr: false,
  loading: () => null
});

const RegionSpecificOffers = dynamic(() => import('./components/RegionSpecificOffers'), {
  ssr: false,
  loading: () => null
});

const SpotlightBanner = dynamic(() => import('./components/SpotlightBanner'), {
  ssr: false,
  loading: () => null
});

// Lazy load Footer (not critical for initial render)
const Footer = dynamic(() => import('./components/Footer'), {
  ssr: true
});

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
  const [bannersLoading, setBannersLoading] = useState(true); // Separate state for banners
  const [couponsLoading, setCouponsLoading] = useState(true); // Separate state for coupons
  const [featuredDealsLoading, setFeaturedDealsLoading] = useState(true); // Separate state for featured deals
  const [revealedCoupons, setRevealedCoupons] = useState<Set<string>>(new Set());
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLatestCouponsPaused, setIsLatestCouponsPaused] = useState(false);
  const [isFeaturedDealsPaused, setIsFeaturedDealsPaused] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const featuredDealsSliderRef = useRef<HTMLDivElement>(null);
  const storesOfSeasonSliderRef = useRef<HTMLDivElement>(null);
  const [isStoresOfSeasonPaused, setIsStoresOfSeasonPaused] = useState(false);

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

  // CRITICAL: Handle popup from query parameters (for code type coupons opened in new tab)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const popup = urlParams.get('popup');
    const couponId = urlParams.get('id');
    const code = urlParams.get('code');
    const storeName = urlParams.get('store');

    // If popup query param exists and it's for a coupon
    if (popup === 'coupon' && couponId && code) {
      // Create a temporary coupon object for the popup
      const tempCoupon: Coupon = {
        id: couponId,
        code: decodeURIComponent(code),
        storeName: decodeURIComponent(storeName || ''),
        title: `Use code: ${decodeURIComponent(code)}`,
        description: 'Code copied to clipboard!',
        couponType: 'code',
        discount: 0,
        discountType: 'percentage',
        url: '',
        logoUrl: '',
        isActive: true,
        maxUses: 1,
        currentUses: 0,
        expiryDate: null,
        dealScope: 'sitewide',
      };

      // Show popup with temporary coupon data
      setSelectedCoupon(tempCoupon);
      setShowPopup(true);
      setRevealedCoupons(prev => new Set(prev).add(couponId));

      // Try to fetch full coupon details in background
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/coupons/${couponId}`);
          if (response.ok) {
            const fullCoupon = await response.json();
            setSelectedCoupon(fullCoupon);
          }
        } catch (error) {
          // Silently fail, keep temporary coupon
        }
      }, 100);

      // Clean up URL (remove query params) after a brief delay
      setTimeout(() => {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }, 500);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: Fetch banners FIRST and IMMEDIATELY (don't wait for other data)
    const fetchBanners = async () => {
      try {
        // Very short timeout (1.5 seconds) - if banners don't load fast, show placeholder
        const bannersData = await Promise.race([
          getBannersWithLayout(),
          new Promise<Banner[]>((resolve) =>
            setTimeout(() => resolve([]), 1500)
          )
        ]);

        const bannersList = (bannersData || []).filter(Boolean) as Banner[];
        const firstFourBanners = bannersList.slice(0, 4);
        setBanners(firstFourBanners);
        setBannersLoading(false);

        // CRITICAL: Preload first banner image SYNCHRONOUSLY (no requestIdleCallback delay)
        if (firstFourBanners.length > 0 && firstFourBanners[0].imageUrl) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = firstFourBanners[0].imageUrl;
          link.setAttribute('fetchpriority', 'high');
          document.head.appendChild(link);
        }
      } catch (error) {
        setBannersLoading(false);
      }
    };

    // CRITICAL: Fetch coupons IMMEDIATELY and separately (like banners)
    const fetchCoupons = async () => {
      try {
        // Increased timeout to 3 seconds - give API more time to respond
        const couponsData = await Promise.race([
          getCoupons(),
          new Promise<Coupon[]>((resolve) =>
            setTimeout(() => resolve([]), 3000)
          )
        ]);

        // Set coupons immediately when they arrive
        setAllCoupons(couponsData);
        setLatestCoupons(couponsData.slice(0, 6));

        // Show basic coupons immediately (even without stores) - don't wait for filtering
        const codeCouponsOnly = couponsData.filter(coupon => coupon && coupon.couponType === 'code');

        // ALWAYS set latestCouponsWithLayout, even if empty
        if (codeCouponsOnly.length > 0) {
          // Set first 8 code coupons immediately (will be enhanced when stores load)
          const initialCoupons = codeCouponsOnly.slice(0, 8).map(c => c || null);
          // Pad to 8 items
          const paddedCoupons: (Coupon | null)[] = [...initialCoupons];
          while (paddedCoupons.length < 8) {
            paddedCoupons.push(null);
          }
          setLatestCouponsWithLayout(paddedCoupons.slice(0, 8));
          setCouponsLoading(false); // Stop loading immediately!

          // CRITICAL: Preload coupon logo images IMMEDIATELY (synchronously for first 4)
          // Don't wait for filtering - preload what we have
          const firstFourCoupons = initialCoupons.slice(0, 4).filter(c => c !== null) as Coupon[];
          firstFourCoupons.forEach((coupon) => {
            if (coupon.logoUrl && (coupon.logoUrl.includes('res.cloudinary.com') || coupon.logoUrl.includes('storage.googleapis.com'))) {
              const link = document.createElement('link');
              link.rel = 'preload';
              link.as = 'image';
              link.href = coupon.logoUrl;
              link.setAttribute('fetchpriority', 'high');
              document.head.appendChild(link);
            }
          });
        } else {
          // No code coupons found - set empty array and stop loading
          setLatestCouponsWithLayout(Array(8).fill(null));
          setCouponsLoading(false);
        }

        // CRITICAL: Stop featured deals loading immediately when coupons are loaded
        // Featured deals can work with coupons alone (stores are optional for deduplication)
        setFeaturedDealsLoading(false);

        // CRITICAL: Preload featured deals logo images immediately (first 6 deal coupons)
        setTimeout(() => {
          const dealCoupons = couponsData.filter(c => c && c.couponType === 'deal' && c.url);
          dealCoupons.slice(0, 6).forEach((coupon) => {
            if (coupon.logoUrl && (coupon.logoUrl.includes('res.cloudinary.com') || coupon.logoUrl.includes('storage.googleapis.com'))) {
              const link = document.createElement('link');
              link.rel = 'preload';
              link.as = 'image';
              link.href = coupon.logoUrl;
              link.setAttribute('fetchpriority', 'high');
              document.head.appendChild(link);
            }
          });
        }, 0);
      } catch (error) {
        // On error, set empty state and stop loading
        console.error('Error fetching coupons:', error);
        setAllCoupons([]);
        setLatestCoupons([]);
        setLatestCouponsWithLayout(Array(8).fill(null));
        setCouponsLoading(false);
        setFeaturedDealsLoading(false);
      }
    };

    // Start fetching banners and coupons immediately (in parallel)
    fetchBanners();
    fetchCoupons();

    // Fetch other data in parallel (non-blocking)
    const fetchOtherData = async () => {
      try {
        const [
          newsData,
          categoriesData,
          allStoresData,
          faqsData
        ] = await Promise.all([
          getNews(),
          getCategories(),
          getStores(),
          getActiveFAQs()
        ]);

        // Set stores (needed for filtering coupons)
        setAllStores(allStoresData);

        // Process coupons with stores (if coupons already loaded) - NON-BLOCKING
        if (allCoupons.length > 0) {
          const codeCouponsOnly = allCoupons.filter(coupon => coupon.couponType === 'code');

          // Use requestIdleCallback for heavy filtering (non-blocking)
          const processFiltering = () => {
            const filteredLatestCoupons = filterCouponsWithFavicons(codeCouponsOnly, allStoresData);
            setLatestCouponsWithLayout(filteredLatestCoupons);
          };

          // Use requestIdleCallback with setTimeout fallback for better browser support
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            requestIdleCallback(processFiltering, { timeout: 1000 });
          } else {
            // Fallback: use setTimeout with multiple chunks to avoid blocking
            setTimeout(processFiltering, 0);
          }
        }

        // Set other data immediately
        setLatestNews(newsData.slice(0, 4));
        setCategories(categoriesData.slice(0, 6));
        setFaqs(faqsData);
      } catch (error) {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
    };

    fetchOtherData();

    // Safety timeouts
    const bannerTimeoutId = setTimeout(() => {
      setBannersLoading(false);
    }, 2000);

    const couponTimeoutId = setTimeout(() => {
      // Safety timeout - if coupons haven't loaded after 4 seconds, stop loading
      setCouponsLoading(false);
      // Ensure we have some state set even if empty
      if (latestCouponsWithLayout.every(c => c === null)) {
        setLatestCouponsWithLayout(Array(8).fill(null));
      }
    }, 4000);

    // Featured deals loading is stopped immediately when coupons load
    // No timeout needed (already handled in fetchCoupons)

    return () => {
      clearTimeout(bannerTimeoutId);
      clearTimeout(couponTimeoutId);
    };
  }, []);

  const handleCloseModal = () => {
    setIsContactModalOpen(false);
  };

  // Memoized store map for O(1) lookups - defined before filterCouponsWithFavicons
  const storeMap = useMemo(() => {
    const map = new Map<string, Store>();
    if (!allStores || allStores.length === 0) return map;

    allStores.forEach(store => {
      if (store.id) {
        map.set(String(store.id).toLowerCase(), store);
      }
      if (store.name) {
        const normalizedName = store.name.trim().toLowerCase();
        if (!map.has(normalizedName)) {
          map.set(normalizedName, store);
        }
      }
    });

    return map;
  }, [allStores]);

  // Helper function to filter coupons that have extractable favicons and ensure unique stores
  // OPTIMIZED: Uses storeMap for O(1) lookups instead of O(n) array searches
  const filterCouponsWithFavicons = useCallback((coupons: (Coupon | null)[], stores: Store[]): (Coupon | null)[] => {
    const extractDomain = (url: string | null | undefined): string | null => {
      if (!url) return null;
      let cleanUrl = url.trim();
      cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
      cleanUrl = cleanUrl.replace(/^www\./, '');
      cleanUrl = cleanUrl.split('/')[0];
      cleanUrl = cleanUrl.replace(/\.+$/, '');
      return cleanUrl || null;
    };

    // Use storeMap for O(1) lookups if available, otherwise fallback to array search
    const getStoreForCoupon = (coupon: Coupon): Store | null => {
      // Try storeMap first (O(1) lookup)
      if (storeMap && storeMap.size > 0) {
        // Try by storeIds first
        if (coupon.storeIds && coupon.storeIds.length > 0) {
          for (const storeId of coupon.storeIds) {
            const match = storeMap.get(String(storeId).toLowerCase());
            if (match) return match;
          }
        }

        // Try by store name
        if (coupon.storeName) {
          const couponStoreName = coupon.storeName.trim().toLowerCase();
          const match = storeMap.get(couponStoreName);
          if (match) return match;
        }
      }

      // Fallback to array search (O(n)) if storeMap not available
      if (stores.length > 0) {
        // Try to find store by storeIds first
        if (coupon.storeIds && coupon.storeIds.length > 0) {
          const firstStoreId = coupon.storeIds[0];
          const store = stores.find(s => {
            return s.id === firstStoreId ||
              (typeof s.id === 'string' && firstStoreId && s.id.includes(firstStoreId)) ||
              (typeof firstStoreId === 'string' && s.id && firstStoreId.includes(s.id));
          });
          if (store) return store;
        }

        // Try to find store by name
        if (coupon.storeName) {
          const store = stores.find(s => {
            const storeName = s.name?.trim().toLowerCase();
            const couponStoreName = coupon.storeName?.trim().toLowerCase();
            return storeName === couponStoreName ||
              storeName?.includes(couponStoreName || '') ||
              couponStoreName?.includes(storeName || '');
          });
          if (store) return store;
        }
      }

      return null;
    };

    const hasExtractableFavicon = (coupon: Coupon): boolean => {
      // OPTIMIZED: Fast checks first (no store lookup needed)
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

      // Only check store URL if stores are available (avoid expensive lookup if not needed)
      if (stores.length > 0 || (storeMap && storeMap.size > 0)) {
        const store = getStoreForCoupon(coupon);
        if (store) {
          const storeUrl = store.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'];
          if (storeUrl) {
            const domain = extractDomain(storeUrl);
            if (domain) return true;
          }
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
  }, [storeMap]);

  // Separate effect to process coupons when both coupons and stores are ready
  // OPTIMIZED: Non-blocking processing using requestIdleCallback
  useEffect(() => {
    if (allCoupons.length > 0 && allStores.length > 0) {
      // Process latest coupons (code type) - NON-BLOCKING
      const codeCouponsOnly = allCoupons.filter(coupon => coupon.couponType === 'code');

      // Use requestIdleCallback for heavy filtering (non-blocking)
      const processFiltering = () => {
        const filteredLatestCoupons = filterCouponsWithFavicons(codeCouponsOnly, allStores);
        setLatestCouponsWithLayout(filteredLatestCoupons);
      };

      // Use requestIdleCallback with setTimeout fallback for better browser support
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(processFiltering, { timeout: 1000 });
      } else {
        // Fallback: use setTimeout with multiple chunks to avoid blocking
        setTimeout(processFiltering, 0);
      }

      // Featured deals are already shown (loading stopped when coupons loaded)
      // This effect just ensures deduplication is better when stores are available
      // No need to stop loading again or preload (already done)
    }
  }, [allCoupons, allStores, filterCouponsWithFavicons]);

  // Memoized date formatter to avoid recreating on every render
  const formatDate = useCallback((timestamp: any) => {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  }, []);

  // Memoized article date formatter
  const formatArticleDate = useCallback((date: any) => {
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
  }, []);

  const getCodePreview = useCallback((coupon: Coupon): string => {
    // Use custom button text if provided
    if (coupon.buttonText && coupon.buttonText.trim() !== '') {
      return coupon.buttonText;
    }
    // Default to type-based text
    if ((coupon.couponType || 'deal') === 'code' && coupon.code) {
      return 'Get Code';
    }
    return 'Get Deal';
  }, []);

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


  // Optimized helper to get store for a coupon - O(1) lookup instead of O(n)
  const getStoreForCoupon = useCallback((coupon: Coupon): Store | null => {
    if (!storeMap || storeMap.size === 0) return null;

    // Priority 1: Match by storeIds (exact match)
    if (coupon.storeIds && coupon.storeIds.length > 0) {
      for (const storeId of coupon.storeIds) {
        const match = storeMap.get(String(storeId).toLowerCase());
        if (match) return match;
      }
    }

    // Priority 2: Match by store name (exact match)
    if (coupon.storeName) {
      const couponStoreName = coupon.storeName.trim().toLowerCase();
      const match = storeMap.get(couponStoreName);
      if (match) return match;
    }

    return null;
  }, [storeMap]);

  // Helper to extract domain for favicon - memoized
  const extractDomainForLogo = useCallback((url: string | null | undefined): string | null => {
    if (!url) return null;
    let cleanUrl = url.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].replace(/\.+$/, '');
    return cleanUrl || null;
  }, []);

  // Optimized handleGetDeal - ULTRA LIGHTWEIGHT for best INP
  // CRITICAL: Minimize synchronous work to reduce INP to < 200ms
  const handleGetDeal = useCallback((coupon: Coupon, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // CRITICAL: Get raw URL immediately (no processing)
    const rawUrl = coupon.url || coupon.affiliateLink || null;

    // CRITICAL: Different behavior for CODE vs DEAL
    if (coupon.couponType === 'code' && coupon.code) {
      // FOR CODE TYPE: Open popup in NEW tab, redirect current tab to coupon link

      // Copy code to clipboard
      const codeToCopy = coupon.code.trim();
      navigator.clipboard.writeText(codeToCopy).catch(() => { });

      // Normalize URL
      const normalizedUrl = normalizeUrl(rawUrl);

      if (normalizedUrl) {
        // Open popup in NEW tab (with site URL + coupon info in query params)
        const siteUrl = window.location.origin;
        const popupUrl = `${siteUrl}/?popup=coupon&id=${encodeURIComponent(coupon.id || '')}&code=${encodeURIComponent(coupon.code || '')}&store=${encodeURIComponent(coupon.storeName || '')}`;
        window.open(popupUrl, '_blank', 'noopener,noreferrer');

        // Redirect current tab to coupon link after brief delay (to ensure popup opens first)
        setTimeout(() => {
          window.location.href = normalizedUrl;
        }, 200);
      }

      // Track in background (non-blocking)
      setTimeout(() => {
        const store = getStoreForCoupon(coupon);
        fetch('/api/track/coupon-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            couponId: coupon.id,
            couponCode: coupon.code || null,
            couponType: 'code',
            storeName: store?.name || coupon.storeName || null,
            storeId: store?.id || coupon.storeIds?.[0] || null,
            pageUrl: window.location.href,
            referrer: document.referrer || null,
          }),
        }).catch(() => { });
      }, 1000);

      return; // Exit early for code type
    }

    // FOR DEAL TYPE: Keep existing behavior (popup on same page + link in new tab)
    // CRITICAL: Batch all state updates in single requestAnimationFrame
    requestAnimationFrame(() => {
      // Batch state updates to minimize re-renders
      if (coupon.id) {
        setRevealedCoupons(prev => new Set(prev).add(coupon.id!));
      }
      setSelectedCoupon(coupon);
      setShowPopup(true);

      // Defer clipboard and URL opening to microtask (non-blocking)
      Promise.resolve().then(() => {
        // Open link immediately after state update
        if (rawUrl) {
          const urlToOpen = normalizeUrl(rawUrl);
          if (urlToOpen) {
            window.open(urlToOpen, '_blank', 'noopener,noreferrer');
          }
        }
      });
    });

    // Defer ONLY heavy processing (store lookup, logo processing, tracking) - non-blocking
    const processCallback = () => {
      // Chunk 1: Store lookup (deferred)
      setTimeout(() => {
        const store = getStoreForCoupon(coupon);

        // Chunk 2: Enhanced URL processing (if store has better URL)
        setTimeout(() => {
          let enhancedUrl: string | null = null;
          const storeTrackingUrl = store?.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'] || null;

          if (storeTrackingUrl) {
            enhancedUrl = normalizeUrl(storeTrackingUrl);
            // Link already opened in microtask, but we can update coupon data for future reference
          }

          // Chunk 3: Logo processing (deferred even further)
          setTimeout(() => {
            let correctLogoUrl: string | null = null;

            if (storeTrackingUrl) {
              const domain = extractDomainForLogo(storeTrackingUrl);
              if (domain) {
                correctLogoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
              }
            }

            if (!correctLogoUrl && store?.logoUrl) {
              if (store.logoUrl.startsWith('http://') || store.logoUrl.startsWith('https://') || store.logoUrl.includes('cloudinary.com')) {
                correctLogoUrl = store.logoUrl;
              }
            }

            if (!correctLogoUrl && coupon.logoUrl) {
              if (coupon.logoUrl.startsWith('http://') || coupon.logoUrl.startsWith('https://') || coupon.logoUrl.includes('cloudinary.com')) {
                correctLogoUrl = coupon.logoUrl;
              }
            }

            if (!correctLogoUrl && coupon.url) {
              const domain = extractDomainForLogo(coupon.url);
              if (domain) {
                correctLogoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
              }
            }

            // Update coupon with enhanced data (if different) - deferred
            if (correctLogoUrl !== coupon.logoUrl || store?.name !== coupon.storeName || enhancedUrl !== coupon.url) {
              const enhancedCoupon: Coupon = {
                ...coupon,
                logoUrl: correctLogoUrl || coupon.logoUrl,
                storeName: store?.name || coupon.storeName,
                url: enhancedUrl || coupon.url,
              };
              setSelectedCoupon(enhancedCoupon);
            }
          }, 0);
        }, 0);
      }, 0);

      // Defer tracking to idle time (lowest priority)
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          const store = getStoreForCoupon(coupon);
          let urlToOpen: string | null = null;
          const storeTrackingUrl = store?.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'] || null;
          if (storeTrackingUrl) {
            urlToOpen = storeTrackingUrl;
          } else {
            urlToOpen = coupon.url || coupon.affiliateLink || null;
          }
          urlToOpen = normalizeUrl(urlToOpen);

          fetch('/api/track/coupon-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              couponId: coupon.id,
              couponCode: coupon.code || null,
              couponType: coupon.couponType || 'deal',
              storeName: store?.name || coupon.storeName || null,
              storeId: store?.id || coupon.storeIds?.[0] || null,
              pageUrl: window.location.href,
              referrer: document.referrer || null,
            }),
          }).catch(() => { });
        }, { timeout: 3000 });
      } else {
        setTimeout(() => {
          const store = getStoreForCoupon(coupon);
          let urlToOpen: string | null = null;
          const storeTrackingUrl = store?.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'] || null;
          if (storeTrackingUrl) {
            urlToOpen = storeTrackingUrl;
          } else {
            urlToOpen = coupon.url || coupon.affiliateLink || null;
          }
          urlToOpen = normalizeUrl(urlToOpen);

          fetch('/api/track/coupon-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              couponId: coupon.id,
              couponCode: coupon.code || null,
              couponType: coupon.couponType || 'deal',
              storeName: store?.name || coupon.storeName || null,
              storeId: store?.id || coupon.storeIds?.[0] || null,
              pageUrl: window.location.href,
              referrer: document.referrer || null,
            }),
          }).catch(() => { });
        }, 2000);
      }
    };

    // Use requestIdleCallback with very aggressive timeout for better INP, fallback to setTimeout(0)
    // Lower timeout = faster response to user interaction
    // Use requestAnimationFrame first for immediate visual update, then defer heavy work
    if ('requestIdleCallback' in window) {
      requestIdleCallback(processCallback, { timeout: 5 });
    } else {
      // Use setTimeout with minimal delay for better INP
      setTimeout(processCallback, 0);
    }
  }, [getStoreForCoupon, extractDomainForLogo]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent, coupon: Coupon) => {
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
  }, []);

  // Memoized mouse handlers for sliders
  const handleLatestCouponsMouseEnter = useCallback(() => setIsLatestCouponsPaused(true), []);
  const handleLatestCouponsMouseLeave = useCallback(() => setIsLatestCouponsPaused(false), []);
  const handleFeaturedDealsMouseEnter = useCallback(() => setIsFeaturedDealsPaused(true), []);
  const handleFeaturedDealsMouseLeave = useCallback(() => setIsFeaturedDealsPaused(false), []);
  const handleStoresOfSeasonMouseEnter = useCallback(() => setIsStoresOfSeasonPaused(true), []);
  const handleStoresOfSeasonMouseLeave = useCallback(() => setIsStoresOfSeasonPaused(false), []);

  // Memoize stores with logos to avoid re-filtering on every render
  const storesWithLogos = useMemo(() => {
    return allStores.filter(store => store && store.logoUrl);
  }, [allStores]);

  // Memoize filtered stores by category
  const filteredStoresByCategory = useMemo(() => {
    if (!selectedCategoryId) return storesWithLogos;
    return storesWithLogos.filter(store => store.categoryId === selectedCategoryId);
  }, [storesWithLogos, selectedCategoryId]);

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

  const displayLatestCoupons = useMemo(() => {
    // Helper to get a numeric timestamp from various createdAt formats
    const getCreatedAtTime = (coupon: Coupon): number => {
      const createdAt: any = (coupon as any).createdAt;
      if (!createdAt) return 0;

      if (typeof createdAt === 'number') return createdAt;
      if (createdAt instanceof Date) return createdAt.getTime();

      if (createdAt && typeof createdAt.toDate === 'function') {
        try {
          return createdAt.toDate().getTime();
        } catch {
          return 0;
        }
      }

      if (typeof createdAt === 'string') {
        const parsed = new Date(createdAt).getTime();
        return isNaN(parsed) ? 0 : parsed;
      }

      return 0;
    };

    // Normalize store name for comparison
    const normalizeStoreName = (name: string | null | undefined): string | null => {
      if (!name) return null;
      return name.trim().toLowerCase().replace(/\s+/g, ' ');
    };

    // 1) Filter: only active, code-type coupons that have a URL
    const codeCouponsWithUrl = allCoupons.filter(c =>
      c &&
      c.id &&
      (c.couponType === 'code' || !c.couponType) &&
      c.url &&
      c.isActive !== false
    ) as Coupon[];

    // 2) Sort by createdAt descending (newest first)
    const sortedByCreatedAt = [...codeCouponsWithUrl].sort((a, b) => {
      const timeA = getCreatedAtTime(a);
      const timeB = getCreatedAtTime(b);
      return timeB - timeA;
    });

    const result: Coupon[] = [];
    const usedStoreIdentifiers = new Set<string>();
    const usedDomains = new Set<string>();

    // 3) Walk sorted list and pick at most one coupon per store (up to 10)
    for (const coupon of sortedByCreatedAt) {
      if (result.length >= 10) break;

      // Try to resolve store via helper (uses storeMap/allStores)
      const store = getStoreForCoupon(coupon);

      // If store is not found in allStores, or has no valid name, skip this coupon
      // This ensures we only show coupons for stores that actually exist in our stores list
      if (!store || !store.name || !normalizeStoreName(store.name)) {
        continue;
      }

      let identifier: string | null = null;

      if (store?.id) {
        identifier = `id:${String(store.id).toLowerCase()}`;
      } else if ((store as any)?.storeId) {
        identifier = `storeId:${String((store as any).storeId).toLowerCase()}`;
      } else if (store?.name) {
        const normalized = normalizeStoreName(store.name);
        if (normalized) identifier = `name:${normalized}`;
      } else if (coupon.storeIds && coupon.storeIds.length > 0) {
        identifier = `coupon-store-id:${String(coupon.storeIds[0]).toLowerCase()}`;
      } else if (coupon.storeName) {
        const normalized = normalizeStoreName(coupon.storeName);
        if (normalized) identifier = `coupon-store-name:${normalized}`;
      }

      // If we still can't identify the store, fall back to coupon ID to avoid total loss
      if (!identifier && coupon.id) {
        identifier = `coupon-id:${coupon.id}`;
      }

      if (identifier && usedStoreIdentifiers.has(identifier)) {
        continue; // already have a coupon for this store
      }

      // Also enforce unique affiliate / tracking domain
      // Prefer store's websiteUrl (which often contains tracking URL), then coupon.url
      const candidateUrl =
        (store as any)?.websiteUrl ||
        (store as any)?.['Tracking Url'] ||
        (store as any)?.['Store Display Url'] ||
        coupon.url ||
        null;

      const domain = extractDomainForLogo(candidateUrl);
      if (domain && usedDomains.has(domain)) {
        continue; // already have a coupon for this affiliate/tracking domain
      }

      if (identifier) {
        usedStoreIdentifiers.add(identifier);
      }
      if (domain) {
        usedDomains.add(domain);
      }

      result.push(coupon);
    }

    return result;
  }, [allCoupons, allStores, getStoreForCoupon, extractDomainForLogo]);

  // CRITICAL: Pre-compute all latest coupons data (store, logo, expiry) to avoid blocking render
  // This prevents INP issues when clicking on coupons and ensures correct logos
  // Similar to featuredDealsDataMap - ensures each store shows its own correct logo
  const couponDataMap = useMemo(() => {
    const map = new Map<string, {
      store: Store | null;
      storeUrl: string | null;
      storeName: string;
      logoUrl: string | null;
      expiryDate: Date | null;
      isExpired: boolean;
    }>();

    displayLatestCoupons.forEach((coupon) => {
      if (!coupon || !coupon.id) return;

      // Get store (use memoized function)
      const store = getStoreForCoupon(coupon);
      const storeUrl = store?.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'] || null;
      const storeName = store?.name || coupon.storeName || '';

      // DEBUG: Log store and URL info
      if (process.env.NODE_ENV === 'development') {
        console.log('Coupon:', coupon.storeName, {
          storeFound: !!store,
          storeName: store?.name,
          storeUrl,
          couponUrl: coupon.url,
          couponLogoUrl: coupon.logoUrl
        });
      }

      // Get logo URL - PRIORITY: Store URL favicon > Store logo > Coupon URL favicon > Coupon logo
      // CRITICAL: Always try to fetch favicon from store URL first (most reliable)
      let logoUrl: string | null = null;

      // Priority 1: Favicon from store URL (MOST RELIABLE - always try first)
      if (storeUrl) {
        const domain = extractDomainForLogo(storeUrl);
        if (domain) {
          logoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
          if (process.env.NODE_ENV === 'development') {
            console.log('  -> Using store URL favicon:', domain, logoUrl);
          }
        }
      }

      // Priority 2: Favicon from coupon URL (if store URL not available)
      if (!logoUrl && coupon.url) {
        const domain = extractDomainForLogo(coupon.url);
        if (domain) {
          logoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
          if (process.env.NODE_ENV === 'development') {
            console.log('  -> Using coupon URL favicon:', domain, logoUrl);
          }
        }
      }

      // Priority 3: Store's actual logo URL (fallback)
      if (!logoUrl && store?.logoUrl && (store.logoUrl.startsWith('http://') || store.logoUrl.startsWith('https://') || store.logoUrl.includes('cloudinary.com'))) {
        logoUrl = store.logoUrl;
        if (process.env.NODE_ENV === 'development') {
          console.log('  -> Using store logo URL:', logoUrl);
        }
      }

      // Priority 4: Coupon's logo URL (last resort)
      if (!logoUrl && coupon.logoUrl && (coupon.logoUrl.startsWith('http://') || coupon.logoUrl.startsWith('https://') || coupon.logoUrl.includes('cloudinary.com'))) {
        logoUrl = coupon.logoUrl;
        if (process.env.NODE_ENV === 'development') {
          console.log('  -> Using coupon logo URL:', logoUrl);
        }
      }

      // Get expiry date
      let expiryDateObj: Date | null = null;
      if (coupon.expiryDate) {
        if (coupon.expiryDate instanceof Date) {
          expiryDateObj = coupon.expiryDate;
        } else if (typeof coupon.expiryDate.toDate === 'function') {
          expiryDateObj = coupon.expiryDate.toDate();
        } else if (typeof coupon.expiryDate === 'string') {
          const parsed = new Date(coupon.expiryDate);
          expiryDateObj = isNaN(parsed.getTime()) ? null : parsed;
        } else if (typeof coupon.expiryDate === 'number') {
          expiryDateObj = new Date(coupon.expiryDate);
        }
      }
      const isExpired = expiryDateObj ? expiryDateObj < new Date() : false;

      map.set(coupon.id, {
        store,
        storeUrl,
        storeName,
        logoUrl,
        expiryDate: expiryDateObj,
        isExpired,
      });
    });

    return map;
  }, [displayLatestCoupons, getStoreForCoupon, extractDomainForLogo]);

  // CRITICAL: Track stores used in Latest Coupons to avoid duplicates in Featured Deals
  const storesUsedInLatestCoupons = useMemo(() => {
    const usedStoreIds = new Set<string>();
    const usedStoreNames = new Set<string>();

    displayLatestCoupons.forEach((coupon) => {
      if (!coupon || !coupon.id) return;

      const couponData = couponDataMap.get(coupon.id);
      const store = couponData?.store;

      // Track by store ID
      if (store?.id) {
        usedStoreIds.add(`id:${String(store.id).toLowerCase()}`);
      }

      // Track by store name (normalized)
      if (store?.name) {
        usedStoreNames.add(store.name.trim().toLowerCase().replace(/\s+/g, ' '));
      } else if (coupon.storeName) {
        usedStoreNames.add(coupon.storeName.trim().toLowerCase().replace(/\s+/g, ' '));
      }
    });

    return { usedStoreIds, usedStoreNames };
  }, [displayLatestCoupons, couponDataMap]);

  // CRITICAL: Pre-compute all featured deals data (store, logo, etc.) to ensure correct logos
  // This ensures each store shows its own correct logo and prevents duplicates
  const featuredDealsDataMap = useMemo(() => {
    const map = new Map<string, {
      store: Store | null;
      storeUrl: string | null;
      storeName: string;
      logoUrl: string | null;
    }>();

    // Process all coupons that might be in featured deals
    allCoupons.forEach((coupon) => {
      if (!coupon || !coupon.id || coupon.couponType !== 'deal' || !coupon.url) return;

      // Get store (use memoized function)
      const store = getStoreForCoupon(coupon);
      const storeUrl = store?.websiteUrl || (store as any)?.['Tracking Url'] || (store as any)?.['Store Display Url'] || null;
      const storeName = store?.name || coupon.storeName || '';

      // Get logo URL - PRIORITY: Store URL favicon > Store logo > Coupon URL favicon > Coupon logo
      // CRITICAL: Always try to fetch favicon from store URL first (most reliable)
      let logoUrl: string | null = null;

      // Priority 1: Favicon from store URL (MOST RELIABLE - always try first)
      if (storeUrl) {
        const domain = extractDomainForLogo(storeUrl);
        if (domain) {
          logoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
        }
      }

      // Priority 2: Favicon from coupon URL (if store URL not available)
      if (!logoUrl && coupon.url) {
        const domain = extractDomainForLogo(coupon.url);
        if (domain) {
          logoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
        }
      }

      // Priority 3: Store's actual logo URL (fallback)
      if (!logoUrl && store?.logoUrl && (store.logoUrl.startsWith('http://') || store.logoUrl.startsWith('https://') || store.logoUrl.includes('cloudinary.com'))) {
        logoUrl = store.logoUrl;
      }

      // Priority 4: Coupon's logo URL (last resort)
      if (!logoUrl && coupon.logoUrl && (coupon.logoUrl.startsWith('http://') || coupon.logoUrl.startsWith('https://') || coupon.logoUrl.includes('cloudinary.com'))) {
        logoUrl = coupon.logoUrl;
      }

      map.set(coupon.id, {
        store,
        storeUrl,
        storeName,
        logoUrl,
      });
    });

    return map;
  }, [allCoupons, getStoreForCoupon, extractDomainForLogo]);

  // Get random deals for Featured Deals - ensure unique stores (NO DUPLICATES)
  // CRITICAL: Each store appears only once with its own correct logo
  // CRITICAL: Avoid stores that are already shown in Latest Coupons
  const displayLatestDeals = useMemo(() => {
    const result: (Coupon | Store | null)[] = [];
    const usedCouponIds = new Set<string>();

    // Get ALL featured candidate coupons from allCoupons:
    // - deal type coupons only
    const allFeaturedCoupons = allCoupons.filter(c =>
      c &&
      c.id &&
      c.couponType === 'deal' &&
      c.url && // must have valid URL
      c.isActive !== false
    ) as Coupon[];

    // Shuffle to randomize selection
    const shuffled = [...allFeaturedCoupons].sort(() => Math.random() - 0.5);

    // DEBUG: Log filtered featured deals source (without store/dup checks)
    if (process.env.NODE_ENV === 'development') {
      console.log('🟢 Featured deal candidates from allCoupons:', allFeaturedCoupons.map(c => ({
        id: c.id,
        code: c.code,
        couponType: c.couponType,
        storeName: c.storeName,
        storeIds: c.storeIds,
        url: c.url,
        isActive: c.isActive,
      })));
    }

    // Add deals:
    // - Allow multiple deals from the same store
    // - Still require store to exist in allStores with a valid name
    for (const coupon of shuffled) {
      if (result.length >= 10) break;

      const store = allStores.length > 0 ? getStoreForCoupon(coupon) : null;

      // Skip if store does not exist in allStores or has no valid name
      if (!store || !store.name) {
        continue;
      }

      if (coupon.id && !usedCouponIds.has(coupon.id)) {
        result.push(coupon);
        usedCouponIds.add(coupon.id);
      }
    }

    // Pad with nulls if still not 10 items
    while (result.length < 10) {
      result.push(null);
    }

    return result.slice(0, 10);
  }, [allCoupons, allStores, getStoreForCoupon]);

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
  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  // Memoize animation variants to prevent recreation on every render
  const slideVariants = useMemo(() => ({
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
  }), []);

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
      {/* Always reserve space to prevent layout shift */}
      <section className="relative w-full bg-white py-2 sm:py-4 md:py-6" style={{ minHeight: loading ? '180px' : 'auto' }}>
        {/* Container with padding and max-width */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Hero Slider with rounded corners - Compact */}
          <div className="relative h-[180px] sm:h-[220px] md:h-[260px] lg:h-[300px] w-full rounded-xl overflow-hidden">
            {bannersLoading ? (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl animate-pulse"></div>
            ) : banners.length > 0 ? (
              <>
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
                          <Image
                            src={banner.imageUrl}
                            alt={`Banner ${index + 1}`}
                            fill
                            className="object-contain rounded-xl"
                            priority={index === 0}
                            fetchPriority={index === 0 ? "high" : "auto"}
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 1152px, 1152px"
                            quality={index === 0 ? 80 : 75}
                            loading={index === 0 ? "eager" : "lazy"}
                            unoptimized={!banner.imageUrl.includes('res.cloudinary.com') && !banner.imageUrl.includes('storage.googleapis.com')}
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
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
                          className={`h-1.5 rounded-full transition-all duration-300 ${index === currentBannerIndex
                              ? 'bg-white w-8'
                              : 'bg-white/50 hover:bg-white/80 w-1.5'
                            }`}
                          aria-label={`Go to banner ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                <p className="text-gray-400 text-sm">No banners available</p>
              </div>
            )}
          </div>
        </div>
      </section>

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
      <section className="py-8 sm:py-12 md:py-16 !pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-2">
                Latest <Image src="/coupons_text.png" className="w-30" alt="Latest Coupons" width={100} height={100} />
              </h2>
              <Link
                href="/coupons"
                className="cursor-pointer bg-[#FFE019] text-black font-semibold rounded-3xl px-6 py-1.5 font-medium text-[10px] sm:text-base transition-colors"
              >
                View All
              </Link>
            </div>

            {/* Coupons Slider - Single Row Horizontal Scroll with Auto-scroll */}
            {couponsLoading ? (
              <div className="flex gap-4 md:gap-5 overflow-hidden">
                {[...Array(8)].map((_, index) => (
                  <div
                    key={`coupon-skeleton-${index}`}
                    className="bg-gray-100 rounded-lg p-4 sm:p-5 min-h-[250px] w-[200px] sm:w-[220px] flex-shrink-0 animate-pulse"
                  >
                    <div className="w-24 h-24 bg-gray-200 rounded-lg mb-4 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="overflow-hidden pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
                onMouseEnter={handleLatestCouponsMouseEnter}
                onMouseLeave={handleLatestCouponsMouseLeave}
              >
                <div
                  ref={sliderRef}
                  className="flex gap-4 md:gap-5"
                  style={{
                    width: 'fit-content',
                    animationName: 'scrollLeft',
                    animationDuration: '40s',
                    animationTimingFunction: 'linear',
                    animationIterationCount: 'infinite',
                    animationPlayState: isLatestCouponsPaused ? 'paused' : 'running',
                    willChange: 'transform'
                  }}
                >
                  {[...displayLatestCoupons, ...displayLatestCoupons, ...displayLatestCoupons].map((coupon, index) => {
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
                    // Use pre-computed data from memoized map (avoids blocking render)
                    const couponData = coupon.id ? couponDataMap.get(coupon.id) : null;
                    const store = couponData?.store || null;
                    const storeUrl = couponData?.storeUrl || null;
                    const storeName = couponData?.storeName || coupon.storeName || '';
                    const logoUrl = couponData?.logoUrl || null;
                    const isExpired = couponData?.isExpired || false;

                    return (
                      <motion.div
                        key={`latest-coupon-${coupon.id || 'no-id'}-${index}-${isDuplicate ? 'dup' : ''}`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: (index % displayLatestCoupons.length) * 0.05 }}
                        className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 flex flex-col relative overflow-hidden group cursor-pointer w-[200px] sm:w-[220px] flex-shrink-0"
                        onClick={(e) => {
                          // CRITICAL: Use requestAnimationFrame to avoid blocking INP
                          requestAnimationFrame(() => {
                            handleGetDeal(coupon, e);
                          });
                        }}
                      >
                        {/* Logo Section - Centered */}
                        <div className="flex items-center justify-center h-16 relative">
                          {logoUrl ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <img
                                src={logoUrl}
                                alt={coupon.storeName || coupon.code || 'Coupon'}
                                className="max-w-full max-h-full object-contain"
                                style={{
                                  width: 'auto',
                                  height: 'auto',
                                  maxWidth: '40px',
                                  maxHeight: '40px'
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
                              <span className="text-white font-bold text-lg">
                                {(coupon.storeName || coupon.code || 'C').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}

                          {/* Discount Badge - Bottom Right of Logo Area - Only show if real discount exists */}
                          {Number(coupon.discount) > 0 && (
                            <div className="absolute bottom-0 right-0 bg-gray-200 rounded-lg px-3 py-1.5">
                              <span className="text-gray-900 font-bold text-sm sm:text-base">
                                {coupon.discount}% OFF
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Brand Name */}
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 text-center uppercase line-clamp-2">
                          {storeName || coupon.storeName || 'Store'}
                        </h3>

                        {/* Actual Coupon Title/Description */}
                        <p className="text-xs sm:text-sm text-gray-600 mb-4 text-center line-clamp-2 leading-relaxed flex-grow">
                          {coupon.title || coupon.description || (Number(coupon.discount) > 0 ? `Save ${coupon.discount}% on your order` : 'Great savings available')}
                        </p>

                        {/* Get Code/Deal Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // CRITICAL: Use requestAnimationFrame to avoid blocking INP
                            requestAnimationFrame(() => {
                              handleGetDeal(coupon, e);
                            });
                          }}
                          className="cursor-pointer  w-full relative bg-[#000]  text-white font-semibold rounded-3xl px-4 py-2.5 flex items-center justify-between transition-all duration-300 shadow-sm hover:shadow-md group"
                        >
                          <span className="text-sm flex-1 relative z-10">
                            {coupon.id && revealedCoupons.has(coupon.id) && coupon.code ? (
                              coupon.code
                            ) : coupon.couponType === 'code' && coupon.code ? (
                              'Get Code'
                            ) : (
                              'Get Deal'
                            )}
                          </span>
                          {coupon.couponType === 'code' && coupon.code && !(coupon.id && revealedCoupons.has(coupon.id)) && (
                            <span className="absolute top-0 left-0 h-full w-full text-center text-[14px] flex items-center justify-center font-bold border-2 border-dashed border-black text-black rounded-3xl px-1.5 py-0.5 flex-shrink-0 group-hover:opacity-100 transition-opacity duration-300">
                              {/* ...{coupon.code.slice(-2)} */}
                              {coupon.code}
                            </span>
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="space-y-16">
          {/* Featured Deals Section - Modern Card Style */}
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-2">
                Featured <Image src="/deals_text.png" className="w-30" alt="Featured Deals" width={100} height={100} />
              </h2>
              <Link
                href="/coupons"
                className="cursor-pointer bg-[#FFE019] text-black font-semibold rounded-3xl px-6 py-1.5 font-medium text-sm sm:text-base transition-colors"
              >
                View All
              </Link>
            </div>

            {/* Coupons Slider - Featured Deals Style with Auto-scroll */}
            {featuredDealsLoading ? (
              <div className="flex gap-4 md:gap-5 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <div key={`featured-deal-loading-${i}`} className="bg-white rounded-lg p-4 sm:p-5 h-64 w-[200px] sm:w-[220px] flex-shrink-0 animate-pulse border border-gray-200 flex flex-col">
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
                onMouseEnter={handleFeaturedDealsMouseEnter}
                onMouseLeave={handleFeaturedDealsMouseLeave}
              >
                <div
                  ref={featuredDealsSliderRef}
                  className="flex gap-4 md:gap-5"
                  style={{
                    width: 'fit-content',
                    animationName: 'scrollLeft',
                    animationDuration: '40s',
                    animationTimingFunction: 'linear',
                    animationIterationCount: 'infinite',
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
                        id: `store-${store.id || 'unknown'}`,
                        title: storeName,
                        description: `Visit ${storeName} for great deals`,
                        storeName: storeName,
                        storeIds: store.id ? [store.id] : [],
                        url: storeUrl || '',
                        logoUrl: logoUrl || '',
                        discount: 25,
                        discountType: 'percentage',
                        couponType: 'deal',
                        dealScope: 'sitewide',
                        code: '',
                        isActive: true,
                        maxUses: 1000,
                        currentUses: 0,
                        expiryDate: null
                      };

                      return (
                        <motion.div
                          key={`featured-store-${store.id || store.name || 'unknown'}-copy-${Math.floor(index / displayLatestDeals.length)}-idx-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: (index % displayLatestDeals.length) * 0.05 }}
                          className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 flex flex-col relative overflow-hidden group cursor-pointer w-[200px] sm:w-[220px] flex-shrink-0"
                          onClick={(e) => {
                            // CRITICAL: Use requestAnimationFrame to avoid blocking INP
                            requestAnimationFrame(() => {
                              handleGetDeal(storeCoupon, e);
                            });
                          }}
                        >
                          {/* Logo Section - Centered */}
                          <div className="flex items-center justify-center h-16 relative">
                            {logoUrl ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <img
                                  src={logoUrl}
                                  alt={storeName}
                                  className="max-w-full max-h-full object-contain"
                                  style={{
                                    width: 'auto',
                                    height: 'auto',
                                    maxWidth: '40px',
                                    maxHeight: '40px'
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

                          </div>

                          {/* Brand Name */}
                          <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 text-center uppercase">
                            {storeName}
                          </h3>

                          {/* Store Description */}
                          <p className="text-xs sm:text-sm text-gray-600 mb-4 text-center line-clamp-2 leading-relaxed flex-grow">
                            {store.description || `Shop at ${storeName} for exclusive deals`}
                          </p>

                          {/* Get Deal Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetDeal(storeCoupon, e);
                            }}
                            className="w-full !bg-[#000] rounded-3xl text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
                          >
                            Get Deal
                          </button>
                        </motion.div>
                      );
                    }

                    // Featured Deal Card - Modern Style (for coupons)
                    if (!coupon) return null;

                    // Get pre-computed data for this coupon (store, logo, etc.)
                    const dealData = coupon.id ? featuredDealsDataMap.get(coupon.id) : null;
                    const dealStore = dealData?.store || null;
                    const storeName = dealData?.storeName || coupon.storeName || 'Store';
                    const logoUrl = dealData?.logoUrl || null;

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
                      <motion.div
                        key={`featured-deal-${coupon.id || 'no-id'}-copy-${Math.floor(index / displayLatestDeals.length)}-idx-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: (index % displayLatestDeals.length) * 0.05 }}
                        className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 flex flex-col relative overflow-hidden group cursor-pointer w-[200px] sm:w-[220px] flex-shrink-0"
                        onClick={(e) => {
                          // CRITICAL: Use requestAnimationFrame to avoid blocking INP
                          requestAnimationFrame(() => {
                            handleGetDeal(coupon, e);
                          });
                        }}
                      >
                        {/* Logo Section - Centered */}
                        <div className="flex items-center justify-center h-16 relative">
                          {logoUrl ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <img
                                src={logoUrl}
                                alt={storeName}
                                className="max-w-full max-h-full object-contain"
                                style={{
                                  width: 'auto',
                                  height: 'auto',
                                  maxWidth: '40px',
                                  maxHeight: '40px'
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

                          {/* Discount Badge - Bottom Right of Logo Area - Only show if real discount exists */}
                          {Number(coupon.discount) > 0 && (
                            <div className="absolute bottom-0 right-0 bg-gray-200 rounded-lg px-3 py-1.5">
                              <span className="text-gray-900 font-bold text-sm sm:text-base">
                                {coupon.discount}% OFF
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Store Name */}
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 text-center uppercase line-clamp-2">
                          {storeName}
                        </h3>

                        {/* Coupon/Deal Title and Description */}
                        <p className="text-xs sm:text-sm text-gray-600 mb-4 text-center line-clamp-2 leading-relaxed flex-grow">
                          {coupon.title || coupon.description || (Number(coupon.discount) > 0 ? `Save ${coupon.discount}% on your order` : 'Great savings available')}
                        </p>

                        {/* Get Code/Deal Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // CRITICAL: Use requestAnimationFrame to avoid blocking INP
                            requestAnimationFrame(() => {
                              handleGetDeal(coupon, e);
                            });
                          }}
                          className="w-full bg-[#000] cursor-pointer rounded-3xl text-white font-semibold px-4 py-2.5 flex items-center justify-between transition-all duration-300 shadow-sm hover:shadow-md group"
                        >
                          <span className="text-sm flex-1">
                            {coupon.id && revealedCoupons.has(coupon.id) && coupon.code ? (
                              coupon.code
                            ) : coupon.couponType === 'code' && coupon.code ? (
                              'Get Code'
                            ) : (
                              'Get Deal'
                            )}
                          </span>
                          {coupon.couponType === 'code' && coupon.code && !(coupon.id && revealedCoupons.has(coupon.id)) && (
                            <span className="text-xs font-bold border-2 border-dashed border-white/50 rounded px-1.5 py-0.5 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              ...{coupon.code.slice(-2)}
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
          {storesWithLogos.length > 0 && (
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

                {/* Horizontal Scrollable Store Logos - Auto Scroll */}
                <div
                  className="relative overflow-hidden mb-6 md:mb-8"
                  onMouseEnter={handleStoresOfSeasonMouseEnter}
                  onMouseLeave={handleStoresOfSeasonMouseLeave}
                >
                  <div
                    ref={storesOfSeasonSliderRef}
                    className="flex gap-4 md:gap-6 pb-4"
                    style={{
                      width: 'fit-content',
                      animationName: 'scrollLeft',
                      animationDuration: '1900s',
                      animationTimingFunction: 'linear',
                      animationIterationCount: 'infinite',
                      animationPlayState: isStoresOfSeasonPaused ? 'paused' : 'running',
                      willChange: 'transform'
                    }}
                  >
                    {/* Duplicate stores 3 times for seamless infinite scroll */}
                    {[...filteredStoresByCategory, ...filteredStoresByCategory, ...filteredStoresByCategory].map((store, index) => {
                      const copyNumber = Math.floor(index / filteredStoresByCategory.length);
                      const originalIndex = index % filteredStoresByCategory.length;

                      return (
                        <Link
                          key={`store-${store.id || originalIndex}-copy-${copyNumber}-idx-${index}`}
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
                      );
                    })}
                  </div>
                </div>

                {/* Category Tags */}
                {categories && categories.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                    <Link
                      href="/categories"
                      className="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 bg-gray-900 text-white hover:bg-gray-800"
                    >
                      Discover more
                    </Link>
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug || category.id}`}
                        className="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 bg-white text-blue-600 border border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        {category.name}
                      </Link>
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
                                className={`w-5 h-5 text-gray-900 flex-shrink-0 transition-transform duration-200 ${openFAQIndex === index ? 'rotate-180' : ''
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
                      className="bg-white overflow-hidden"
                    >
                      {/* Header Bar */}
                      <div className="py-3 px-4 text-center">
                        <h3 className="text-black font-bold sm:text-base flex items-center justify-center gap-2"><span className="text-[40px]">Daily</span> <Image src="/exclusion.png" className="w-30" alt="Featured Deals" width={100} height={100} /> <span className="text-[40px]">Deals</span></h3>
                      </div>

                      {/* Content Area */}
                      <div className="">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
                          Get Exclusive Coupons & <br /> Best Deals Delivered to Your Inbox
                        </h2>

                        <form
                          onSubmit={handleNewsletterSubmit}
                          className="flex flex-col sm:flex-row gap-3 mb-4 border-1 border-[#D0D0D0] rounded-full p-1"
                        >
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            className="flex-1 px-4 py-3 focus:outline-none focus:none text-black placeholder-gray-500"
                            disabled={newsletterLoading}
                            required
                          />
                          <button
                            type="submit"
                            disabled={newsletterLoading}
                            className="cursor-pointer bg-[#FFE019] text-black font-bold text-[14px] px-6 py-0 rounded-3xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {newsletterLoading ? 'Subscribing...' : 'Unlock Deals'}
                          </button>
                        </form>

                        {/* Disclaimer Text */}
                        <p className="text-[12px] text-black leading-relaxed">
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
                            className={`mt-4 px-4 py-3 rounded-lg ${newsletterMessage.type === 'success'
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
