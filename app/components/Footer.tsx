'use client';

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
            src="/Asset 2@2x 2.svg" 
            alt="Avail Coupon Code Logo" 
            className="h-12 sm:h-16 md:h-20 w-auto"
          />
        </div>

        {/* Navigation Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12">
          {/* Column 1 - Offers */}
          <div className="animate-fade-in animate-delay-1">
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white">Offers</h3>
            <ul className="space-y-2 sm:space-y-2.5">
              {[
                'Banking Offers',
                'Babies Offers',
                'Business Offers',
                'Books Offers',
                'Beauty Offers'
              ].map((item, index) => (
                <li key={item}>
                  <a
                    href="#"
                    className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm text-gray-300 hover:text-white transition-colors rounded ${
                      index === 0 ? 'border border-blue-500' : 'border border-transparent hover:border-blue-500'
                    }`}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 - Saving Tips */}
          <div className="animate-fade-in animate-delay-2">
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white">Saving Tips</h3>
            <ul className="space-y-2 sm:space-y-2.5">
              {[
                'Clothing Offers',
                'Children Offers',
                'Car Offers',
                'Camping & Hiking Offer',
                'Bath & Body Offers'
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm text-gray-300 hover:text-white transition-colors border border-transparent hover:border-blue-500 rounded"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Holidays */}
          <div className="animate-fade-in animate-delay-3">
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white">Holidays</h3>
            <ul className="space-y-2 sm:space-y-2.5">
              {[
                'Electronic Toys Offers',
                'Electronic Games Offers',
                'Education Offers',
                'Domain Offers',
                'Department Offers'
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm text-gray-300 hover:text-white transition-colors border border-transparent hover:border-blue-500 rounded"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Deals */}
          <div className="animate-fade-in animate-delay-4">
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white">Deals</h3>
            <ul className="space-y-2 sm:space-y-2.5">
              {[
                'Entertainment Offers',
                'Flowers Offers',
                'Food Offers',
                'Fragrance Offers',
                'Furniture Offers'
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm text-gray-300 hover:text-white transition-colors border border-transparent hover:border-blue-500 rounded"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
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

        {/* Copyright */}
        <div className="flex items-center justify-center pt-6 sm:pt-8 border-t border-gray-700 relative z-10 gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-800 rounded flex items-center justify-center">
            <span className="text-white text-xs sm:text-sm font-bold">N</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">©2025 Avail Coupon Code. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}

