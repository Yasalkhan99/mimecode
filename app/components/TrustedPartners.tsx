'use client';

import { useEffect, useState } from 'react';
import { getLogosWithLayout, Logo } from '@/lib/services/logoService';

export default function TrustedPartners() {
  const [logos, setLogos] = useState<(Logo | null)[]>(Array(18).fill(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogos = async () => {
      setLoading(true);
      try {
        const data = await getLogosWithLayout();
        setLogos(data);
      } catch (error) {
        console.error('Error fetching logos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogos();
  }, []);

  // Filter out null logos
  const validLogos = logos.filter(logo => logo !== null) as Logo[];

  if (loading) {
    return (
      <div className="w-full px-2 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16 bg-white relative overflow-hidden">
        {/* SVG Background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src="/Subtract.svg" 
            alt="" 
            className="h-full w-auto object-contain"
            style={{ maxWidth: 'none' }}
          />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4">
            {[...Array(18)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 h-24 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (validLogos.length === 0) {
    return null; // Don't show section if no logos
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 lg:py-16 bg-white relative overflow-hidden animate-fade-in-up">
      {/* SVG Background */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <img 
          src="/Subtract.svg" 
          alt="" 
          className="h-full w-auto object-contain"
          style={{ maxWidth: 'none' }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Text */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12 animate-slide-in-left">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 drop-shadow-lg">
            We're Just Keep Growing
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
            With 6.3k Trusted Stores
          </p>
        </div>

        {/* Logos Grid */}
        <div className="relative overflow-hidden w-full">
          {/* Animated Sliding Row for Layout 1-9 */}
          <div className="overflow-hidden w-full">
            <div 
              className="flex gap-2 sm:gap-3 md:gap-4"
              style={{
                animation: 'slideLeft 25s linear infinite',
                width: 'fit-content'
              }}
            >
              {[...Array(2)].map((_, loopIndex) => (
                logos.slice(0, 9).map((logo, index) => (
                  logo ? (
                    <div
                      key={`${logo.id}-${loopIndex}`}
                      className="bg-white rounded-lg p-2 sm:p-3 md:p-4 h-16 sm:h-20 md:h-24 w-20 sm:w-24 md:w-28 flex-shrink-0 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                    >
                      {logo.logoUrl ? (
                        <img
                          src={logo.logoUrl}
                          alt={logo.name}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-xs font-semibold text-gray-500">${logo.name.charAt(0)}</span></div>`;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-500">
                            {logo.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      key={`empty-${index}-${loopIndex}`}
                      className="bg-white/50 rounded-lg p-2 sm:p-3 md:p-4 h-16 sm:h-20 md:h-24 w-20 sm:w-24 md:w-28 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-white/30"
                    >
                      <div className="text-white/30 text-xs text-center">
                        <p className="font-medium">Layout {index + 1}</p>
                        <p className="text-[10px] mt-1">Empty</p>
                      </div>
                    </div>
                  )
                ))
              ))}
            </div>
          </div>

          {/* Animated Sliding Row for Layout 10-18 (Right to Left) */}
          <div className="overflow-hidden w-full mt-3 sm:mt-4">
            <div 
              className="flex gap-2 sm:gap-3 md:gap-4"
              style={{
                animation: 'slideRight 25s linear infinite',
                width: 'fit-content'
              }}
            >
              {[...Array(2)].map((_, loopIndex) => (
                logos.slice(9, 18).map((logo, index) => (
                  logo ? (
                    <div
                      key={`${logo.id}-${loopIndex}`}
                      className="bg-white rounded-lg p-2 sm:p-3 md:p-4 h-16 sm:h-20 md:h-24 w-20 sm:w-24 md:w-28 flex-shrink-0 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                    >
                      {logo.logoUrl ? (
                        <img
                          src={logo.logoUrl}
                          alt={logo.name}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-xs font-semibold text-gray-500">${logo.name.charAt(0)}</span></div>`;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-500">
                            {logo.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      key={`empty-${index + 9}-${loopIndex}`}
                      className="bg-white/50 rounded-lg p-2 sm:p-3 md:p-4 h-16 sm:h-20 md:h-24 w-20 sm:w-24 md:w-28 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-white/30"
                    >
                      <div className="text-white/30 text-xs text-center">
                        <p className="font-medium">Layout {index + 10}</p>
                        <p className="text-[10px] mt-1">Empty</p>
                      </div>
                    </div>
                  )
                ))
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

