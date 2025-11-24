"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCategories, Category } from "@/lib/services/categoryService";
import { getFavoritesCount } from "@/lib/services/favoritesService";
import { getUnreadCount, getNotifications, initializeSampleNotifications } from "@/lib/services/notificationsService";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchCategoryOpen, setSearchCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
    
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown-container')) {
        setSearchCategoryOpen(false);
      }
    };

    if (searchCategoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [searchCategoryOpen]);

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
      {/* Black header with logo and search */}
      <div className="bg-black py-3 sm:py-4 md:py-6 px-2 sm:px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center ml-2 md:ml-4">
            <img 
              src="/Asset 7@3x 2.svg" 
              alt="Avail Coupon Code Logo" 
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto"
            />
          </Link>
          <form onSubmit={handleSearch} className="flex items-center bg-white rounded-lg shadow px-1 sm:px-2 py-1 w-full md:w-auto md:max-w-lg">
            <div className="relative category-dropdown-container">
              <button
                type="button"
                className={`flex items-center px-2 sm:px-4 py-2 text-gray-700 font-semibold text-xs sm:text-sm focus:outline-none transition-colors ${
                  selectedCategory ? 'text-orange-600 bg-orange-50' : ''
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
                    <span className={selectedCategory === '' ? 'font-semibold text-orange-600' : ''}>All Categories</span>
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
                      <span className={selectedCategory === category.id ? 'font-semibold text-orange-600' : ''}>
                        {category.name}
                      </span>
                      {selectedCategory === category.id && (
                        <svg className="w-4 h-4 text-orange-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Search coupons, stores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-2 sm:px-4 py-2 border-none outline-none bg-transparent text-gray-700 text-sm sm:text-base min-w-0"
            />
            <button
              type="submit"
              className="bg-orange-500 text-white font-semibold px-3 sm:px-6 py-2 rounded-lg ml-1 sm:ml-2 hover:bg-orange-600 text-xs sm:text-sm whitespace-nowrap transition-colors"
            >
              <span className="hidden sm:inline">Search</span>
              <span className="sm:hidden">🔍</span>
            </button>
          </form>
        </div>
      </div>
      
      {/* White nav bar with links and icons */}
      <nav className="bg-white border-b border-gray-200">
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
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            <Link 
              href="/" 
              className={`font-semibold py-4 transition-colors ${
                isActive('/') 
                  ? 'text-pink-600 border-b-2 border-pink-600' 
                  : 'text-gray-700 hover:text-pink-600'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/categories" 
              className={`font-semibold py-4 transition-colors ${
                isActive('/categories') 
                  ? 'text-pink-600 border-b-2 border-pink-600' 
                  : 'text-gray-700 hover:text-pink-600'
              }`}
            >
              Categories
            </Link>
            <Link 
              href="/stores" 
              className={`font-semibold py-4 transition-colors ${
                isActive('/stores') 
                  ? 'text-pink-600 border-b-2 border-pink-600' 
                  : 'text-gray-700 hover:text-pink-600'
              }`}
            >
              Stores
            </Link>
            <Link 
              href="/faqs" 
              className={`font-semibold py-4 transition-colors ${
                isActive('/faqs') 
                  ? 'text-pink-600 border-b-2 border-pink-600' 
                  : 'text-gray-700 hover:text-pink-600'
              }`}
            >
              FAQs
            </Link>
            <Link 
              href="/about-us" 
              className={`font-semibold py-4 transition-colors ${
                isActive('/about-us') 
                  ? 'text-pink-600 border-b-2 border-pink-600' 
                  : 'text-gray-700 hover:text-pink-600'
              }`}
            >
              About Us
            </Link>
            <Link 
              href="/contact-us" 
              className={`font-semibold py-4 transition-colors ${
                isActive('/contact-us') 
                  ? 'text-pink-600 border-b-2 border-pink-600' 
                  : 'text-gray-700 hover:text-pink-600'
              }`}
            >
              Contact Us
            </Link>
          </div>

          {/* Mobile Navigation - Horizontal Scrollable with Icons */}
          <div className="lg:hidden flex items-center justify-between w-full gap-2">
            {/* Navigation Links - Scrollable */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-max">
                <Link 
                  href="/" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/') 
                      ? 'text-pink-600 bg-pink-50 border-b-2 border-pink-600' 
                      : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Home
                </Link>
                <Link 
                  href="/categories" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/categories') 
                      ? 'text-pink-600 bg-pink-50 border-b-2 border-pink-600' 
                      : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Categories
                </Link>
                <Link 
                  href="/stores" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/stores') 
                      ? 'text-pink-600 bg-pink-50 border-b-2 border-pink-600' 
                      : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Stores
                </Link>
                <Link 
                  href="/faqs" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/faqs') 
                      ? 'text-pink-600 bg-pink-50 border-b-2 border-pink-600' 
                      : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  FAQs
                </Link>
                <Link 
                  href="/about-us" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/about-us') 
                      ? 'text-pink-600 bg-pink-50 border-b-2 border-pink-600' 
                      : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  About Us
                </Link>
                <Link 
                  href="/contact-us" 
                  className={`font-semibold py-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-lg ${
                    isActive('/contact-us') 
                      ? 'text-pink-600 bg-pink-50 border-b-2 border-pink-600' 
                      : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50'
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
                className="relative flex items-center justify-center w-9 h-9 text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-colors"
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
                className="relative flex items-center justify-center w-9 h-9 text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {favoritesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-pink-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </span>
                )}
              </Link>
              
            </div>
          </div>

          {/* Desktop Icons */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-5">
            {/* Notifications */}
            <div className="relative">
              <Link
                href="/notifications"
                className="relative block text-gray-700 hover:text-pink-600 cursor-pointer transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notificationsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {notificationsCount > 9 ? '9+' : notificationsCount}
                  </span>
                )}
              </Link>
            </div>
            
            {/* Favorites */}
            <div className="relative">
              <Link
                href="/favorites"
                className="relative block text-gray-700 hover:text-pink-600 cursor-pointer transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {favoritesCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
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
