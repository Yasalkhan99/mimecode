'use client';

import { useEffect, useState } from 'react';
import { getCategories, Category } from '@/lib/services/categoryService';
import Link from 'next/link';

export default function CategoriesGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'name'>('newest');

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const data = await getCategories();
        // Helper function to get timestamp in milliseconds
        const getTimestamp = (createdAt: any): number => {
          if (!createdAt) return 0;
          // If it's a Firestore Timestamp object
          if (createdAt.toMillis && typeof createdAt.toMillis === 'function') {
            return createdAt.toMillis();
          }
          // If it's already a number (milliseconds)
          if (typeof createdAt === 'number') {
            return createdAt;
          }
          // If it's a Date object
          if (createdAt instanceof Date) {
            return createdAt.getTime();
          }
          // If it's a string, try to parse it
          if (typeof createdAt === 'string') {
            const parsed = Date.parse(createdAt);
            return isNaN(parsed) ? 0 : parsed;
          }
          // If it's an object with seconds (Firestore Timestamp-like)
          if (createdAt.seconds && typeof createdAt.seconds === 'number') {
            return createdAt.seconds * 1000 + (createdAt.nanoseconds || 0) / 1000000;
          }
          return 0;
        };

        // Sort categories
        const sorted = [...data].sort((a, b) => {
          if (sortBy === 'newest') {
            const aTime = getTimestamp(a.createdAt);
            const bTime = getTimestamp(b.createdAt);
            return bTime - aTime;
          } else {
            return a.name.localeCompare(b.name);
          }
        });
        setCategories(sorted);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [sortBy]);

  if (loading) {
    return (
      <div className="w-full px-2 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg aspect-square animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Categories Grid */}
        <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100">
          {/* Mobile: Horizontal Scrollable with 3 Rows */}
          <div className="block sm:hidden">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
              {/* Group categories into chunks of 9 (3 rows x 3 columns) */}
              {Array.from({ length: Math.ceil(categories.length / 9) }).map((_, chunkIndex) => {
                const chunk = categories.slice(chunkIndex * 9, chunkIndex * 9 + 9);
                // Split into 3 rows
                const row1 = chunk.slice(0, 3);
                const row2 = chunk.slice(3, 6);
                const row3 = chunk.slice(6, 9);
                
                return (
                  <div key={chunkIndex} className="flex-shrink-0 w-[calc(100vw-2rem)] max-w-[400px] snap-center">
                    <div className="grid grid-rows-3 gap-3">
                      {/* Row 1 */}
                      <div className="grid grid-cols-3 gap-3">
                        {row1.map((category) => (
                          <Link
                            key={category.id}
                            href={`/categories/${category.id}`}
                            className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gradient-to-br hover:from-[#ABC443]/10 hover:to-[#41361A]/10 transition-all duration-300 group"
                          >
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300 relative overflow-hidden group-hover:scale-110"
                              style={{ backgroundColor: category.backgroundColor }}
                            >
                              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-xl"
                                style={{ backgroundColor: category.backgroundColor }}
                              ></div>
                              
                              {category.logoUrl ? (
                                <img
                                  src={category.logoUrl}
                                  alt={category.name}
                                  className={`${category.logoUrl.includes('data:image/svg+xml') ? 'w-full h-full' : 'w-8 h-8'} object-contain relative z-10 group-hover:rotate-12 transition-transform duration-300`}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full rounded-full flex items-center justify-center relative z-10" style={{ backgroundColor: category.backgroundColor }}>
                                  <div className="w-3/4 h-3/4 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-base font-bold text-gray-700">
                                      {category.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-gray-800 group-hover:text-[#ABC443] transition-colors duration-300 lowercase text-center line-clamp-2">
                              {category.name.toLowerCase()}
                            </span>
                          </Link>
                        ))}
                      </div>
                      
                      {/* Row 2 */}
                      <div className="grid grid-cols-3 gap-3">
                        {row2.map((category) => (
                          <Link
                            key={category.id}
                            href={`/categories/${category.id}`}
                            className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gradient-to-br hover:from-[#ABC443]/10 hover:to-[#41361A]/10 transition-all duration-300 group"
                          >
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300 relative overflow-hidden group-hover:scale-110"
                              style={{ backgroundColor: category.backgroundColor }}
                            >
                              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-xl"
                                style={{ backgroundColor: category.backgroundColor }}
                              ></div>
                              
                              {category.logoUrl ? (
                                <img
                                  src={category.logoUrl}
                                  alt={category.name}
                                  className={`${category.logoUrl.includes('data:image/svg+xml') ? 'w-full h-full' : 'w-8 h-8'} object-contain relative z-10 group-hover:rotate-12 transition-transform duration-300`}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full rounded-full flex items-center justify-center relative z-10" style={{ backgroundColor: category.backgroundColor }}>
                                  <div className="w-3/4 h-3/4 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-base font-bold text-gray-700">
                                      {category.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-gray-800 group-hover:text-[#ABC443] transition-colors duration-300 lowercase text-center line-clamp-2">
                              {category.name.toLowerCase()}
                            </span>
                          </Link>
                        ))}
                      </div>
                      
                      {/* Row 3 */}
                      <div className="grid grid-cols-3 gap-3">
                        {row3.map((category) => (
                          <Link
                            key={category.id}
                            href={`/categories/${category.id}`}
                            className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gradient-to-br hover:from-[#ABC443]/10 hover:to-[#41361A]/10 transition-all duration-300 group"
                          >
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300 relative overflow-hidden group-hover:scale-110"
                              style={{ backgroundColor: category.backgroundColor }}
                            >
                              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-xl"
                                style={{ backgroundColor: category.backgroundColor }}
                              ></div>
                              
                              {category.logoUrl ? (
                                <img
                                  src={category.logoUrl}
                                  alt={category.name}
                                  className={`${category.logoUrl.includes('data:image/svg+xml') ? 'w-full h-full' : 'w-8 h-8'} object-contain relative z-10 group-hover:rotate-12 transition-transform duration-300`}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full rounded-full flex items-center justify-center relative z-10" style={{ backgroundColor: category.backgroundColor }}>
                                  <div className="w-3/4 h-3/4 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-base font-bold text-gray-700">
                                      {category.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-gray-800 group-hover:text-[#ABC443] transition-colors duration-300 lowercase text-center line-clamp-2">
                              {category.name.toLowerCase()}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-gradient-to-r hover:from-[#ABC443]/10 hover:to-[#41361A]/10 transition-all duration-300 group transform hover:scale-105 hover:shadow-lg"
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-full flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300 relative overflow-hidden group-hover:scale-110"
                  style={{ backgroundColor: category.backgroundColor }}
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-xl"
                    style={{ backgroundColor: category.backgroundColor }}
                  ></div>
                  
                  {category.logoUrl ? (
                    <img
                      src={category.logoUrl}
                      alt={category.name}
                      className={`${category.logoUrl.includes('data:image/svg+xml') ? 'w-full h-full' : 'w-9 h-9 sm:w-11 sm:h-11'} object-contain relative z-10 group-hover:rotate-12 transition-transform duration-300`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Show fallback
                        const parent = target.parentElement;
                        if (parent) {
                          const existingFallback = parent.querySelector('.fallback-letter');
                          if (!existingFallback) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-letter absolute inset-0 w-full h-full rounded-full flex items-center justify-center z-10';
                            fallback.innerHTML = `
                              <div class="w-3/4 h-3/4 rounded-full bg-gray-200 flex items-center justify-center">
                                <span class="text-lg sm:text-xl font-bold text-gray-700">${category.name.charAt(0).toUpperCase()}</span>
                              </div>
                            `;
                            parent.appendChild(fallback);
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center relative z-10" style={{ backgroundColor: category.backgroundColor }}>
                      <div className="w-3/4 h-3/4 rounded-full bg-gray-200 flex items-center justify-center group-hover:bg-gray-100 transition-colors duration-300">
                        <span className="text-lg sm:text-xl font-bold text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-sm sm:text-base font-semibold text-gray-800 group-hover:text-[#ABC443] transition-all duration-300 lowercase flex-1 group-hover:translate-x-1">
                  {category.name.toLowerCase()}
                </span>
                {/* Arrow icon on hover */}
                <svg 
                  className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

