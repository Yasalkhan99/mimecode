"use client";

import Link from "next/link";
import LocalizedLink from "./LocalizedLink";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCategories, Category } from "@/lib/services/categoryService";
import { getStores, Store } from "@/lib/services/storeService";
import { getFavoritesCount } from "@/lib/services/favoritesService";
import { getUnreadCount, getNotifications, initializeSampleNotifications } from "@/lib/services/notificationsService";
import { useAuth } from "@/lib/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getEvents } from "@/lib/services/eventService";
import { getPageSettings } from "@/lib/services/pageSettingsService";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { getLocalizedPath } = useLanguage();
  const { t } = useTranslation();
  const [searchCategoryOpen, setSearchCategoryOpen] = useState(false);
  const [storesDropdownOpen, setStoresDropdownOpen] = useState(false);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasEvents, setHasEvents] = useState(false);
  const [eventsNavLabel, setEventsNavLabel] = useState('Events');
  const [eventsSlug, setEventsSlug] = useState('events');

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, storesData, eventsData, pageSettings] = await Promise.all([
          getCategories(),
          getStores(),
          getEvents(),
          getPageSettings()
        ]);
        setCategories(categoriesData);
        setStores(storesData);
        setHasEvents(eventsData.length > 0);
        
        // Set page settings for dynamic labels and slugs
        if (pageSettings) {
          setEventsNavLabel(pageSettings.eventsNavLabel || 'Events');
          setEventsSlug(pageSettings.eventsSlug || 'events');
        }
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

  // Filter stores based on search query - only show stores starting with the search query
  const filteredStores = stores.filter(store => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase().trim();
    return store.name.toLowerCase().startsWith(query);
  }).slice(0, 10); // Limit to 10 results

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
      if (!target.closest('.search-results-container')) {
        setShowSearchResults(false);
      }
    };

    if (searchCategoryOpen || storesDropdownOpen || showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [searchCategoryOpen, storesDropdownOpen, showSearchResults]);

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
    // If there's exactly one matching store, navigate to it
    if (filteredStores.length === 1) {
      const storePath = `/stores/${filteredStores[0].slug || filteredStores[0].id}`;
      router.push(getLocalizedPath(storePath));
      setShowSearchResults(false);
      setSearchQuery('');
      return;
    }
    // Otherwise, navigate to search page
    if (query || selectedCategory) {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (selectedCategory) params.set('category', selectedCategory);
      const searchPath = `/search?${params.toString()}`;
      router.push(getLocalizedPath(searchPath));
      setShowSearchResults(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
    setSearchCategoryOpen(false);
  };

  return (
    <header className="w-full bg-white shadow-sm">
      {/* Top bar with logo, search, and auth buttons */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <img 
                src="/Group 1171275050 (1).svg" 
                alt="HB Mime Code Logo" 
                className="h-10 sm:h-12 md:h-14 w-auto"
              />
            </Link>

            {/* Search Bar - Center */}
            <div className="flex-1 max-w-2xl mx-4 hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search here..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FFE019] focus:border-transparent"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#FFE019] rounded-full p-1.5 hover:bg-yellow-400 transition">
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchQuery && filteredStores.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50 search-results-container">
                    {filteredStores.map((store) => (
                      <LocalizedLink
                        key={store.id}
                        href={`/stores/${store.slug || store.id}`}
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        {store.logoUrl && (
                          <img 
                            src={store.logoUrl} 
                            alt={store.name} 
                            className="w-10 h-10 object-contain flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{store.name}</div>
                          {store.description && (
                            <div className="text-xs text-gray-600 line-clamp-1">{store.description}</div>
                          )}
                        </div>
                      </LocalizedLink>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  {user.role !== 'admin' && (
                    <Link
                      href="/dashboard"
                      className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 font-semibold text-sm hover:bg-gray-50 transition whitespace-nowrap"
                    >
                      {t('myDashboard')}
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      href="/admin/dashboard"
                      className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 font-semibold text-sm hover:bg-gray-50 transition whitespace-nowrap"
                    >
                      {t('adminPanel')}
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 font-semibold text-sm hover:bg-gray-50 transition whitespace-nowrap"
                  >
                    {t('signOut')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 font-semibold text-sm hover:bg-gray-50 transition whitespace-nowrap"
                  >
                    {t('signIn')}
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-[#FFE019] rounded-full text-gray-900 font-semibold text-sm hover:bg-yellow-400 transition whitespace-nowrap"
                  >
                    {t('signUp')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 py-3">
            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center gap-6">
              <Link 
                href="/" 
                className={`px-4 py-2 font-semibold text-sm transition-colors ${
                  isActive('/') 
                    ? 'bg-[#FFE019] text-gray-900 rounded-full' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {t('home')}
              </Link>
              <div 
                className="relative stores-dropdown-container"
                onMouseEnter={() => setStoresDropdownOpen(true)}
                onMouseLeave={() => setStoresDropdownOpen(false)}
              >
                <LocalizedLink 
                  href="/stores" 
                  className={`px-4 py-2 font-semibold text-sm transition-colors flex items-center gap-1 ${
                    isActive('/stores') 
                      ? 'bg-[#FFE019] text-gray-900 rounded-full' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {t('stores')}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </LocalizedLink>
                
                {/* Stores Dropdown Menu - Categories First, then Stores on Hover */}
                {storesDropdownOpen && (
                  <div 
                    className="absolute top-full left-0 pt-1 bg-transparent z-50"
                    onMouseLeave={() => {
                      setHoveredCategoryId(null);
                    }}
                  >
                    <div className="bg-white border border-gray-300 rounded-lg shadow-lg flex min-w-[500px] max-h-[500px]">
                      {/* Categories Column */}
                      <div className="w-1/2 border-r border-gray-200 overflow-y-auto max-h-[500px]">
                        {/* All Categories Heading */}
                        {/* <div className="px-4 py-2 text-gray-700 text-sm font-semibold border-b border-gray-200 bg-gray-50 sticky top-0">
                          All Categories
                        </div> */}
                        
                        {/* All Stores Option */}
                        <div
                          className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm cursor-pointer flex items-center gap-2 ${
                            hoveredCategoryId === 'all' ? 'bg-gray-100' : ''
                          }`}
                          onMouseEnter={() => setHoveredCategoryId('all')}
                        >
                          <span className="flex-1">All Stores</span>
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        {/* All Categories List */}
                        {categories.map((category) => {
                          // Get stores for this category
                          const categoryStores = stores.filter(store => store.categoryId === category.id);
                          
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
                              {categoryStores.length > 0 && (
                                <span className="text-xs text-gray-500">({categoryStores.length})</span>
                              )}
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
                              All Stores 
                              {/* ({stores.length}) */}
                            </div>
                            {stores.slice(0, 30).map((store) => (
                              <LocalizedLink
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
                              </LocalizedLink>
                            ))}
                            {stores.length > 30 && (
                              <LocalizedLink
                                href="/stores"
                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm font-semibold text-center border-t border-gray-200"
                                onClick={() => setStoresDropdownOpen(false)}
                              >
                                {t('viewAll')} {t('stores')} →
                              </LocalizedLink>
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
                                <LocalizedLink
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
                                </LocalizedLink>
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
              <LocalizedLink 
                href="/blogs"
                className={`px-4 py-2 font-semibold text-sm transition-colors ${
                  isActive('/blogs') 
                    ? 'bg-[#FFE019] text-gray-900 rounded-full' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {t('blogs')}
              </LocalizedLink>
              {hasEvents && (
                <LocalizedLink 
                  href={`/${eventsSlug}`}
                  className={`px-4 py-2 font-semibold text-sm transition-colors ${
                    isActive(`/${eventsSlug}`) 
                      ? 'bg-[#FFE019] text-gray-900 rounded-full' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {eventsNavLabel === 'Events' ? t('events') : eventsNavLabel === 'Christmas' ? t('christmas') : eventsNavLabel}
                </LocalizedLink>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Search Bar */}
      <div className="md:hidden border-b border-gray-200 bg-white px-4 py-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search here..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FFE019] focus:border-transparent"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#FFE019] rounded-full p-1.5">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          {/* Mobile Search Results */}
          {showSearchResults && searchQuery && filteredStores.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50 search-results-container">
              {filteredStores.map((store) => (
                <LocalizedLink
                  key={store.id}
                  href={`/stores/${store.slug || store.id}`}
                  onClick={() => {
                    setShowSearchResults(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  {store.logoUrl && (
                    <img 
                      src={store.logoUrl} 
                      alt={store.name} 
                      className="w-10 h-10 object-contain flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{store.name}</div>
                    {store.description && (
                      <div className="text-xs text-gray-600 line-clamp-1">{store.description}</div>
                    )}
                  </div>
                </LocalizedLink>
              ))}
            </div>
          )}
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
                  {t('home')}
                </Link>
                <LocalizedLink 
                  href="/categories" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/categories') 
                      ? 'text-[#16a34a] bg-[#16a34a]/10 border-b-2 border-[#16a34a]' 
                      : 'text-gray-700 hover:text-[#16a34a] hover:bg-[#16a34a]/10'
                  }`}
                >
                  {t('categories')}
                </LocalizedLink>
                <LocalizedLink 
                  href="/stores" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/stores') 
                      ? 'text-[#16a34a] bg-[#16a34a]/10 border-b-2 border-[#16a34a]' 
                      : 'text-gray-700 hover:text-[#16a34a] hover:bg-[#16a34a]/10'
                  }`}
                >
                  {t('stores')}
                </LocalizedLink>
                <LocalizedLink 
                  href="/faqs" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/faqs') 
                      ? 'text-[#16a34a] bg-[#16a34a]/10 border-b-2 border-[#16a34a]' 
                      : 'text-gray-700 hover:text-[#16a34a] hover:bg-[#16a34a]/10'
                  }`}
                >
                  {t('faqs')}
                </LocalizedLink>
                <LocalizedLink 
                  href="/about-us" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/about-us') 
                      ? 'text-[#16a34a] bg-[#16a34a]/10 border-b-2 border-[#16a34a]' 
                      : 'text-gray-700 hover:text-[#16a34a] hover:bg-[#16a34a]/10'
                  }`}
                >
                  {t('aboutUs')}
                </LocalizedLink>
                <LocalizedLink 
                  href="/contact-us" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/contact-us') 
                      ? 'text-[#16a34a] bg-[#16a34a]/10 border-b-2 border-[#16a34a]' 
                      : 'text-gray-700 hover:text-[#16a34a] hover:bg-[#16a34a]/10'
                  }`}
                >
                  {t('contactUs')}
                </LocalizedLink>
                {hasEvents && (
                  <LocalizedLink 
                    href="/events" 
                    className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                      isActive('/events') 
                        ? 'text-[#16a34a] bg-[#16a34a]/10 border-b-2 border-[#16a34a]' 
                        : 'text-gray-700 hover:text-[#16a34a] hover:bg-[#16a34a]/10'
                    }`}
                  >
                    {eventsNavLabel === 'Events' ? t('events') : eventsNavLabel === 'Christmas' ? t('christmas') : eventsNavLabel || t('events')}
                  </LocalizedLink>
                )}
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
