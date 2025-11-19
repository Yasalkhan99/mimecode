'use client';

import { useState } from 'react';

export default function NewsletterSubscription() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }
    
    setIsSubmitting(true);
    // TODO: Add newsletter subscription API call here
    setTimeout(() => {
      alert('Thank you for subscribing!');
      setEmail('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="w-full bg-white pt-6 sm:pt-8 md:pt-12 lg:pt-16 pb-4 sm:pb-6 md:pb-8 relative animate-fade-in-up">
      <div 
        className="relative w-full"
        style={{ 
          height: '160px', 
          background: 'linear-gradient(135deg, rgba(255, 148, 61, 0.2) 0%, rgba(244, 117, 79, 0.15) 100%)'
        }}
      >
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Golden circles */}
          <div className="absolute top-3 left-8 w-3 h-3 bg-yellow-400 rounded-full opacity-60"></div>
          <div className="absolute top-6 left-20 w-2 h-2 bg-yellow-400 rounded-full opacity-50"></div>
          <div className="absolute top-4 right-32 w-2.5 h-2.5 bg-yellow-400 rounded-full opacity-60"></div>
          
          {/* Decorative arcs and dots pattern */}
          <div className="absolute top-0 right-0 w-48 h-full opacity-20">
            <div className="w-full h-full relative">
              {/* Concentric arcs */}
              <svg className="absolute top-3 right-8" width="50" height="50" viewBox="0 0 50 50">
                <path d="M7,25 Q25,7 43,25" stroke="#ff6b35" strokeWidth="1.5" fill="none" opacity="0.6"/>
                <path d="M9,25 Q25,9 41,25" stroke="#ff6b35" strokeWidth="1.5" fill="none" opacity="0.4"/>
              </svg>
              {/* Grid of dots */}
              <div className="absolute top-10 right-10 grid grid-cols-4 gap-1">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-orange-300 rounded-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full h-full px-4 sm:px-6 md:px-8 lg:px-12 relative z-10 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8">
          {/* Text Content - Mobile: centered, Desktop: left aligned */}
          <div className="flex flex-col justify-center text-center md:text-left animate-slide-in-left w-full md:w-auto">
            <h2 
              className="mb-1"
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(18px, 4vw, 24px)',
                lineHeight: '1.2',
                color: '#303030',
                textTransform: 'none',
              }}
            >
              Subscribe Our Newsletter To Get The Best
            </h2>
            <p 
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(18px, 4vw, 24px)',
                lineHeight: '1.2',
                color: '#303030',
                textTransform: 'none',
              }}
            >
              Deals Right In Your Email
            </p>
          </div>

          {/* Email Form - Mobile: stacked, Desktop: side by side */}
          <div className="flex-shrink-0 w-full md:w-auto animate-slide-in-right">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 sm:gap-3 w-full md:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email..."
                className="w-full md:w-64 px-4 sm:px-5 py-3 md:py-2.5 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400 text-sm"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 md:py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-sm w-full md:w-auto"
              >
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Left Side Illustration - Golden Bell (Half above, half inside) - Behind text */}
        <div 
          className="hidden sm:block absolute left-8 pointer-events-none"
          style={{
            top: '80px', // Half above section (160px / 2 = 80px)
            width: '144px', // w-36 = 144px
            height: '160px', // Full section height
            zIndex: 1,
          }}
        >
          <img
            src="/Image.svg"
            alt="Bell illustration"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Right Side Illustration - Documents and Envelope (Half above, half inside) */}
        <div 
          className="hidden sm:block absolute right-8 pointer-events-none"
          style={{
            top: '-80px', // Half above section (160px / 2 = 80px)
            width: '144px', // w-36 = 144px
            height: '160px', // Full section height
            zIndex: 1,
          }}
        >
          <img
            src="/Image (1).svg"
            alt="Newsletter illustration"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}

