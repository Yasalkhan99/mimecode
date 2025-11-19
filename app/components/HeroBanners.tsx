'use client';

import { useEffect, useState } from 'react';
import { getBannersWithLayout, Banner } from '@/lib/services/bannerService';
import { getCoupons, Coupon } from '@/lib/services/couponService';
import { extractOriginalCloudinaryUrl } from '@/lib/utils/cloudinary';
import Image from 'next/image';

export default function HeroBanners() {
  const [banners, setBanners] = useState<(Banner | null)[]>(Array(4).fill(null));
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannersData, couponsData] = await Promise.all([
          getBannersWithLayout(),
          getCoupons()
        ]);
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

  if (loading) {
    return (
      <div className="w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 max-w-[1840px] mx-auto">
          <div className="w-full md:w-[50.5%] aspect-[930/547] bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="w-full md:w-[24.9%] aspect-[459/547] bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="w-full md:w-[24.5%] flex flex-col gap-3 sm:gap-4">
            <div className="w-full aspect-[451/264] bg-gray-200 animate-pulse rounded-lg"></div>
            <div className="w-full aspect-[451/264] bg-gray-200 animate-pulse rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Get banners for different positions - all 4 cards in the grid
  // Banner 1: 930px × 547px (aspect ratio: 930/547 ≈ 1.70)
  // Banner 2: 459px × 547px (aspect ratio: 459/547 ≈ 0.84)
  // Banner 3: 451px × 264px (aspect ratio: 451/264 ≈ 1.71)
  // Banner 4: 451px × 264px (aspect ratio: 451/264 ≈ 1.71)
  
  // Use coupon logoUrl(s) for banner selection: fill banners from filtered coupons in order
  const couponsWithLogo = coupons.filter((coupon) => coupon.logoUrl);

  // helper to process a coupon logo URL: try to fix malformed cloudinary urls or extract original
  const processLogoUrl = (rawUrl: string | undefined): string | undefined => {
    if (!rawUrl) return undefined;
    // malformed pattern: '/image/image/upload/' or 'res.cloudinary.com/image/'
    if (rawUrl.includes('/image/image/upload/') || rawUrl.match(/res\.cloudinary\.com\/image\//)) {
      const fileName = rawUrl.split('/').pop() || '';
      return `https://res.cloudinary.com/dyh3jmwtd/image/upload/${fileName}`;
    }
    const extracted = extractOriginalCloudinaryUrl(rawUrl);
    if (extracted && extracted.includes('res.cloudinary.com') && !extracted.includes('/image/image/') && !extracted.match(/res\.cloudinary\.com\/image\//)) {
      return extracted;
    }
    // fallback to raw
    return rawUrl;
  };

  // Use banners with layout positions (1-4)
  // Layout 1: Large Left (index 0) - 930×547px
  // Layout 2: Middle (index 1) - 459×547px
  // Layout 3: Top Right (index 2) - 451×264px
  // Layout 4: Bottom Right (index 3) - 451×264px
  
  // If no banner at position, fallback to coupons with logo
  const largeLeftBanner = banners[0] ? { imageUrl: banners[0].imageUrl, title: banners[0].title } : 
    (couponsWithLogo[0]?.logoUrl ? { imageUrl: processLogoUrl(couponsWithLogo[0].logoUrl) || '', title: couponsWithLogo[0].code } : null);
  
  const middleBanner = banners[1] ? { imageUrl: banners[1].imageUrl, title: banners[1].title } : 
    (couponsWithLogo[1]?.logoUrl ? { imageUrl: processLogoUrl(couponsWithLogo[1].logoUrl) || '', title: couponsWithLogo[1].code } : null);
  
  const topRightBanner = banners[2] ? { imageUrl: banners[2].imageUrl, title: banners[2].title } : 
    (couponsWithLogo[2]?.logoUrl ? { imageUrl: processLogoUrl(couponsWithLogo[2].logoUrl) || '', title: couponsWithLogo[2].code } : null);
  
  const bottomRightBanner = banners[3] ? { imageUrl: banners[3].imageUrl, title: banners[3].title } : 
    (couponsWithLogo[3]?.logoUrl ? { imageUrl: processLogoUrl(couponsWithLogo[3].logoUrl) || '', title: couponsWithLogo[3].code } : null);

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 animate-fade-in-up">
      {/* Main Banner Grid - Responsive across all devices */}
      <div className="flex flex-col md:flex-row gap-2 sm:gap-3 md:gap-4 max-w-[1840px] mx-auto">
        {/* Banner 1 - Large Left: 930px × 547px (50.5% width on medium+ screens) */}
        <div className="w-full md:w-[50.5%] aspect-[930/547] min-h-[200px] sm:min-h-[300px]">
          {largeLeftBanner ? (
            <div className="relative w-full h-full rounded-lg overflow-hidden bg-pink-50 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center">
              {largeLeftBanner.imageUrl.includes('res.cloudinary.com') || largeLeftBanner.imageUrl.includes('storage.googleapis.com') ? (
                <Image
                  src={largeLeftBanner.imageUrl}
                  alt={largeLeftBanner?.title || 'Banner 1'}
                  fill
                  className="object-contain w-full h-full"
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 50vw, 50.5vw"
                  onError={(e) => {
                    console.error('Image failed to load:', largeLeftBanner.imageUrl);
                  }}
                />
              ) : (
                <img
                  src={largeLeftBanner.imageUrl}
                  alt={largeLeftBanner?.title || 'Banner 1'}
                  className="w-full h-full object-contain"
                  style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
                  onError={(e) => {
                    console.error('Image failed to load:', largeLeftBanner.imageUrl);
                    console.error('Error:', e);
                  }}
                />
              )}
            </div>
          ) : (
            <div className="w-full h-full rounded-lg bg-pink-50 flex items-center justify-center border-2 border-dashed border-pink-200">
              <p className="text-gray-400 text-xs sm:text-sm">Banner 1</p>
            </div>
          )}
        </div>

        {/* Banner 2 - Middle: 459px × 547px (24.9% width on medium+ screens) */}
        <div className="w-full md:w-[24.9%] aspect-[459/547] min-h-[200px] sm:min-h-[300px]">
          {middleBanner ? (
            <div className="relative w-full h-full rounded-lg overflow-hidden bg-black shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center">
              {middleBanner.imageUrl.includes('res.cloudinary.com') || middleBanner.imageUrl.includes('storage.googleapis.com') ? (
                <Image
                  src={middleBanner.imageUrl}
                  alt={middleBanner?.title || 'Banner 2'}
                  fill
                  className="object-cover w-full h-full"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 25vw, 24.9vw"
                />
              ) : (
                <img
                  src={middleBanner.imageUrl}
                  alt={middleBanner?.title || 'Banner 2'}
                  className="w-full h-full object-contain"
                  style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
                  onError={(e) => {
                    console.error('Middle banner image failed to load:', middleBanner.imageUrl);
                    console.error('Error:', e);
                  }}
                />
              )}
            </div>
          ) : (
            <div className="w-full h-full rounded-lg bg-black flex items-center justify-center border-2 border-dashed border-gray-700">
              <p className="text-gray-400 text-white text-xs sm:text-sm">Banner 2</p>
            </div>
          )}
        </div>

        {/* Right Side - Two Stacked Banners: 451px width (24.5% on medium+ screens) */}
        <div className="w-full md:w-[24.5%] flex flex-col gap-3 sm:gap-4">
          {/* Banner 3 - Top Right: 451px × 264px */}
          <div className="w-full aspect-[451/264] min-h-[150px] sm:min-h-[180px]">
            {topRightBanner ? (
              <div className="relative w-full h-full rounded-lg overflow-hidden bg-orange-50 shadow-lg hover:shadow-xl transition-shadow">
                {topRightBanner.imageUrl.includes('res.cloudinary.com') || topRightBanner.imageUrl.includes('storage.googleapis.com') ? (
                  <Image
                    src={topRightBanner.imageUrl}
                    alt={topRightBanner?.title || 'Banner 3'}
                    fill
                    className="object-cover w-full h-full"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 25vw, 24.5vw"
                  />
                ) : (
                  <img
                    src={topRightBanner.imageUrl}
                    alt={topRightBanner?.title || 'Banner 3'}
                    className="w-full h-full object-cover"
                    style={{ display: 'block', width: '100%', height: '100%' }}
                    onError={(e) => {
                      console.error('Top right banner image failed to load:', topRightBanner.imageUrl);
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-full rounded-lg bg-orange-50 flex items-center justify-center border-2 border-dashed border-orange-200">
                <p className="text-gray-400 text-xs">Banner 3</p>
              </div>
            )}
          </div>

          {/* Banner 4 - Bottom Right: 451px × 264px */}
          <div className="w-full aspect-[451/264] min-h-[150px] sm:min-h-[180px]">
            {bottomRightBanner ? (
              <div className="relative w-full h-full rounded-lg overflow-hidden bg-pink-50 shadow-lg hover:shadow-xl transition-shadow">
                {bottomRightBanner.imageUrl.includes('res.cloudinary.com') || bottomRightBanner.imageUrl.includes('storage.googleapis.com') ? (
                  <Image
                    src={bottomRightBanner.imageUrl}
                    alt={bottomRightBanner?.title || 'Banner 4'}
                    fill
                    className="object-cover w-full h-full"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 25vw, 24.5vw"
                  />
                ) : (
                  <img
                    src={bottomRightBanner.imageUrl}
                    alt={bottomRightBanner?.title || 'Banner 4'}
                    className="w-full h-full object-cover"
                    style={{ display: 'block', width: '100%', height: '100%' }}
                    onError={(e) => {
                      console.error('Bottom right banner image failed to load:', bottomRightBanner.imageUrl);
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-full rounded-lg bg-pink-50 flex items-center justify-center border-2 border-dashed border-pink-200">
                <p className="text-gray-400 text-xs">Banner 4</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

