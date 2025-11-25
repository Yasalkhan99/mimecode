'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coupon } from '@/lib/services/couponService';

interface CouponPopupProps {
  coupon: Coupon | null;
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export default function CouponPopup({ coupon, isOpen, onClose, onContinue }: CouponPopupProps) {
  const [copied, setCopied] = useState(false);

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
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-pink-600 to-red-500 rounded-2xl blur-xl opacity-50 -z-10" />
            
            {/* Popup Card */}
            <div className="relative bg-gradient-to-br from-pink-500 via-pink-600 to-red-500 rounded-2xl shadow-2xl overflow-hidden border border-white/20">
              {/* Decorative top border */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              
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
                className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md border border-white/30 shadow-md"
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
                        "0 0 15px rgba(255,255,255,0.4)",
                        "0 0 25px rgba(255,255,255,0.6)",
                        "0 0 15px rgba(255,255,255,0.4)"
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-white text-xl sm:text-2xl font-extrabold tracking-tight"
                  >
                    {coupon.storeName || coupon.code || 'Coupon'}
                  </motion.h2>
                  <div className="mt-1.5 h-0.5 w-16 bg-white/30 rounded-full mx-auto" />
                </motion.div>

                {/* Logo Section with enhanced styling */}
                <motion.div
                  custom={1}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 mb-4 shadow-xl border border-white/40 relative overflow-hidden"
                >
                  {/* Decorative corner accents - smaller */}
                  <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-pink-100 to-transparent rounded-br-full opacity-40" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-red-100 to-transparent rounded-tl-full opacity-40" />
                  
                  {coupon.logoUrl ? (
                    <div className="flex flex-col items-center relative z-10">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-28 h-28 mb-2 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-inner border border-gray-200"
                      >
                        <img
                          src={coupon.logoUrl}
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
                      <p className="text-gray-800 text-sm font-bold text-center">
                        {coupon.storeName || 'Store'}
                      </p>
                      {coupon.url && (
                        <p className="text-gray-500 text-xs mt-0.5 text-center">
                          {getDomainFromUrl(coupon.url)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center relative z-10">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-28 h-28 mb-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner border border-gray-300"
                      >
                        <span className="text-4xl font-bold text-gray-400">
                          {coupon.storeName?.charAt(0) || '?'}
                        </span>
                      </motion.div>
                      <p className="text-gray-800 text-sm font-bold text-center">
                        {coupon.storeName || 'Store'}
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Coupon Code Section with enhanced styling - Only show for code type */}
                {coupon.couponType === 'code' && coupon.code && (
                  <motion.div
                    custom={2}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.03, boxShadow: "0 20px 40px rgba(236, 72, 153, 0.4)" }}
                    whileTap={{ scale: 0.97 }}
                    className="relative bg-gradient-to-r from-pink-600 via-red-500 to-red-600 rounded-2xl p-5 mb-4 shadow-xl cursor-pointer overflow-hidden border border-white/20"
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
                        className="text-white text-3xl sm:text-4xl font-black mb-2 tracking-wider select-all drop-shadow-md"
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
                    className="relative bg-gradient-to-r from-pink-600 via-red-500 to-red-600 rounded-2xl p-5 mb-4 shadow-xl overflow-hidden border border-white/20"
                  >
                    <div className="relative z-10 text-center">
                      <motion.div
                        className="text-white text-xl sm:text-2xl font-bold mb-2 tracking-wide drop-shadow-md"
                      >
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
                      boxShadow: "0 8px 20px rgba(0,0,0,0.25)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      handleCopyCode();
                      onContinue();
                    }}
                    className="relative bg-white text-pink-600 font-bold py-3.5 px-6 rounded-xl hover:bg-gray-50 transition-all shadow-xl text-base overflow-hidden group"
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
                      backgroundColor: "rgba(255,255,255,0.3)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="bg-white/20 backdrop-blur-md text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-white/30 transition-all text-xs border border-white/30 shadow-md"
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
