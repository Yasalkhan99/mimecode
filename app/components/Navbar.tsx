"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCategories, Category } from "@/lib/services/categoryService";
import { getStores, Store } from "@/lib/services/storeService";
import { getFavoritesCount } from "@/lib/services/favoritesService";
import { getUnreadCount, getNotifications, initializeSampleNotifications } from "@/lib/services/notificationsService";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchCategoryOpen, setSearchCategoryOpen] = useState(false);
  const [storesDropdownOpen, setStoresDropdownOpen] = useState(false);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, storesData] = await Promise.all([
          getCategories(),
          getStores()
        ]);
        setCategories(categoriesData);
        setStores(storesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
    
    // Initialize sample notifications
    initializeSampleNotifications();
    
    // Update counts
    updateCounts();
    
    // Listen for updates
    const handleFavoritesUpdate = () => updateCounts();
    const handleNotificationUpdate = () => updateCounts();
    
    window.addEventListener('notificationUpdated', handleNotificationUpdate);
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    
    return () => {
      window.removeEventListener('notificationUpdated', handleNotificationUpdate);
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
    };
  }, []);

  const updateCounts = () => {
    setFavoritesCount(getFavoritesCount());
    setNotificationsCount(getUnreadCount());
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown-container')) {
        setSearchCategoryOpen(false);
      }
      if (!target.closest('.stores-dropdown-container')) {
        setStoresDropdownOpen(false);
      }
    };

    if (searchCategoryOpen || storesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [searchCategoryOpen, storesDropdownOpen]);

  const isActive = (path: string) => {
    if (path === '/categories') {
      // Match /categories and /categories/[id]
      return pathname === '/categories' || pathname?.startsWith('/categories/');
    }
    if (path === '/about-us') {
      return pathname === '/about-us';
    }
    if (path === '/contact-us') {
      return pathname === '/contact-us';
    }
    if (path === '/stores') {
      return pathname === '/stores';
    }
    return pathname === path;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query || selectedCategory) {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (selectedCategory) params.set('category', selectedCategory);
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
    setSearchCategoryOpen(false);
  };

  return (
    <header className="w-full">
      {/* Green header with logo, navigation, search and login */}
      <div className="bg-[#16a34a] py-2 sm:py-2.5 md:py-3 px-2 sm:px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2 md:gap-3 max-w-7xl mx-auto">
          {/* Logo and Navigation Links */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 w-full lg:w-auto justify-between lg:justify-start">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-white font-bold text-lg sm:text-xl md:text-2xl hidden sm:inline" style={{ fontFamily: 'var(--font-pacifico), cursive' }}>MimeCode</span>
              <img 
                src="/Group 1171275295.svg" 
                alt="MimeCode Logo" 
                className="h-6 sm:h-7 md:h-8 lg:h-9 w-auto"
              />
            </Link>
            
            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center gap-3 lg:gap-4">
              <Link 
                href="/" 
                className={`text-white font-semibold text-xs lg:text-sm transition-colors hover:text-gray-200 ${
                  isActive('/') ? 'underline' : ''
                }`}
              >
                Home
              </Link>
              <div 
                className="relative stores-dropdown-container"
                onMouseEnter={() => setStoresDropdownOpen(true)}
                onMouseLeave={() => setStoresDropdownOpen(false)}
              >
                <Link 
                  href="/stores" 
                  className={`text-white font-semibold text-xs lg:text-sm transition-colors hover:text-gray-200 flex items-center gap-1 ${
                    isActive('/stores') ? 'underline' : ''
                  }`}
                >
                  Stores
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                
                {/* Stores Dropdown Menu - Categories First, then Stores on Hover */}
                {storesDropdownOpen && (
                  <div 
                    className="absolute top-full left-0 pt-1 bg-transparent z-50"
                    onMouseLeave={() => setHoveredCategoryId(null)}
                  >
                    <div className="bg-white border border-gray-300 rounded-lg shadow-lg flex min-w-[500px] max-h-[500px]">
                      {/* Categories Column */}
                      <div className="w-1/2 border-r border-gray-200 overflow-y-auto max-h-[500px]">
                        <div
                          className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm font-semibold border-b border-gray-200 cursor-pointer flex items-center gap-2 ${
                            hoveredCategoryId === 'all' ? 'bg-gray-100' : ''
                          }`}
                          onMouseEnter={() => setHoveredCategoryId('all')}
                        >
                          <span className="flex-1">All Stores</span>
                          <span className="text-xs text-gray-500">({stores.length})</span>
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        {categories.map((category) => {
                          // Only show stores that have this categoryId
                          const categoryStores = stores.filter(store => store.categoryId === category.id);
                          // Only show category if it has stores
                          if (categoryStores.length === 0) return null;
                          
                          return (
                            <div
                              key={category.id}
                              className={`px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm cursor-pointer flex items-center gap-2 ${
                                hoveredCategoryId === category.id ? 'bg-gray-100' : ''
                              }`}
                              onMouseEnter={() => setHoveredCategoryId(category.id || null)}
                            >
                              {category.logoUrl && (
                                <img 
                                  src={category.logoUrl} 
                                  alt={category.name} 
                                  className="w-5 h-5 object-contain flex-shrink-0" 
                                />
                              )}
                              <span className="flex-1">{category.name}</span>
                              <span className="text-xs text-gray-500">({categoryStores.length})</span>
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Stores Column - Shows stores for hovered category or all stores */}
                      <div className="w-1/2 overflow-y-auto max-h-[500px]">
                        {hoveredCategoryId === 'all' ? (
                          <>
                            <div className="px-4 py-2 text-gray-700 text-sm font-semibold border-b border-gray-200 bg-gray-50 sticky top-0">
                              All Stores ({stores.length})
                            </div>
                            {stores.slice(0, 30).map((store) => (
                              <Link
                                key={store.id}
                                href={`/stores/${store.slug || store.id}`}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                                onClick={() => setStoresDropdownOpen(false)}
                              >
                                {store.logoUrl && (
                                  <img 
                                    src={store.logoUrl} 
                                    alt={store.name} 
                                    className="w-5 h-5 object-contain flex-shrink-0" 
                                  />
                                )}
                                <span className="truncate">{store.name}</span>
                              </Link>
                            ))}
                            {stores.length > 30 && (
                              <Link
                                href="/stores"
                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm font-semibold text-center border-t border-gray-200"
                                onClick={() => setStoresDropdownOpen(false)}
                              >
                                View All Stores →
                              </Link>
                            )}
                          </>
                        ) : hoveredCategoryId ? (
                          <>
                            <div className="px-4 py-2 text-gray-700 text-sm font-semibold border-b border-gray-200 bg-gray-50 sticky top-0">
                              {categories.find(c => c.id === hoveredCategoryId)?.name || 'Stores'}
                            </div>
                            {stores
                              .filter(store => store.categoryId === hoveredCategoryId)
                              .slice(0, 30)
                              .map((store) => (
                                <Link
                                  key={store.id}
                                  href={`/stores/${store.slug || store.id}`}
                                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                                  onClick={() => setStoresDropdownOpen(false)}
                                >
                                  {store.logoUrl && (
                                    <img 
                                      src={store.logoUrl} 
                                      alt={store.name} 
                                      className="w-5 h-5 object-contain flex-shrink-0" 
                                    />
                                  )}
                                  <span className="truncate">{store.name}</span>
                                </Link>
                              ))}
                            {stores.filter(store => store.categoryId === hoveredCategoryId).length === 0 && (
                              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                No stores in this category
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-500 text-sm">
                            Hover over "All Stores" or a category to see stores
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Link 
                href="/categories" 
                className={`text-white font-semibold text-xs lg:text-sm transition-colors hover:text-gray-200 ${
                  isActive('/categories') ? 'underline' : ''
                }`}
              >
                Categories
              </Link>
              <Link 
                href="/contact-us" 
                className={`text-white font-semibold text-xs lg:text-sm transition-colors hover:text-gray-200 ${
                  isActive('/contact-us') ? 'underline' : ''
                }`}
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* Search Bar - Center */}
          <form onSubmit={handleSearch} className="flex items-center bg-white rounded-lg shadow px-2 sm:px-3 py-1 sm:py-1.5 w-full lg:w-auto lg:max-w-md lg:flex-1 lg:mx-4">
            <div className="relative category-dropdown-container">
              <button
                type="button"
                className={`flex items-center px-2 sm:px-3 py-1 text-gray-700 font-semibold text-xs sm:text-sm focus:outline-none transition-colors ${
                  selectedCategory ? 'text-[#16a34a] bg-[#16a34a]/10' : ''
                }`}
                onClick={() => setSearchCategoryOpen((v) => !v)}
              >
                <span className="hidden sm:inline">
                  {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name || 'Category' : 'Category'}
                </span>
                <span className="sm:hidden">
                  {selectedCategory ? '✓' : 'Cat'}
                </span>
                <svg className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Category Dropdown */}
              {searchCategoryOpen && (
                <div className="absolute left-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[180px] max-h-[300px] overflow-y-auto">
                  <div 
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => handleCategorySelect('')}
                  >
                    <span className={selectedCategory === '' ? 'font-semibold text-[#16a34a]' : ''}>All Categories</span>
                  </div>
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
                      onClick={() => handleCategorySelect(category.id || '')}
                    >
                      {category.logoUrl && (
                        <img src={category.logoUrl} alt={category.name} className="w-5 h-5 object-contain" />
                      )}
                      <span className={selectedCategory === category.id ? 'font-semibold text-[#16a34a]' : ''}>
                        {category.name}
                      </span>
                      {selectedCategory === category.id && (
                        <svg className="w-4 h-4 text-[#16a34a] ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <svg className="w-4 h-4 text-gray-400 ml-1 sm:ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search on MimeCode"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-2 sm:px-3 py-1 border-none outline-none bg-transparent text-gray-700 text-xs sm:text-sm min-w-0"
            />
          </form>

          {/* Login Button - Right */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end lg:justify-start">
            <Link
              href="/contact-us"
              className="text-white font-semibold text-xs sm:text-sm hover:text-gray-200 transition-colors whitespace-nowrap"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation - Only show on mobile */}
      <nav className="bg-white border-b border-gray-200 md:hidden">
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="flex items-center justify-between px-2 sm:px-4 max-w-7xl mx-auto">
          {/* Mobile Navigation - Horizontal Scrollable with Icons */}
          <div className="flex items-center justify-between w-full gap-2">
            {/* Navigation Links - Scrollable */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-max">
                <Link 
                  href="/" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/') 
                      ? 'text-[#16a34a] bg-[#16a34a]/10 border-b-2 border-[#16a34a]' 
                      : 'text-gray-700 hover:text-[#16a34a] hover:bg-[#16a34a]/10'
                  }`}
                >
                  Home
                </Link>
                <Link 
                  href="/categories" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/categories') 
                      ? 'text-[#16a34a] bg-[#16a34a]/10 border-b-2 border-[#16a34a]' 
                      : 'text-gray-700 hover:text-[#16a34a] hover:bg-[#16a34a]/10'
                  }`}
                >
                  Categories
                </Link>
                <Link 
                  href="/stores" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/stores') 
                      ? 'text-[#16a34a] bg-[#16a34a]/10 border-b-2 border-[#16a34a]' 
                      : 'text-gray-700 hover:text-[#16a34a] hover:bg-[#16a34a]/10'
                  }`}
                >
                  Stores
                </Link>
                <Link 
                  href="/faqs" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/faqs') 
                      ? 'text-[#16a34a] bg-[#16a34a]/10 border-b-2 border-[#16a34a]' 
                      : 'text-gray-700 hover:text-[#16a34a] hover:bg-[#16a34a]/10'
                  }`}
                >
                  FAQs
                </Link>
                <Link 
                  href="/about-us" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/about-us') 
                      ? 'text-[#16a34a] bg-[#16a34a]/10 border-b-2 border-[#16a34a]' 
                      : 'text-gray-700 hover:text-[#16a34a] hover:bg-[#16a34a]/10'
                  }`}
                >
                  About Us
                </Link>
                <Link 
                  href="/contact-us" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/contact-us') 
                      ? 'text-[#16a34a] bg-[#16a34a]/10 border-b-2 border-[#16a34a]' 
                      : 'text-gray-700 hover:text-[#16a34a] hover:bg-[#16a34a]/10'
                  }`}
                >
                  Contact Us
                </Link>
              </div>
            </div>
            
            {/* Mobile Icons - Fixed on Right */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Notifications */}
              <Link
                href="/notifications"
                className="relative flex items-center justify-center w-9 h-9 text-gray-700 hover:text-[#16a34a] hover:bg-[#16a34a]/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {notificationsCount > 9 ? '9+' : notificationsCount}
                  </span>
                )}
              </Link>
              
              {/* Favorites */}
              <Link
                href="/favorites"
                className="relative flex items-center justify-center w-9 h-9 text-gray-700 hover:text-[#16a34a] hover:bg-[#16a34a]/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {favoritesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#16a34a] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
