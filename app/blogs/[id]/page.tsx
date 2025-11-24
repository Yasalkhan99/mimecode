'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getNewsById, NewsArticle } from '@/lib/services/newsService';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Link from 'next/link';

export default function BlogDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await getNewsById(id);
        if (data) {
          setArticle(data);
          document.title = `${data.title} - AvailCoupon`;
        } else {
          document.title = 'Blog Not Found - AvailCoupon';
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        document.title = 'Error - AvailCoupon';
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const formatDate = (dateString?: string, timestamp?: any) => {
    if (dateString) return dateString;
    if (timestamp) {
      try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch {
        return null;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading article...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h1>
            <p className="text-gray-600 mb-4">The article you're looking for doesn't exist.</p>
            <Link
              href="/blogs"
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors inline-block"
            >
              Back to Blogs
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section with Image */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.className = 'w-full h-64 sm:h-80 md:h-96 lg:h-[500px] bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center';
                parent.innerHTML = '<svg class="w-24 h-24 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center">
            <svg className="w-24 h-24 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            {formatDate(article.date, article.createdAt) && (
              <div className="inline-block bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full mb-4 shadow-lg">
                {formatDate(article.date, article.createdAt)}
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              {article.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blogs" className="hover:text-orange-600 transition-colors">Blogs</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">{article.title}</span>
            </div>
          </nav>

          {/* Article Content */}
          <article className="prose prose-lg sm:prose-xl max-w-none">
            {/* Description - Show as intro if we have content */}
            {article.content && article.description && (
              <div className="mb-10 p-6 sm:p-8 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border-l-4 border-orange-500 shadow-sm">
                <p className="text-lg sm:text-xl md:text-2xl text-gray-700 leading-relaxed font-medium">
                  {article.description}
                </p>
              </div>
            )}

            {/* Full Content */}
            {article.content ? (
              <div 
                className="text-gray-700 leading-relaxed space-y-8 mb-12"
                style={{
                  fontSize: '1.125rem',
                  lineHeight: '1.875rem'
                }}
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: article.content }}
                  className="blog-content"
                />
              </div>
            ) : (
              <div className="text-gray-700 leading-relaxed space-y-10 mb-12">
                {article.description ? (
                  <div className="space-y-10">
                    {/* Introduction Section */}
                    <div className="prose prose-lg sm:prose-xl max-w-none">
                      <div className="text-xl sm:text-2xl md:text-3xl leading-relaxed mb-8 font-semibold text-gray-900">
                        {article.description}
                      </div>
                      
                      <p className="text-lg sm:text-xl leading-relaxed text-gray-700 mb-6">
                        In today's fast-paced digital world, finding the best deals and coupons has become essential for smart shoppers. This comprehensive guide will help you navigate the world of online savings and maximize your shopping experience.
                      </p>
                    </div>

                    {/* Main Content Sections */}
                    <div className="space-y-8">
                      {/* Section 1: Understanding Coupons */}
                      <div className="bg-white rounded-xl p-6 sm:p-8 md:p-10 border border-gray-200 shadow-sm">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          Understanding Modern Coupon Strategies
                        </h2>
                        <div className="space-y-4 text-lg leading-relaxed text-gray-700">
                          <p>
                            Coupons have evolved significantly from simple paper cutouts to sophisticated digital codes that can save you hundreds of dollars annually. Understanding how to effectively use coupons is the first step toward becoming a savvy shopper.
                          </p>
                          <p>
                            Modern coupon platforms like AvailCoupon offer a wide range of discounts from top retailers. These platforms aggregate the best deals, making it easier than ever to find savings on your favorite products and services.
                          </p>
                          <p>
                            The key to maximizing your savings lies in understanding different types of coupons, knowing when to use them, and combining them with other promotional offers for maximum benefit.
                          </p>
                        </div>
                      </div>

                      {/* Section 2: Key Benefits */}
                      <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 rounded-xl p-6 sm:p-8 md:p-10 border border-orange-100 shadow-sm">
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                          Key Benefits of Using Coupons
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-gray-900 mb-2">Save Money</h4>
                                <p className="text-gray-700 leading-relaxed">
                                  Reduce your shopping expenses significantly by using verified coupon codes and exclusive deals from trusted retailers.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-gray-900 mb-2">Time Efficient</h4>
                                <p className="text-gray-700 leading-relaxed">
                                  Find the best deals quickly without spending hours searching through multiple websites and promotional emails.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-gray-900 mb-2">Verified Deals</h4>
                                <p className="text-gray-700 leading-relaxed">
                                  All coupons are verified and tested to ensure they work, saving you from the frustration of invalid codes.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-gray-900 mb-2">Wide Selection</h4>
                                <p className="text-gray-700 leading-relaxed">
                                  Access thousands of coupons from hundreds of retailers across various categories and product types.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Tips and Strategies */}
                      <div className="bg-white rounded-xl p-6 sm:p-8 md:p-10 border border-gray-200 shadow-sm">
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                          Expert Tips for Maximum Savings
                        </h3>
                        <div className="space-y-6">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                              1
                            </div>
                            <div>
                              <h4 className="text-xl font-semibold text-gray-900 mb-2">Check Expiration Dates</h4>
                              <p className="text-lg text-gray-700 leading-relaxed">
                                Always verify the expiration date before using a coupon. Many deals have limited timeframes, so it's important to use them while they're still valid.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                              2
                            </div>
                            <div>
                              <h4 className="text-xl font-semibold text-gray-900 mb-2">Read Terms and Conditions</h4>
                              <p className="text-lg text-gray-700 leading-relaxed">
                                Each coupon may have specific terms, minimum purchase requirements, or product exclusions. Understanding these details helps you use coupons effectively.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                              3
                            </div>
                            <div>
                              <h4 className="text-xl font-semibold text-gray-900 mb-2">Stack Multiple Offers</h4>
                              <p className="text-lg text-gray-700 leading-relaxed">
                                Some retailers allow you to combine coupon codes with other promotions, loyalty points, or cashback offers for even greater savings.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                              4
                            </div>
                            <div>
                              <h4 className="text-xl font-semibold text-gray-900 mb-2">Sign Up for Newsletters</h4>
                              <p className="text-lg text-gray-700 leading-relaxed">
                                Many retailers offer exclusive coupon codes to newsletter subscribers. This is often the best way to access special deals and early access promotions.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Best Practices */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 md:p-10 border border-blue-100 shadow-sm">
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                          Best Practices for Coupon Usage
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white rounded-lg p-6">
                            <h4 className="text-lg font-bold text-gray-900 mb-3">Organize Your Coupons</h4>
                            <p className="text-gray-700 leading-relaxed">
                              Keep track of your favorite coupons by saving them to your account. This makes it easy to access them when you need them most.
                            </p>
                          </div>
                          
                          <div className="bg-white rounded-lg p-6">
                            <h4 className="text-lg font-bold text-gray-900 mb-3">Compare Prices</h4>
                            <p className="text-gray-700 leading-relaxed">
                              Even with a coupon, it's wise to compare prices across different retailers to ensure you're getting the best possible deal.
                            </p>
                          </div>
                          
                          <div className="bg-white rounded-lg p-6">
                            <h4 className="text-lg font-bold text-gray-900 mb-3">Use Mobile Apps</h4>
                            <p className="text-gray-700 leading-relaxed">
                              Many retailers offer additional discounts through their mobile apps. Download apps from your favorite stores for exclusive mobile-only deals.
                            </p>
                          </div>
                          
                          <div className="bg-white rounded-lg p-6">
                            <h4 className="text-lg font-bold text-gray-900 mb-3">Follow Social Media</h4>
                            <p className="text-gray-700 leading-relaxed">
                              Brands often share flash sales and limited-time coupon codes on their social media channels. Follow your favorite brands for instant access to new deals.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section 5: Conclusion */}
                      <div className="bg-white rounded-xl p-6 sm:p-8 md:p-10 border-2 border-orange-200 shadow-lg">
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                          Conclusion
                        </h3>
                        <p className="text-lg sm:text-xl leading-relaxed text-gray-700 mb-4">
                          Using coupons effectively is an art that can significantly reduce your shopping expenses. By following the tips and strategies outlined in this article, you can become a more informed and savvy shopper.
                        </p>
                        <p className="text-lg sm:text-xl leading-relaxed text-gray-700 mb-6">
                          Remember, the goal isn't just to save money, but to make smart purchasing decisions that align with your needs and budget. With the right approach, coupons can help you get more value from every purchase.
                        </p>
                        <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg p-6 text-white">
                          <p className="text-lg sm:text-xl font-semibold mb-2">
                            Ready to Start Saving?
                          </p>
                          <p className="text-base sm:text-lg opacity-90">
                            Explore our collection of verified coupons and exclusive deals to start saving on your next purchase. Join thousands of smart shoppers who are already maximizing their savings with AvailCoupon.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-8 sm:p-12 border border-gray-200 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg sm:text-xl text-gray-500 italic">
                      No content available for this article. Please add content in the admin panel.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Back to Blogs Button */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <Link
                href="/blogs"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to All Blogs
              </Link>
            </div>
          </article>
        </div>
      </div>

      {/* Newsletter Subscription */}
      <NewsletterSubscription />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

