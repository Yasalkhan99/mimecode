'use client';

import { useEffect, useState } from 'react';
import { getBannersWithLayout, Banner } from '@/lib/services/bannerService';
import { getCoupons, Coupon } from '@/lib/services/couponService';
import { extractOriginalCloudinaryUrl } from '@/lib/utils/cloudinary';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function HeroBanners() {
  const [banners, setBanners] = useState<(Banner | null)[]>(Array(4).fill(null));
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerSet, setBannerSet] = useState<{ imageUrl: string; title?: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannersData, couponsData] = await Promise.all([
          getBannersWithLayout(),
          getCoupons()
        ]);
        console.log(' banner bannersData:', bannersData); // Debug log
        setBanners(bannersData);
        setCoupons(couponsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prepare banner data
  useEffect(() => {
    if (loading) return;

    const couponsWithLogo = coupons.filter((coupon) => coupon.logoUrl);

    const processLogoUrl = (rawUrl: string | undefined): string | undefined => {
      if (!rawUrl) return undefined;
      if (rawUrl.includes('/image/image/upload/') || rawUrl.match(/res\.cloudinary\.com\/image\//)) {
        const fileName = rawUrl.split('/').pop() || '';
        return `https://res.cloudinary.com/dyh3jmwtd/image/upload/${fileName}`;
      }
      const extracted = extractOriginalCloudinaryUrl(rawUrl);
      if (extracted && extracted.includes('res.cloudinary.com') && !extracted.includes('/image/image/') && !extracted.match(/res\.cloudinary\.com\/image\//)) {
        return extracted;
      }
      return rawUrl;
    };

    const allBanners = [
      banners[0] && banners[0].imageUrl ? { imageUrl: banners[0].imageUrl, title: banners[0].title } : 
      (couponsWithLogo[0]?.logoUrl ? { imageUrl: processLogoUrl(couponsWithLogo[0].logoUrl) || '', title: couponsWithLogo[0].code } : null),
      banners[1] && banners[1].imageUrl ? { imageUrl: banners[1].imageUrl, title: banners[1].title } : 
      (couponsWithLogo[1]?.logoUrl ? { imageUrl: processLogoUrl(couponsWithLogo[1].logoUrl) || '', title: couponsWithLogo[1].code } : null),
      banners[2] && banners[2].imageUrl ? { imageUrl: banners[2].imageUrl, title: banners[2].title } : 
      (couponsWithLogo[2]?.logoUrl ? { imageUrl: processLogoUrl(couponsWithLogo[2].logoUrl) || '', title: couponsWithLogo[2].code } : null),
      banners[3] && banners[3].imageUrl ? { imageUrl: banners[3].imageUrl, title: banners[3].title } : 
      (couponsWithLogo[3]?.logoUrl ? { imageUrl: processLogoUrl(couponsWithLogo[3].logoUrl) || '', title: couponsWithLogo[3].code } : null),
    ].filter(Boolean) as { imageUrl: string; title?: string }[];

    console.log(' banner allBanners:', allBanners); // Debug log
    
    if (allBanners.length > 0) {
      setBannerSet(allBanners);
    }
  }, [banners, coupons, loading]);

  // Shuffle banners every 4 seconds
  useEffect(() => {
    if (bannerSet.length <= 1) return;

    const shuffleInterval = setInterval(() => {
      setBannerSet((prev) => {
        // Create a shuffled copy
        const shuffled = [...prev];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      });
    }, 4000); // Shuffle every 4 seconds

    return () => clearInterval(shuffleInterval);
  }, [bannerSet.length]);

  if (loading) {
    return (
      <div className="w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 max-w-[1840px] mx-auto">
          <div className="w-full md:w-[50.5%] aspect-[930/547] bg-gray-200 animate-pulse rounded-2xl"></div>
          <div className="w-full md:w-[24.9%] aspect-[459/547] bg-gray-200 animate-pulse rounded-2xl"></div>
          <div className="w-full md:w-[24.5%] flex flex-col gap-3 sm:gap-4">
            <div className="w-full aspect-[451/264] bg-gray-200 animate-pulse rounded-2xl"></div>
            <div className="w-full aspect-[451/264] bg-gray-200 animate-pulse rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Get current 4 banners (or fill with null if less than 4)
  const getBannerAt = (index: number) => {
    return bannerSet[index] || null;
  };

  const largeLeftBanner = getBannerAt(0);
  const middleBanner = getBannerAt(1);
  const topRightBanner = getBannerAt(2);
  const bottomRightBanner = getBannerAt(3);

  // Animation variants for shuffle effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50,
      rotate: -5
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -50,
      rotate: 5,
      transition: {
        duration: 0.4
      }
    }
  };

  const floatVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  // Animated Banner Component with Framer Motion
  const AnimatedBanner = ({ 
    banner, 
    shape = 'rounded-xl',
    title,
    index
  }: { 
    banner: { imageUrl: string; title?: string } | null; 
    shape?: string;
    title?: string;
    index: number;
  }) => {
    return (
      <motion.div
        key={`banner-${index}-${banner?.imageUrl || 'empty'}`}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileHover={{ 
          scale: 1.05, 
          y: -8,
          transition: { duration: 0.3 }
        }}
        className="relative w-full h-full group"
      >
        <motion.div
          variants={floatVariants}
          animate="animate"
          style={{ animationDelay: `${index * 0.5}s` }}
          className={`relative w-full h-full ${shape} overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg`}
        >
          {/* Animated gradient overlay */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 z-10"
            whileHover={{
              background: [
                'linear-gradient(135deg, rgba(59, 130, 246, 0) 0%, rgba(147, 51, 234, 0) 50%, rgba(236, 72, 153, 0) 100%)',
                'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%)',
              ]
            }}
            transition={{ duration: 0.7 }}
          />
          
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: '-100%', skewX: -12 }}
            whileHover={{ x: '200%' }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />

          {banner ? (
            <>
              {banner.imageUrl.includes('res.cloudinary.com') || banner.imageUrl.includes('storage.googleapis.com') ? (
                <Image
                  src={banner.imageUrl}
                  alt={banner?.title || title || 'Banner'}
                  fill
                  className="object-contain w-full h-full"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 50vw, 50.5vw"
                  onError={(e) => {
                    console.error('Image failed to load:', banner.imageUrl);
                  }}
                />
              ) : (
                <img
                  src={banner.imageUrl}
                  alt={banner?.title || title || 'Banner'}
                  className="w-full h-full object-contain"
                  style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
                  onError={(e) => {
                    console.error('Image failed to load:', banner.imageUrl);
                  }}
                />
              )}
              
              {/* Title overlay */}
              {banner.title && (
                <motion.div
                  initial={{ y: '100%' }}
                  whileHover={{ y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 sm:p-4 z-20"
                >
                  <h3 className="text-white text-sm sm:text-base md:text-lg font-semibold tracking-wide text-center">
                    {banner.title}
                  </h3>
                </motion.div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-3 border-4 border-gray-400 rounded-full flex items-center justify-center"
                >
                  <span className="text-gray-500 text-2xl">✦</span>
                </motion.div>
                <p className="text-gray-500 text-xs sm:text-sm">{title || 'Banner'}</p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={bannerSet.join('-')}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col md:flex-row gap-3 sm:gap-4 max-w-[1840px] mx-auto"
        >
          {/* Banner 1 - Large Left */}
          <div className="w-full md:w-[50.5%] aspect-[930/547] min-h-[200px] sm:min-h-[300px]">
            <AnimatedBanner 
              banner={largeLeftBanner} 
              shape="rounded-tl-3xl rounded-br-3xl rounded-tr-lg rounded-bl-lg"
              title="Banner 1"
              index={0}
            />
          </div>

          {/* Banner 2 - Middle */}
          <div className="w-full md:w-[24.9%] aspect-[459/547] min-h-[200px] sm:min-h-[300px]">
            <AnimatedBanner 
              banner={middleBanner} 
              shape="rounded-full"
              title="Banner 2"
              index={1}
            />
          </div>

          {/* Right Side - Two Stacked Banners */}
          <div className="w-full md:w-[24.5%] flex flex-col gap-3 sm:gap-4">
            {/* Banner 3 - Top Right */}
            <div className="w-full aspect-[451/264] min-h-[150px] sm:min-h-[180px]">
              <AnimatedBanner 
                banner={topRightBanner} 
                shape="rounded-bl-3xl rounded-br-3xl rounded-tl-lg rounded-tr-lg"
                title="Banner 3"
                index={2}
              />
            </div>

            {/* Banner 4 - Bottom Right */}
            <div className="w-full aspect-[451/264] min-h-[150px] sm:min-h-[180px]">
              <AnimatedBanner 
                banner={bottomRightBanner} 
                shape="rounded-tl-3xl rounded-tr-3xl rounded-bl-lg rounded-br-lg"
                title="Banner 4"
                index={3}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
