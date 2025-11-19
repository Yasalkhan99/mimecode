"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [storeOpen, setStoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchCategoryOpen, setSearchCategoryOpen] = useState(false);
  
  const isActive = (path: string) => {
    if (path === '/categories') {
      // Match /categories and /categories/[id]
      return pathname === '/categories' || pathname?.startsWith('/categories/');
    }
    if (path === '/about-us') {
      return pathname === '/about-us';
    }
    return pathname === path;
  };

  return (
    <header className="w-full">
      {/* Black header with logo and search */}
      <div className="bg-black py-3 sm:py-4 md:py-6 px-2 sm:px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center ml-2 md:ml-4">
            <img 
              src="/Asset 2@2x 2.svg" 
              alt="Avail Coupon Code Logo" 
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto"
            />
          </Link>
          <form className="flex items-center bg-white rounded-lg shadow px-1 sm:px-2 py-1 w-full md:w-auto md:max-w-lg">
            <div className="relative">
              <button
                type="button"
                className="flex items-center px-2 sm:px-4 py-2 text-gray-700 font-semibold text-xs sm:text-sm focus:outline-none"
                onClick={() => setSearchCategoryOpen((v) => !v)}
              >
                <span className="hidden sm:inline">Category</span>
                <span className="sm:hidden">Cat</span>
                <svg className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Dropdown (placeholder) */}
              {searchCategoryOpen && (
                <div className="absolute left-0 top-full mt-1 bg-white border rounded shadow z-20 min-w-[120px]">
                  <div className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">Category 1</div>
                  <div className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">Category 2</div>
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Search here..."
              className="flex-1 px-2 sm:px-4 py-2 border-none outline-none bg-transparent text-gray-700 text-sm sm:text-base min-w-0"
            />
            <button
              type="submit"
              className="bg-orange-500 text-white font-semibold px-3 sm:px-6 py-2 rounded-lg ml-1 sm:ml-2 hover:bg-orange-600 text-xs sm:text-sm whitespace-nowrap"
            >
              <span className="hidden sm:inline">Search</span>
              <span className="sm:hidden">🔍</span>
            </button>
          </form>
        </div>
      </div>
      
      {/* White nav bar with links and icons */}
      <nav className="bg-white border-b border-gray-200">
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
            <div className="relative">
              <button
                type="button"
                className="text-gray-700 font-semibold py-4 flex items-center hover:text-pink-600 transition-colors"
                onClick={() => setStoreOpen((v) => !v)}
              >
                Stores
              </button>
              {storeOpen && (
                <div className="absolute left-0 top-full bg-white border rounded shadow z-20 min-w-[150px]">
                  <div className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">Store 1</div>
                  <div className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">Store 2</div>
                </div>
              )}
            </div>
            <Link href="#" className="text-gray-700 font-semibold py-4 hover:text-pink-600 transition-colors">FAQs</Link>
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
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="lg:hidden flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className={`font-semibold py-3 px-2 text-sm transition-colors ${
                  isActive('/') 
                    ? 'text-pink-600 border-b-2 border-pink-600' 
                    : 'text-gray-700 hover:text-pink-600'
                }`}
              >
                Home
              </Link>
              <Link 
                href="/categories" 
                className={`font-semibold py-3 px-2 text-sm transition-colors ${
                  isActive('/categories') 
                    ? 'text-pink-600 border-b-2 border-pink-600' 
                    : 'text-gray-700 hover:text-pink-600'
                }`}
              >
                Categories
              </Link>
            </div>
            <button
              type="button"
              className="p-2 text-gray-700 hover:text-pink-600 transition-colors"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Desktop Icons */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            <svg className="w-5 h-5 xl:w-6 xl:h-6 text-gray-700 hover:text-pink-600 cursor-pointer transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <svg className="w-5 h-5 xl:w-6 xl:h-6 text-gray-700 hover:text-pink-600 cursor-pointer transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <svg className="w-5 h-5 xl:w-6 xl:h-6 text-gray-700 hover:text-pink-600 cursor-pointer transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-3">
              <Link 
                href="/categories" 
                className={`block font-semibold py-2 transition-colors ${
                  isActive('/categories') 
                    ? 'text-pink-600 border-b-2 border-pink-600' 
                    : 'text-gray-700 hover:text-pink-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Categories
              </Link>
              <div className="relative">
                <button
                  type="button"
                  className="w-full text-left text-gray-700 font-semibold py-2 flex items-center justify-between hover:text-pink-600 transition-colors"
                  onClick={() => setStoreOpen((v) => !v)}
                >
                  Stores
                </button>
                {storeOpen && (
                  <div className="mt-2 pl-4 space-y-2">
                    <div className="px-4 py-2 text-gray-600 hover:text-pink-600 cursor-pointer">Store 1</div>
                    <div className="px-4 py-2 text-gray-600 hover:text-pink-600 cursor-pointer">Store 2</div>
                  </div>
                )}
              </div>
              <Link href="#" className="block text-gray-700 font-semibold py-2 hover:text-pink-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>FAQs</Link>
              <Link 
                href="/about-us" 
                className={`block font-semibold py-2 transition-colors ${
                  isActive('/about-us') 
                    ? 'text-pink-600 border-b-2 border-pink-600' 
                    : 'text-gray-700 hover:text-pink-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
