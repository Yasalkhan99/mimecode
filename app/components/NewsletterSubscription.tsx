'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function NewsletterSubscription() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Successfully subscribed! Check your inbox.' });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong. Please try again.' });
      }
    } catch (error: any) {
      console.error('Error submitting newsletter:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // <div className="w-full bg-white pt-6 sm:pt-8 md:pt-12 lg:pt-16 pb-4 sm:pb-6 md:pb-8">
    //   <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
    //     <motion.div
    //       initial={{ opacity: 0, y: 20 }}
    //       whileInView={{ opacity: 1, y: 0 }}
    //       viewport={{ once: true }}
    //       transition={{ duration: 0.6 }}
    //       className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm"
    //     >
    //       {/* Header Bar */}
    //       <div className="bg-[#16a34a] py-3 px-4 text-center">
    //         <h3 className="text-white font-bold text-sm sm:text-base">Daily Exclusive Deals</h3>
    //       </div>

    //       {/* Content Area */}
    //       <div className="p-6 md:p-8">
    //         <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6">
    //           Get <span className="text-[#16a34a]">Exclusive Coupons</span> and <span className="text-[#16a34a]">Best Deals</span> Delivered to Your Inbox
    //         </h2>

    //         <form
    //           onSubmit={handleSubmit}
    //           className="flex flex-col sm:flex-row gap-3 mb-4"
    //         >
    //           <input
    //             type="email"
    //             placeholder="Email Address"
    //             value={email}
    //             onChange={(e) => setEmail(e.target.value)}
    //             className="flex-1 px-4 py-3 border border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] text-gray-900 placeholder-gray-500"
    //             disabled={isSubmitting}
    //             required
    //           />
    //           <button
    //             type="submit"
    //             disabled={isSubmitting}
    //             className="bg-[#16a34a] hover:bg-[#15803d] text-white font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    //           >
    //             {isSubmitting ? 'Subscribing...' : 'Unlock Deals'}
    //           </button>
    //         </form>

    //         {/* Disclaimer Text */}
    //         <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
    //           By clicking unlock deals you confirm that you are 16 years of age or older and you agree to our{' '}
    //           <Link href="/terms-and-conditions" className="underline hover:text-gray-900">
    //             Terms of Service
    //           </Link>
    //           {' '}and{' '}
    //           <Link href="/privacy-policy" className="underline hover:text-gray-900">
    //             Privacy Policy
    //           </Link>
    //           . You may unsubscribe at any time.
    //         </p>

    //         {message && (
    //           <motion.div
    //             initial={{ opacity: 0, y: -10 }}
    //             animate={{ opacity: 1, y: 0 }}
    //             className={`mt-4 px-4 py-3 rounded-lg ${
    //               message.type === 'success'
    //                 ? 'bg-green-50 border border-green-200 text-green-700'
    //                 : 'bg-red-50 border border-red-200 text-red-700'
    //             }`}
    //           >
    //             <div className="flex items-center gap-2">
    //               {message.type === 'success' ? (
    //                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    //                 </svg>
    //               ) : (
    //                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    //                 </svg>
    //               )}
    //               <span className="text-sm font-medium">{message.text}</span>
    //             </div>
    //           </motion.div>
    //         )}
    //       </div>
    //     </motion.div>
    //   </div>
    // </div>
    <div className="pb-12 relative bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white overflow-hidden"
        >
          {/* Header Bar */}
          <div className="py-3 px-4 text-center">
            <h3 className="text-black font-bold sm:text-base flex items-center justify-center gap-2"><span className="text-[40px]">Daily</span> <Image src="/exclusion.png" className="w-30" alt="Featured Deals" width={100} height={100} /> <span className="text-[40px]">Deals</span></h3>
          </div>

          {/* Content Area */}
          <div className="">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
              Get Exclusive Coupons & <br /> Best Deals Delivered to Your Inbox
            </h2>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 mb-4 border-1 border-[#D0D0D0] rounded-full p-1"
            >
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 focus:outline-none focus:none text-black placeholder-gray-500"
                disabled={isSubmitting}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer bg-[#FFE019] text-black font-bold text-[14px] px-6 py-0 rounded-3xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSubmitting ? 'Subscribing...' : 'Unlock Deals'}
              </button>
            </form>

            {/* Disclaimer Text */}
            <p className="text-[12px] text-black leading-relaxed">
              By clicking unlock deals you confirm that you are 16 years of age or older and you agree to our{' '}
              <Link href="/terms-of-service" className="underline hover:text-gray-900">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy-policy" className="underline hover:text-gray-900">
                Privacy Policy
              </Link>
              . You may unsubscribe at any time.
            </p>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 px-4 py-3 rounded-lg ${message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
              >
                <div className="flex items-center gap-2">
                  {message.type === 'success' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">{message.text}</span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

