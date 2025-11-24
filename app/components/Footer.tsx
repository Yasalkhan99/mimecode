'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative w-full bg-[#1a1a1a] text-white overflow-x-hidden mt-0 sm:-mt-20 md:-mt-8 animate-fade-in-up">
      {/* Background Pattern SVG */}
      <div className="absolute inset-0 opacity-50">
        <img 
          src="/Group 1171275050.svg" 
          alt="Footer Pattern" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 w-full">
        {/* Logo */}
        <div className="flex justify-center mb-6 sm:mb-8 md:mb-10 animate-scale-in">
          <img 
            src="/Asset 7@3x 2.svg" 
            alt="Avail Coupon Code Logo" 
            className="h-12 sm:h-16 md:h-20 w-auto"
          />
        </div>

        {/* Decorative Elements */}
        {/* Left Side - 3D Cube Outline */}
        <div className="absolute left-4 bottom-20 opacity-15 pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 20 L60 10 L100 20 L100 60 L60 70 L20 60 Z" stroke="#999" strokeWidth="1.5" fill="none" />
            <path d="M60 10 L60 50" stroke="#999" strokeWidth="1.5" />
            <path d="M100 20 L100 60" stroke="#999" strokeWidth="1.5" />
            <path d="M60 50 L100 60" stroke="#999" strokeWidth="1.5" />
            <path d="M60 50 L60 70" stroke="#999" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Bottom Right - Diagonal Lines Pattern */}
        <div className="absolute bottom-8 right-4 opacity-15 pointer-events-none">
          <svg width="150" height="100" viewBox="0 0 150 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="20" x2="150" y2="0" stroke="#999" strokeWidth="1" />
            <line x1="0" y1="40" x2="150" y2="20" stroke="#999" strokeWidth="1" />
            <line x1="0" y1="60" x2="150" y2="40" stroke="#999" strokeWidth="1" />
            <line x1="0" y1="80" x2="150" y2="60" stroke="#999" strokeWidth="1" />
            <line x1="0" y1="100" x2="150" y2="80" stroke="#999" strokeWidth="1" />
          </svg>
        </div>

        {/* Copyright and Legal Links */}
        <div className="relative z-10 pt-6 sm:pt-8 border-t border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-4">
            <Link 
              href="/privacy-policy"
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="hidden sm:inline text-gray-600">|</span>
            <Link 
              href="/terms-and-conditions"
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
            >
              Terms and Conditions
            </Link>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-800 rounded flex items-center justify-center">
              <span className="text-white text-xs sm:text-sm font-bold">N</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400">©2025 Avail Coupon Code. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

