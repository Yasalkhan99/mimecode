'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coupon } from '@/lib/services/couponService';
import { Store } from '@/lib/services/storeService';

interface CouponPopupProps {
  coupon: Coupon | null;
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  store?: Store | null;
}

export default function CouponPopup({ coupon, isOpen, onClose, onContinue, store }: CouponPopupProps) {
  const [copied, setCopied] = useState(false);
  const [storeData, setStoreData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fetch store data for favicon if coupon logo is not available and store prop is not provided
  useEffect(() => {
    if (coupon && coupon.storeName && isOpen && !store) {
      // Check if we already have a valid logo URL
      const hasValidLogo = coupon.logoUrl && (
        coupon.logoUrl.startsWith('http://') || 
        coupon.logoUrl.startsWith('https://') || 
        coupon.logoUrl.includes('cloudinary.com')
      );
      
      // Only fetch store if we don't have a valid logo and store prop is not available
      if (!hasValidLogo) {
        // Try to fetch store by name to get trackingLink/trackingUrl for favicon
        const fetchStore = async () => {
          try {
            const response = await fetch(`/api/stores/get?collection=stores-mimecode`);
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.stores) {
                const foundStore = data.stores.find((s: any) => 
                  s.name?.toLowerCase().trim() === coupon.storeName?.toLowerCase().trim()
                );
                if (foundStore) {
                  setStoreData(foundStore);
                }
              }
            }
          } catch (error) {
            // Silently fail
          }
        };
        fetchStore();
      }
    }
  }, [coupon, isOpen, store]);

  if (!isOpen || !coupon) return null;

  const handleCopyCode = () => {
    if (coupon.couponType === 'code' && coupon.code) {
      navigator.clipboard.writeText(coupon.code.trim()).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        // Fallback if clipboard API fails
        const textArea = document.createElement('textarea');
        textArea.value = coupon.code.trim();
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
  };

  // Helper function to extract domain from URL
  const extractDomain = (url: string | null | undefined): string | null => {
    if (!url) return null;
    
    let cleanUrl = url.trim();
    
    // Remove protocol if present
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
    
    // Remove www. if present
    cleanUrl = cleanUrl.replace(/^www\./, '');
    
    // Remove trailing slashes and paths
    cleanUrl = cleanUrl.split('/')[0];
    
    // Remove trailing dots
    cleanUrl = cleanUrl.replace(/\.+$/, '');
    
    return cleanUrl || null;
  };

  // Helper function to get favicon/logo from website URL
  const getLogoFromWebsite = (websiteUrl: string | null | undefined): string | null => {
    const domain = extractDomain(websiteUrl);
    if (!domain) return null;
    
    // Use Google's favicon service as fallback (reliable and fast)
    // Size 128 gives good quality logo
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  };

  // Get logo URL - prioritize store's extracted favicon (logoUrl) first
  const getCouponLogoUrl = (): string | null => {
    // Priority 1: Use store's extracted logoUrl (extracted favicon) - HIGHEST PRIORITY
    if (store?.logoUrl) {
      if (store.logoUrl.startsWith('http://') || store.logoUrl.startsWith('https://')) {
        return store.logoUrl;
      }
      if (store.logoUrl.includes('cloudinary.com')) {
        return store.logoUrl;
      }
    }
    
    // Priority 2: Use fetched storeData's logoUrl (extracted favicon)
    if (storeData?.logoUrl) {
      if (storeData.logoUrl.startsWith('http://') || storeData.logoUrl.startsWith('https://')) {
        return storeData.logoUrl;
      }
      if (storeData.logoUrl.includes('cloudinary.com')) {
        return storeData.logoUrl;
      }
    }
    
    // Priority 3: Generate favicon from store's trackingLink
    if (store?.trackingLink) {
      const favicon = getLogoFromWebsite(store.trackingLink);
      if (favicon) return favicon;
    }
    
    // Priority 4: Generate favicon from store's trackingUrl
    if (store?.trackingUrl) {
      const favicon = getLogoFromWebsite(store.trackingUrl);
      if (favicon) return favicon;
    }
    
    // Priority 5: Generate favicon from store's websiteUrl
    if (store?.websiteUrl) {
      const favicon = getLogoFromWebsite(store.websiteUrl);
      if (favicon) return favicon;
    }
    
    // Priority 6: Generate favicon from fetched storeData's trackingLink
    if (storeData?.trackingLink) {
      const favicon = getLogoFromWebsite(storeData.trackingLink);
      if (favicon) return favicon;
    }
    
    // Priority 7: Generate favicon from fetched storeData's trackingUrl
    if (storeData?.trackingUrl) {
      const favicon = getLogoFromWebsite(storeData.trackingUrl);
      if (favicon) return favicon;
    }
    
    // Priority 8: Generate favicon from fetched storeData's websiteUrl
    if (storeData?.websiteUrl) {
      const favicon = getLogoFromWebsite(storeData.websiteUrl);
      if (favicon) return favicon;
    }
    
    // Priority 9: Fallback to coupon logo URL
    if (coupon.logoUrl) {
      if (coupon.logoUrl.startsWith('http://') || coupon.logoUrl.startsWith('https://')) {
        return coupon.logoUrl;
      }
      if (coupon.logoUrl.includes('cloudinary.com')) {
        return coupon.logoUrl;
      }
    }
    
    // Priority 10: Fallback to coupon URL favicon
    if (coupon.url) {
      return getLogoFromWebsite(coupon.url);
    }
    
    return null;
  };

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  const popupVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.85,
      y: 30,
      rotateX: -10
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 300,
        mass: 0.8
      }
    },
    exit: {
      opacity: 0,
      scale: 0.85,
      y: 30,
      transition: {
        duration: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1 + 0.2,
        duration: 0.4,
        type: "spring" as const,
        stiffness: 200
      }
    })
  };


  return (
    <AnimatePresence>
      {isOpen && coupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Enhanced Backdrop with blur */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Main Popup Container */}
          <motion.div
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative max-w-md w-full"
            style={{ perspective: 1000 }}
          >
            {/* Glowing background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFE019] via-white to-[#FFE019] rounded-2xl blur-2xl opacity-40 -z-10" />
            
            {/* Popup Card - theme: black / white / #FFE019 */}
            <div className="relative bg-gradient-to-br from-black via-[#050505] to-black rounded-2xl shadow-2xl overflow-hidden border border-[#FFE019]/60">
              {/* Decorative top border */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FFE019] to-transparent" />
              
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '40px 40px'
                }} />
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md border border-[#FFE019]/60 shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              {/* Content */}
              <div className="relative p-5 sm:p-6">
                {/* Coupon Title Banner with glow effect */}
                <motion.div
                  custom={0}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-center mb-4"
                >
                  <motion.h2
                    animate={{
                      textShadow: [
                        "0 0 18px rgba(255,224,25,0.6)",
                        "0 0 26px rgba(255,224,25,0.9)",
                        "0 0 18px rgba(255,224,25,0.6)"
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-white text-xl sm:text-xl font-extrabold tracking-tight"
                  >
                    {(() => {
                      // Helper to strip HTML tags
                      const stripHtml = (html: string) => {
                        if (!html) return '';
                        const tmp = document.createElement('DIV');
                        tmp.innerHTML = html;
                        return tmp.textContent || tmp.innerText || '';
                      };
                      
                      // PRIORITY 1: Always show coupon title if it exists and is not empty
                      // This is the main title like "Free Entire Cart Shipping"
                      // Check both coupon.title and make sure it's a valid non-empty string
                      const rawTitle = coupon.title;
                      if (rawTitle !== null && rawTitle !== undefined && rawTitle !== '') {
                        const title = stripHtml(String(rawTitle)).trim();
                        // Show title if it's not empty and not "Use code:"
                        if (title && title.length > 0 && title !== 'Use code:' && !title.startsWith('Use code:')) {
                          return title;
                        }
                      }
                      
                      // PRIORITY 2: Try description if title is not available
                      if (coupon.description) {
                        const description = stripHtml(coupon.description).trim();
                        const codeUpper = coupon.code ? coupon.code.toUpperCase().trim() : '';
                        if (description && 
                            description !== 'Code copied to clipboard!' && 
                            description.toUpperCase() !== codeUpper &&
                            !description.toUpperCase().includes(codeUpper)) {
                          return description;
                      }
                      }
                      
                      // PRIORITY 3: Generate title from discount
                      if (coupon.discount && coupon.discount > 0) {
                        const discountText = coupon.discountType === 'percentage' 
                          ? `${coupon.discount}% Off`
                          : `$${coupon.discount} Off`;
                        return discountText;
                      }
                      
                      // PRIORITY 4: Last resort - show store name (but this should rarely happen)
                      return coupon.storeName || 'Coupon';
                    })()}
                  </motion.h2>
                  <div className="mt-1.5 h-0.5 w-16 bg-[#FFE019] rounded-full mx-auto" />
                </motion.div>

                {/* Logo Section with enhanced styling */}
                <motion.div
                  custom={1}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white backdrop-blur-sm rounded-2xl p-4 mb-4 shadow-xl border border-[#FFE019]/40 relative overflow-hidden"
                >
                  {/* Decorative corner accents - smaller */}
                  <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-[#FFE019]/25 to-transparent rounded-br-full opacity-70" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-[#FFE019]/25 to-transparent rounded-tl-full opacity-70" />
                  
                  {(() => {
                    const logoUrl = getCouponLogoUrl();
                    
                    return logoUrl ? (
                      <div className="flex flex-col items-center relative z-10">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="w-28 h-28 mb-2 rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-100 flex items-center justify-center shadow-inner border border-[#FFE019]/40"
                        >
                          <img
                            src={logoUrl}
                            alt={coupon.storeName || 'Store logo'}
                            className="w-full h-full object-contain p-2"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              if (target.parentElement && coupon.storeName) {
                                target.parentElement.innerHTML = `<span class="text-4xl font-bold text-gray-400">${coupon.storeName.charAt(0)}</span>`;
                              }
                            }}
                          />
                        </motion.div>
                        <p className="text-gray-900 text-sm font-bold text-center">
                          {coupon.storeName || 'Store'}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center relative z-10">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="w-28 h-28 mb-2 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-inner border border-[#FFE019]/40"
                        >
                          <span className="text-4xl font-bold text-gray-400">
                            {coupon.storeName?.charAt(0) || '?'}
                          </span>
                        </motion.div>
                        <p className="text-gray-900 text-sm font-bold text-center">
                          {coupon.storeName || 'Store'}
                        </p>
                      </div>
                    );
                  })()}
                </motion.div>

                {/* Coupon Code Section with enhanced styling - Only show for code type */}
                {coupon.couponType === 'code' && coupon.code && (
                  <motion.div
                    custom={2}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.03, boxShadow: "0 20px 40px rgba(0,0,0,0.75)" }}
                    whileTap={{ scale: 0.97 }}
                    className="relative bg-gradient-to-r from-black via-[#111111] to-black rounded-2xl p-5 mb-4 shadow-xl cursor-pointer overflow-hidden border border-[#FFE019]/60"
                    onClick={handleCopyCode}
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{
                        x: ['-100%', '100%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: "linear"
                      }}
                    />
                    
                    <div className="relative z-10 text-center">
                      <motion.div
                        animate={copied ? {
                          scale: [1, 1.08, 1],
                          color: ['#ffffff', '#10b981', '#ffffff']
                        } : {}}
                        className="text-white text-3xl sm:text-3xl font-black mb-2 tracking-wider select-all drop-shadow-md"
                      >
                        {coupon.code}
                      </motion.div>
                      <motion.p
                        animate={copied ? { 
                          opacity: [0.9, 1, 0.9],
                          scale: [1, 1.05, 1]
                        } : {}}
                        className="text-white text-xs opacity-90 font-medium tracking-wide"
                      >
                        {copied ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            COPIED!
                          </span>
                        ) : (
                          'CLICK THE CODE TO AUTO COPY'
                        )}
                      </motion.p>
                    </div>
                  </motion.div>
                )}

                {/* Deal Section - Show URL for deals */}
                {coupon.couponType === 'deal' && coupon.url && (
                  <motion.div
                    custom={2}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative bg-gradient-to-r from-black via-[#111111] to-black rounded-2xl p-5 mb-4 shadow-xl overflow-hidden border-[#FFE019]/60 border"
                  >
                    <div className="relative z-10 text-center">
                      <motion.div className="text-[#FFE019] text-xl sm:text-2xl font-bold mb-2 tracking-wide drop-shadow-md">
                        Exclusive Deal Available!
                      </motion.div>
                      <motion.p
                        className="text-white text-sm opacity-90 font-medium tracking-wide"
                      >
                        Click "Continue to Store" to access this deal
                      </motion.p>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons with enhanced styling */}
                <motion.div
                  custom={3}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-2.5"
                >
                  <motion.button
                    whileHover={{ 
                      scale: 1.02,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.35)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      handleCopyCode();
                      onContinue();
                    }}
                  className="relative bg-[#FFE019] text-black font-bold py-3.5 px-6 rounded-xl hover:bg-[#e6cd17] transition-all shadow-xl text-base overflow-hidden group"
                  >
                    {/* Button shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{
                        x: ['-100%', '100%']
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 2,
                        ease: "easeInOut"
                      }}
                    />
                    <span className="relative z-10">Continue to Store</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ 
                      scale: 1.02,
                    backgroundColor: "rgba(255,255,255,0.15)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                  className="bg-transparent backdrop-blur-md text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-white/10 transition-all text-xs border border-[#FFE019]/60 shadow-md"
                  >
                    Close
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
