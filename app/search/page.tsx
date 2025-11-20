'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getCoupons, Coupon } from '@/lib/services/couponService';
import { getStores, Store } from '@/lib/services/storeService';
import { getCategories, Category } from '@/lib/services/categoryService';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || '';
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);

  useEffect(() => {
    document.title = query ? `Search: ${query} - AvailCoupon` : 'Search - AvailCoupon';
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [couponsData, storesData, categoriesData] = await Promise.all([
          getCoupons(),
          getStores(),
          getCategories()
        ]);
        setCoupons(couponsData.filter(c => c.isActive));
        setStores(storesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching search data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (!query && !categoryId) {
      setFilteredCoupons([]);
      setFilteredStores([]);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    
    // Filter coupons
    let filteredC = coupons;
    
    if (categoryId) {
      filteredC = filteredC.filter(c => c.categoryId === categoryId);
    }
    
    if (searchTerm) {
      filteredC = filteredC.filter(c => 
        c.code.toLowerCase().includes(searchTerm) ||
        c.storeName?.toLowerCase().includes(searchTerm) ||
        c.description.toLowerCase().includes(searchTerm)
      );
    }
    
    setFilteredCoupons(filteredC);

    // Filter stores
    let filteredS = stores;
    
    if (searchTerm) {
      filteredS = filteredS.filter(s => 
        s.name.toLowerCase().includes(searchTerm) ||
        s.description.toLowerCase().includes(searchTerm)
      );
    }
    
    setFilteredStores(filteredS);
  }, [query, categoryId, coupons, stores]);

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <>
      {/* Search Results Section */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 bg-white overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          {/* Search Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Search Results
            </h1>
            {(query || categoryId) && (
              <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base text-gray-600">
                {query && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold">
                    Query: "{query}"
                  </span>
                )}
                {selectedCategory && (
                  <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full font-semibold">
                    Category: {selectedCategory.name}
                  </span>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading search results...</p>
            </div>
          ) : !query && !categoryId ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg mb-4">Enter a search term to find coupons and stores</p>
              <p className="text-gray-400 text-sm">Try searching for store names, coupon codes, or descriptions</p>
            </div>
          ) : (
            <>
              {/* Coupons Results */}
              {filteredCoupons.length > 0 && (
                <div className="mb-8 sm:mb-12">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                    Coupons ({filteredCoupons.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredCoupons.map((coupon) => (
                      <Link
                        key={coupon.id}
                        href={coupon.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-orange-400 hover:shadow-lg transition-all duration-300"
                      >
                        {coupon.logoUrl && (
                          <div className="mb-3 flex items-center justify-center h-16">
                            <img
                              src={coupon.logoUrl}
                              alt={coupon.storeName || coupon.code}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="text-center">
                          <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                            {coupon.code}
                          </h3>
                          {coupon.storeName && (
                            <p className="text-sm text-gray-600 mb-2">{coupon.storeName}</p>
                          )}
                          <p className="text-xs sm:text-sm text-gray-500 mb-3 line-clamp-2">
                            {coupon.description}
                          </p>
                          <div className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold px-4 py-2 rounded-lg">
                            {coupon.discount}{coupon.discountType === 'percentage' ? '%' : ' AED'} OFF
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Stores Results */}
              {filteredStores.length > 0 && (
                <div className="mb-8 sm:mb-12">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                    Stores ({filteredStores.length})
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {filteredStores.map((store) => (
                      <Link
                        key={store.id}
                        href={`/stores/${store.id}`}
                        className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-400 hover:shadow-lg transition-all duration-300 text-center"
                      >
                        {store.logoUrl ? (
                          <div className="mb-3 flex items-center justify-center h-16">
                            <img
                              src={store.logoUrl}
                              alt={store.name}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="mb-3 h-16 flex items-center justify-center bg-gray-100 rounded">
                            <span className="text-gray-400 text-xs font-bold">{store.name.substring(0, 2)}</span>
                          </div>
                        )}
                        <h3 className="font-semibold text-sm text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                          {store.name}
                        </h3>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {filteredCoupons.length === 0 && filteredStores.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-lg mb-2">No results found</p>
                  <p className="text-gray-400 text-sm">Try different search terms or browse categories</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <Navbar />
      <Suspense fallback={
        <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 bg-white overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center py-12">
              <p className="text-gray-500">Loading search results...</p>
            </div>
          </div>
        </div>
      }>
        <SearchContent />
      </Suspense>
      <NewsletterSubscription />
      <Footer />
    </div>
  );
}

